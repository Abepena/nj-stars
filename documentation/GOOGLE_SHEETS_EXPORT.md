# Google Sheets Export Configuration

> **Status:** ✅ Implemented
> **Priority:** Post-MVP Feature
> **Last Updated:** December 18, 2025

---

## Overview

This document outlines the implementation plan for Google Sheets export functionality:
1. **Phase 1 (MVP):** Single-org configuration for NJ Stars
2. **Phase 2 (Multi-tenant):** Self-service configuration for all organizations

---

## Phase 1: Single-Org Configuration (NJ Stars)

### Architecture

```
Frontend                 Backend                    Google
┌─────────────┐         ┌─────────────┐           ┌─────────────┐
│ ExportButton│ ──POST──▶│ /api/export/│──────────▶│ Sheets API  │
│             │         │ google-sheets│           │             │
│ (data,      │         │             │◀──────────│ Sheet URL   │
│  columns)   │◀────────│ (sheet_url) │           │             │
└─────────────┘         └─────────────┘           └─────────────┘
```

### Backend Implementation

#### 1. Create Google Cloud Service Account

```bash
# 1. Go to Google Cloud Console
# 2. Create new project or select existing: "nj-stars-leag"
# 3. Enable Google Sheets API
# 4. Create Service Account:
#    - Name: "leag-sheets-export"
#    - Role: None (we'll use domain-wide delegation or shared drive)
# 5. Create JSON key and download
```

#### 2. Environment Variables

```bash
# Backend .env (Railway)
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", "project_id": "...", ...}'

# OR store as file path
GOOGLE_SERVICE_ACCOUNT_FILE=/app/secrets/google-service-account.json
```

#### 3. Django App: Export Module

Create `apps/export/` with the following structure:

```
apps/export/
├── __init__.py
├── admin.py
├── apps.py
├── models.py          # ExportLog for tracking
├── serializers.py
├── services/
│   ├── __init__.py
│   └── google_sheets.py  # Core export logic
├── urls.py
└── views.py
```

#### 4. Google Sheets Service (`apps/export/services/google_sheets.py`)

