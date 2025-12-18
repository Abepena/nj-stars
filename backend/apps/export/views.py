import logging
import json
import secrets
from urllib.parse import urlencode
from django.conf import settings
from django.core import signing
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# Google OAuth settings
GOOGLE_OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
]


def get_google_oauth_config():
    """Get Google OAuth configuration from settings."""
    return {
        'client_id': getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', ''),
        'client_secret': getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', ''),
        'redirect_uri': getattr(settings, 'GOOGLE_OAUTH_REDIRECT_URI',
                                'http://localhost:8000/api/export/google-sheets/callback/'),
    }


def create_oauth_state(user_id, return_url):
    """
    Create a signed OAuth state containing user_id and return_url.
    This allows the callback to identify the user without session continuity.
    """
    data = {
        'user_id': user_id,
        'return_url': return_url,
        'nonce': secrets.token_urlsafe(16),  # Prevent replay attacks
    }
    return signing.dumps(data, salt='google-oauth-state')


def parse_oauth_state(state):
    """
    Parse and verify the signed OAuth state.
    Returns (user_id, return_url) or (None, None) if invalid.
    """
    try:
        data = signing.loads(state, salt='google-oauth-state', max_age=3600)  # 1 hour expiry
        return data.get('user_id'), data.get('return_url', settings.FRONTEND_URL)
    except signing.BadSignature:
        logger.error("Invalid OAuth state signature")
        return None, None


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def google_sheets_authorize(request):
    """
    Start OAuth flow to connect user's Google account.

    GET /api/export/google-sheets/authorize/
    Returns: { "authorization_url": "https://accounts.google.com/..." }
    """
    config = get_google_oauth_config()

    if not config['client_id'] or not config['client_secret']:
        return Response(
            {'error': 'Google OAuth not configured'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Get return URL from request
    return_url = request.GET.get('return_url', settings.FRONTEND_URL)

    # Create signed state containing user_id and return_url
    state = create_oauth_state(request.user.id, return_url)

    # Build authorization URL manually to ensure our state is used
    params = {
        'response_type': 'code',
        'client_id': config['client_id'],
        'redirect_uri': config['redirect_uri'],
        'scope': ' '.join(GOOGLE_OAUTH_SCOPES),
        'state': state,
        'access_type': 'offline',
        'include_granted_scopes': 'true',
        'prompt': 'consent',
    }
    
    authorization_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"

    return Response({'authorization_url': authorization_url})


@api_view(['GET'])
def google_sheets_callback(request):
    """
    OAuth callback - exchange code for tokens and store them.

    GET /api/export/google-sheets/callback/?code=...&state=...
    Redirects to frontend with success/error status
    """
    import requests as http_requests
    from apps.portal.models import UserProfile

    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')

    # Parse the signed state to get user_id and return_url
    user_id, return_url = parse_oauth_state(state) if state else (None, settings.FRONTEND_URL)

    if not return_url:
        return_url = settings.FRONTEND_URL

    if error:
        logger.error(f"Google OAuth error: {error}")
        return HttpResponseRedirect(f"{return_url}?google_auth=error&message={error}")

    if not code or not user_id:
        logger.error(f"Invalid OAuth state or missing code. user_id={user_id}, has_code={bool(code)}")
        return HttpResponseRedirect(f"{return_url}?google_auth=error&message=invalid_state")

    config = get_google_oauth_config()

    try:
        # Exchange code for tokens manually
        token_response = http_requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': config['client_id'],
                'client_secret': config['client_secret'],
                'redirect_uri': config['redirect_uri'],
                'grant_type': 'authorization_code',
            }
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            return HttpResponseRedirect(f"{return_url}?google_auth=error&message=token_exchange_failed")
        
        tokens = token_response.json()

        # Store credentials in user profile
        try:
            profile = UserProfile.objects.get(user_id=user_id)
            profile.google_sheets_credentials = json.dumps({
                'token': tokens['access_token'],
                'refresh_token': tokens.get('refresh_token'),
                'token_uri': 'https://oauth2.googleapis.com/token',
                'client_id': config['client_id'],
                'client_secret': config['client_secret'],
                'scopes': GOOGLE_OAUTH_SCOPES,
            })
            profile.save()
            logger.info(f"Google credentials saved for user {user_id}")
        except UserProfile.DoesNotExist:
            logger.error(f"UserProfile not found for user {user_id}")
            return HttpResponseRedirect(f"{return_url}?google_auth=error&message=profile_not_found")

        return HttpResponseRedirect(f"{return_url}?google_auth=success")

    except Exception as e:
        logger.error(f"Google OAuth token exchange failed: {e}")
        return HttpResponseRedirect(f"{return_url}?google_auth=error&message=token_exchange_failed")


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def google_sheets_status(request):
    """
    Check if user has connected Google Sheets.

    GET /api/export/google-sheets/status/
    Returns: { "connected": true/false }
    """
    from apps.portal.models import UserProfile

    try:
        profile = UserProfile.objects.get(user=request.user)
        connected = bool(profile.google_sheets_credentials)
        return Response({'connected': connected})
    except UserProfile.DoesNotExist:
        return Response({'connected': False})


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def google_sheets_disconnect(request):
    """
    Disconnect Google Sheets integration.

    POST /api/export/google-sheets/disconnect/
    """
    from apps.portal.models import UserProfile

    try:
        profile = UserProfile.objects.get(user=request.user)
        profile.google_sheets_credentials = None
        profile.save()
        return Response({'status': 'disconnected'})
    except UserProfile.DoesNotExist:
        return Response({'status': 'not_found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def export_google_sheets(request):
    """
    Export data to Google Sheets using user's credentials.

    POST /api/export/google-sheets/
    {
        "data": [...],
        "columns": [{"key": "id", "label": "ID"}, ...],
        "sheet_name": "Cash Transactions"
    }
    """
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from apps.portal.models import UserProfile
    from datetime import datetime

    data = request.data.get('data', [])
    columns = request.data.get('columns', [])
    sheet_name = request.data.get('sheet_name', 'Export')

    if not data or not columns:
        return Response(
            {'error': 'Data and columns are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get user's Google credentials
    try:
        profile = UserProfile.objects.get(user=request.user)
        if not profile.google_sheets_credentials:
            return Response(
                {'error': 'Google Sheets not connected', 'needs_auth': True},
                status=status.HTTP_401_UNAUTHORIZED
            )

        creds_data = json.loads(profile.google_sheets_credentials)
        credentials = Credentials(
            token=creds_data['token'],
            refresh_token=creds_data.get('refresh_token'),
            token_uri=creds_data['token_uri'],
            client_id=creds_data['client_id'],
            client_secret=creds_data['client_secret'],
            scopes=creds_data['scopes'],
        )
    except UserProfile.DoesNotExist:
        return Response(
            {'error': 'User profile not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Invalid credentials format: {e}")
        return Response(
            {'error': 'Invalid stored credentials', 'needs_auth': True},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Build service with user credentials
        service = build('sheets', 'v4', credentials=credentials)

        # Create new spreadsheet
        spreadsheet = {
            'properties': {
                'title': f"{sheet_name} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            }
        }

        result = service.spreadsheets().create(
            body=spreadsheet,
            fields='spreadsheetId,spreadsheetUrl'
        ).execute()

        spreadsheet_id = result['spreadsheetId']
        spreadsheet_url = result['spreadsheetUrl']

        # Prepare data rows
        headers = [col['label'] for col in columns]
        rows = [
            [format_cell(row.get(col['key'])) for col in columns]
            for row in data
        ]

        # Write data to sheet
        values = [headers] + rows

        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range='A1',
            valueInputOption='USER_ENTERED',
            body={'values': values}
        ).execute()

        # Format header row
        requests_list = [
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
            {
                'updateSheetProperties': {
                    'properties': {'sheetId': 0, 'gridProperties': {'frozenRowCount': 1}},
                    'fields': 'gridProperties.frozenRowCount'
                }
            },
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

        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={'requests': requests_list}
        ).execute()

        # Update stored token if refreshed
        if credentials.token != creds_data['token']:
            creds_data['token'] = credentials.token
            profile.google_sheets_credentials = json.dumps(creds_data)
            profile.save()

        logger.info(f"Google Sheets export successful: {spreadsheet_url}")
        return Response({
            'sheet_id': spreadsheet_id,
            'sheet_url': spreadsheet_url
        })

    except Exception as e:
        logger.error(f"Google Sheets export failed: {e}")

        # Check if it's an auth error
        if 'invalid_grant' in str(e).lower() or 'token' in str(e).lower():
            return Response(
                {'error': 'Google authorization expired', 'needs_auth': True},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(
            {'error': f'Export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def format_cell(value) -> str:
    """Format cell value for Google Sheets."""
    if value is None:
        return ''
    if isinstance(value, bool):
        return 'Yes' if value else 'No'
    if isinstance(value, (int, float)):
        return str(value)
    return str(value)
