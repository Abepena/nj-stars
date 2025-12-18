"""
Google Sheets export service using Service Account authentication.
"""
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from django.conf import settings

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
            # Import Google libraries
            from google.oauth2 import service_account
            from googleapiclient.discovery import build

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
            logger.info("Google Sheets service initialized successfully")

        except ImportError as e:
            logger.error(f"Google API libraries not installed: {e}")
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
            raise RuntimeError("Google Sheets service not initialized. Check GOOGLE_SHEETS_ENABLED and credentials.")

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
            try:
                self.drive_service.permissions().create(
                    fileId=spreadsheet_id,
                    body={
                        'type': 'user',
                        'role': 'writer',
                        'emailAddress': share_with_email
                    },
                    fields='id',
                    sendNotificationEmail=False
                ).execute()
                logger.info(f"Sheet shared with {share_with_email}")
            except Exception as e:
                logger.warning(f"Failed to share sheet with {share_with_email}: {e}")

        # Make publicly viewable with link
        try:
            self.drive_service.permissions().create(
                fileId=spreadsheet_id,
                body={'type': 'anyone', 'role': 'reader'},
                fields='id'
            ).execute()
            logger.info("Sheet made publicly viewable with link")
        except Exception as e:
            logger.warning(f"Failed to make sheet public: {e}")

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