```python
"""
Google Sheets export service using Service Account authentication.
"""
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
]


class GoogleSheetsExporter:
    """Exports data to Google Sheets using service account."""

    def __init__(self):
        self.service = None
        self.drive_service = None
        self._initialize_services()

    def _initialize_services(self):
        """Initialize Google API services."""
        if not getattr(settings, 'GOOGLE_SHEETS_ENABLED', False):
            logger.warning("Google Sheets export is not enabled")
            return

        try:
            # Load credentials from JSON string or file
            creds_json = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_JSON', None)
            creds_file = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)

            if creds_json:
                creds_info = json.loads(creds_json)
            elif creds_file:
                with open(creds_file) as f:
                    creds_info = json.load(f)
            else:
                raise ValueError("No Google service account credentials configured")

            credentials = service_account.Credentials.from_service_account_info(
                creds_info, scopes=SCOPES
            )

            self.service = build('sheets', 'v4', credentials=credentials)
            self.drive_service = build('drive', 'v3', credentials=credentials)

        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {e}")

    def export(
        self,
        data: List[Dict[str, Any]],
        columns: List[Dict[str, str]],
        sheet_name: str,
        share_with_email: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Export data to a new Google Sheet.

        Args:
            data: List of row data as dictionaries
            columns: Column definitions [{'key': 'id', 'label': 'ID'}, ...]
            sheet_name: Name for the spreadsheet
            share_with_email: Email to share the sheet with

        Returns:
            Dict with 'sheet_id' and 'sheet_url'
        """
        if not self.service:
            raise RuntimeError("Google Sheets service not initialized")

        # Create new spreadsheet
        spreadsheet = {
            'properties': {
                'title': f"{sheet_name} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            }
        }

        result = self.service.spreadsheets().create(
            body=spreadsheet,
            fields='spreadsheetId,spreadsheetUrl'
        ).execute()

        spreadsheet_id = result['spreadsheetId']
        spreadsheet_url = result['spreadsheetUrl']

        # Prepare data rows
        headers = [col['label'] for col in columns]
        rows = [
            [self._format_cell(row.get(col['key'])) for col in columns]
            for row in data
        ]

        # Write data to sheet
        values = [headers] + rows

        self.service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range='A1',
            valueInputOption='USER_ENTERED',
            body={'values': values}
        ).execute()

        # Format header row (bold, frozen)
        requests = [
            # Bold header row
            {
                'repeatCell': {
                    'range': {'sheetId': 0, 'startRowIndex': 0, 'endRowIndex': 1},
                    'cell': {
                        'userEnteredFormat': {
                            'textFormat': {'bold': True},
                            'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9}
                        }
                    },
                    'fields': 'userEnteredFormat(textFormat,backgroundColor)'
                }
            },
            # Freeze header row
            {
                'updateSheetProperties': {
                    'properties': {'sheetId': 0, 'gridProperties': {'frozenRowCount': 1}},
                    'fields': 'gridProperties.frozenRowCount'
                }
            },
            # Auto-resize columns
            {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': 0,
                        'dimension': 'COLUMNS',
                        'startIndex': 0,
                        'endIndex': len(columns)
                    }
                }
            }
        ]

        self.service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={'requests': requests}
        ).execute()

        # Share with user if email provided
        if share_with_email:
            self.drive_service.permissions().create(
                fileId=spreadsheet_id,
                body={
                    'type': 'user',
                    'role': 'writer',
                    'emailAddress': share_with_email
                },
                fields='id'
            ).execute()

        # Make publicly viewable with link (optional, or share with specific domain)
        # Uncomment if you want anyone with link to view:
        # self.drive_service.permissions().create(
        #     fileId=spreadsheet_id,
        #     body={'type': 'anyone', 'role': 'reader'},
        #     fields='id'
        # ).execute()

        return {
            'sheet_id': spreadsheet_id,
            'sheet_url': spreadsheet_url
        }

    def _format_cell(self, value) -> str:
        """Format cell value for Google Sheets."""
        if value is None:
            return ''
        if isinstance(value, bool):
            return 'Yes' if value else 'No'
        if isinstance(value, (int, float)):
            return str(value)
        return str(value)
```

#### 5. Export API View (`apps/export/views.py`)

```python
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services.google_sheets import GoogleSheetsExporter


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_google_sheets(request):
    """
    Export data to Google Sheets.

    POST /api/export/google-sheets/
    {
        "data": [...],
        "columns": [{"key": "id", "label": "ID"}, ...],
        "sheet_name": "Cash Transactions"
    }
    """
    data = request.data.get('data', [])
    columns = request.data.get('columns', [])
    sheet_name = request.data.get('sheet_name', 'Export')

    if not data or not columns:
        return Response(
            {'error': 'Data and columns are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        exporter = GoogleSheetsExporter()
        result = exporter.export(
            data=data,
            columns=columns,
            sheet_name=sheet_name,
            share_with_email=request.user.email
        )

        return Response(result)

    except RuntimeError as e:
        return Response(
            {'error': str(e), 'fallback': 'csv'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        return Response(
            {'error': f'Export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

#### 6. URL Configuration (`apps/export/urls.py`)

```python
from django.urls import path
from . import views

urlpatterns = [
    path('google-sheets/', views.export_google_sheets, name='export-google-sheets'),
]
```

Add to main `config/urls.py`:
```python
path('api/export/', include('apps.export.urls')),
```

### Setup Steps for NJ Stars

1. **Create Google Cloud Project**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create project: `nj-stars-leag`
   - Enable APIs: Google Sheets API, Google Drive API

2. **Create Service Account**
   - IAM & Admin > Service Accounts > Create
   - Name: `leag-sheets-export`
   - Download JSON key

3. **Configure Railway**
   - Add environment variable:
   ```
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_SERVICE_ACCOUNT_JSON=<paste entire JSON as string>
   ```

4. **Test Export**
   - Go to Cash Reconciliation page
   - Click Export > Export to Google Sheets
   - Sheet should open in new tab, shared with your email

---

## Phase 2: Multi-Tenant Self-Service (Post-MVP)

### User Flow

```
Organization Admin → Settings → Integrations → Google Sheets
                                    │
                                    ▼
                          ┌─────────────────────┐
                          │ Connect Google      │
                          │ [Authorize]         │
                          │                     │
                          │ ☐ Auto-export daily │
                          │ ☐ Share with team   │
                          └─────────────────────┘
```

### Database Models

```python
# apps/portal/models.py (add to existing)

class OrganizationIntegration(models.Model):
    """Stores organization-level integration settings."""

    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
    integration_type = models.CharField(max_length=50, choices=[
        ('google_sheets', 'Google Sheets'),
        ('quickbooks', 'QuickBooks'),
        ('slack', 'Slack'),
    ])

    # OAuth tokens (encrypted)
    access_token = models.TextField(blank=True)  # Encrypt in production!
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True)

    # Settings
    settings = models.JSONField(default=dict)  # e.g., {"auto_export": true, "folder_id": "..."}

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['organization', 'integration_type']


class ExportSchedule(models.Model):
    """Scheduled automatic exports."""

    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
    export_type = models.CharField(max_length=50, choices=[
        ('cash_transactions', 'Cash Transactions'),
        ('event_registrations', 'Event Registrations'),
        ('orders', 'Shop Orders'),
        ('dues', 'Dues Payments'),
    ])

    destination = models.CharField(max_length=50, choices=[
        ('google_sheets', 'Google Sheets'),
        ('email_csv', 'Email CSV'),
    ])

    schedule = models.CharField(max_length=50, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ])

    last_run_at = models.DateTimeField(null=True)
    next_run_at = models.DateTimeField(null=True)

    is_active = models.BooleanField(default=True)
```

### OAuth Flow for User Authorization

```python
# apps/export/views.py

from django.shortcuts import redirect
from google_auth_oauthlib.flow import Flow

GOOGLE_CLIENT_CONFIG = {
    "web": {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [settings.GOOGLE_SHEETS_REDIRECT_URI],
    }
}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_sheets_authorize(request):
    """Start OAuth flow to connect user's Google account."""

    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=[
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ],
        redirect_uri=settings.GOOGLE_SHEETS_REDIRECT_URI
    )

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )

    # Store state in session
    request.session['google_oauth_state'] = state

    return Response({'authorization_url': authorization_url})


@api_view(['GET'])
def google_sheets_callback(request):
    """OAuth callback - exchange code for tokens."""

    state = request.session.get('google_oauth_state')
    code = request.GET.get('code')

    flow = Flow.from_client_config(
        GOOGLE_CLIENT_CONFIG,
        scopes=[
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
        ],
        state=state,
        redirect_uri=settings.GOOGLE_SHEETS_REDIRECT_URI
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Store tokens in OrganizationIntegration
    org = request.user.get_organization()  # Implement based on your multi-tenant model

    integration, _ = OrganizationIntegration.objects.update_or_create(
        organization=org,
        integration_type='google_sheets',
        defaults={
            'access_token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_expires_at': credentials.expiry,
            'is_active': True,
        }
    )

    # Redirect back to settings page
    return redirect(f"{settings.FRONTEND_URL}/portal/settings/integrations?success=google_sheets")
```

### Frontend Integration Settings Page

```tsx
// frontend/src/app/portal/settings/integrations/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Check, Link2, Unlink } from "lucide-react"

export default function IntegrationsPage() {
  const [googleConnected, setGoogleConnected] = useState(false)
  const [autoExport, setAutoExport] = useState(false)

  const handleConnectGoogle = async () => {
    const response = await fetch('/api/export/google-sheets/authorize/')
    const { authorization_url } = await response.json()
    window.location.href = authorization_url
  }

  const handleDisconnect = async () => {
    await fetch('/api/export/google-sheets/disconnect/', { method: 'POST' })
    setGoogleConnected(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect external services to automate exports and sync data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/icons/google-sheets.svg" className="h-6 w-6" />
            Google Sheets
          </CardTitle>
          <CardDescription>
            Export cash transactions, registrations, and orders directly to Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                Connected
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-export daily</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically export all transactions at midnight
                  </div>
                </div>
                <Switch checked={autoExport} onCheckedChange={setAutoExport} />
              </div>

              <Button variant="outline" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnectGoogle}>
              <Link2 className="h-4 w-4 mr-2" />
              Connect Google Account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Security Considerations

1. **Token Encryption**: Use `django-fernet-fields` or similar to encrypt OAuth tokens at rest
2. **Scope Limitation**: Only request minimum required scopes
3. **Token Refresh**: Implement automatic token refresh before expiry
4. **Audit Logging**: Log all export actions for compliance
5. **Rate Limiting**: Implement rate limits to prevent abuse

### Implementation Timeline

| Phase | Feature | Effort |
|-------|---------|--------|
| **MVP** | Service account export for NJ Stars | 2-3 hours |
| **Post-MVP Week 1** | User OAuth flow | 4-6 hours |
| **Post-MVP Week 2** | Integration settings UI | 3-4 hours |
| **Post-MVP Week 3** | Scheduled exports (Celery) | 4-6 hours |
| **Post-MVP Week 4** | Multi-tenant isolation | 2-3 hours |

---

## Quick Start (MVP)

### 1. Install Dependencies

```bash
# Backend
pip install google-auth google-auth-oauthlib google-api-python-client
```

### 2. Create Export App

```bash
cd backend
python manage.py startapp export
mv export apps/
```

### 3. Add to Settings

```python
# config/settings/base.py
INSTALLED_APPS = [
    ...
    'apps.export',
]

GOOGLE_SHEETS_ENABLED = env.bool('GOOGLE_SHEETS_ENABLED', default=False)
GOOGLE_SERVICE_ACCOUNT_JSON = env.str('GOOGLE_SERVICE_ACCOUNT_JSON', default='')
```

### 4. Configure Railway

Add these environment variables:
- `GOOGLE_SHEETS_ENABLED=true`
- `GOOGLE_SERVICE_ACCOUNT_JSON=<json content>`

### 5. Test

Navigate to any page with Export button and click "Export to Google Sheets"

---

## Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Python Client Library](https://github.com/googleapis/google-api-python-client)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)

---

## API Testing with Insomnia/Postman

This section explains how to test the Google Sheets export API using REST clients like Insomnia or Postman.

### Step 1: Get Authentication Token

The export endpoint requires authentication. First, you need to obtain an auth token.

#### Request: Login

```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

#### Response (Success)

```json
{
  "key": "your-auth-token-here-abc123xyz789"
}
```

**In Insomnia:**
1. Create a new POST request to `http://localhost:8000/api/auth/login/`
2. Set Body to JSON with your credentials
3. Send request and copy the `key` value from response

**In Postman:**
1. Create new POST request
2. Go to Body → raw → JSON
3. Enter credentials
4. Copy `key` from response

---

### Step 2: Export to Google Sheets

Use the token to authenticate the export request.

#### Request: Export

```http
POST http://localhost:8000/api/export/google-sheets/
Content-Type: application/json
Authorization: Token your-auth-token-here-abc123xyz789

{
  "data": [
    {"id": 1, "name": "John Doe", "amount": 150.00, "status": "paid"},
    {"id": 2, "name": "Jane Smith", "amount": 75.50, "status": "pending"},
    {"id": 3, "name": "Bob Johnson", "amount": 200.00, "status": "paid"}
  ],
  "columns": [
    {"key": "id", "label": "ID"},
    {"key": "name", "label": "Player Name"},
    {"key": "amount", "label": "Amount ($)"},
    {"key": "status", "label": "Payment Status"}
  ],
  "sheet_name": "Cash Transactions"
}
```

#### Response (Success)

```json
{
  "sheet_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheet_url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
}
```

---

### Insomnia Setup (Step-by-Step)

#### 1. Create Login Request
- **Method:** POST
- **URL:** `http://localhost:8000/api/auth/login/`
- **Body Tab:** JSON
  ```json
  {
    "email": "admin@njstarselite.com",
    "password": "your-password"
  }
  ```
- Click **Send** and copy the `key` value

#### 2. Create Export Request
- **Method:** POST
- **URL:** `http://localhost:8000/api/export/google-sheets/`
- **Headers Tab:** Add header:
  - Name: `Authorization`
  - Value: `Token <paste-your-token-here>`
- **Body Tab:** JSON
  ```json
  {
    "data": [
      {"id": 1, "name": "Test Player", "amount": 100}
    ],
    "columns": [
      {"key": "id", "label": "ID"},
      {"key": "name", "label": "Name"},
      {"key": "amount", "label": "Amount"}
    ],
    "sheet_name": "Test Export"
  }
  ```
- Click **Send**

#### 3. Using Environment Variables (Recommended)

Create an Insomnia environment for easier token management:

```json
{
  "base_url": "http://localhost:8000",
  "auth_token": ""
}
```

Then use `{{ base_url }}` and `{{ auth_token }}` in your requests.

---

### Postman Setup (Step-by-Step)

#### 1. Create Collection
- Create new collection: "NJ Stars API"
- Add collection variable: `base_url` = `http://localhost:8000`
- Add collection variable: `auth_token` = (leave empty initially)

#### 2. Login Request with Auto-Token Save
- **Method:** POST
- **URL:** `{{base_url}}/api/auth/login/`
- **Body:** raw JSON
  ```json
  {
    "email": "admin@njstarselite.com",
    "password": "your-password"
  }
  ```
- **Tests Tab:** Add script to auto-save token:
  ```javascript
  if (pm.response.code === 200) {
      const response = pm.response.json();
      pm.collectionVariables.set("auth_token", response.key);
  }
  ```

#### 3. Export Request
- **Method:** POST
- **URL:** `{{base_url}}/api/export/google-sheets/`
- **Authorization Tab:**
  - Type: API Key
  - Key: `Authorization`
  - Value: `Token {{auth_token}}`
  - Add to: Header
- **Body:** raw JSON (same as above)

---

### Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Fix:** Add `Authorization: Token <your-token>` header

#### 400 Bad Request
```json
{
  "error": "Data and columns are required"
}
```
**Fix:** Ensure both `data` and `columns` arrays are provided and non-empty

#### 503 Service Unavailable
```json
{
  "error": "Google Sheets service not initialized. Check GOOGLE_SHEETS_ENABLED and credentials.",
  "fallback": "csv"
}
```
**Fix:** Check backend environment variables and credentials file

---

### cURL Examples

For quick command-line testing:

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@njstarselite.com", "password": "your-password"}'
```

#### Export
```bash
curl -X POST http://localhost:8000/api/export/google-sheets/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token your-token-here" \
  -d '{
    "data": [{"id": 1, "name": "Test", "amount": 100}],
    "columns": [
      {"key": "id", "label": "ID"},
      {"key": "name", "label": "Name"},
      {"key": "amount", "label": "Amount"}
    ],
    "sheet_name": "CLI Test"
  }'
```

---

### Tips

1. **Token Persistence:** Auth tokens don't expire quickly, so you can reuse them across multiple requests
2. **Sheet Naming:** The `sheet_name` will have a timestamp appended (e.g., "Cash Transactions - 2025-12-18 14:30")
3. **Sharing:** The created sheet is automatically shared with the authenticated user's email and made publicly viewable with link
4. **Column Order:** The `columns` array determines the order of columns in the exported sheet
