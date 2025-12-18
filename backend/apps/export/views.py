import logging
import json
from django.conf import settings
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


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def google_sheets_authorize(request):
    """
    Start OAuth flow to connect user's Google account.
    
    GET /api/export/google-sheets/authorize/
    Returns: { "authorization_url": "https://accounts.google.com/..." }
    """
    from google_auth_oauthlib.flow import Flow
    
    config = get_google_oauth_config()
    
    if not config['client_id'] or not config['client_secret']:
        return Response(
            {'error': 'Google OAuth not configured'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Store return URL in session
    return_url = request.GET.get('return_url', settings.FRONTEND_URL)
    request.session['google_oauth_return_url'] = return_url
    request.session['google_oauth_user_id'] = request.user.id
    
    client_config = {
        "web": {
            "client_id": config['client_id'],
            "client_secret": config['client_secret'],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [config['redirect_uri']],
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_OAUTH_SCOPES,
        redirect_uri=config['redirect_uri']
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    # Store state for validation
    request.session['google_oauth_state'] = state
    
    return Response({'authorization_url': authorization_url})


@api_view(['GET'])
def google_sheets_callback(request):
    """
    OAuth callback - exchange code for tokens and store them.
    
    GET /api/export/google-sheets/callback/?code=...&state=...
    Redirects to frontend with success/error status
    """
    from google_auth_oauthlib.flow import Flow
    from apps.portal.models import UserProfile
    
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')
    
    return_url = request.session.get('google_oauth_return_url', settings.FRONTEND_URL)
    stored_state = request.session.get('google_oauth_state')
    user_id = request.session.get('google_oauth_user_id')
    
    if error:
        logger.error(f"Google OAuth error: {error}")
        return HttpResponseRedirect(f"{return_url}?google_auth=error&message={error}")
    
    if not code or state != stored_state:
        logger.error("Invalid OAuth state or missing code")
        return HttpResponseRedirect(f"{return_url}?google_auth=error&message=invalid_state")
    
    config = get_google_oauth_config()
    
    client_config = {
        "web": {
            "client_id": config['client_id'],
            "client_secret": config['client_secret'],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [config['redirect_uri']],
        }
    }
    
    try:
        flow = Flow.from_client_config(
            client_config,
            scopes=GOOGLE_OAUTH_SCOPES,
            state=state,
            redirect_uri=config['redirect_uri']
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Store credentials in user profile
        if user_id:
            try:
                profile = UserProfile.objects.get(user_id=user_id)
                profile.google_sheets_credentials = json.dumps({
                    'token': credentials.token,
                    'refresh_token': credentials.refresh_token,
                    'token_uri': credentials.token_uri,
                    'client_id': credentials.client_id,
                    'client_secret': credentials.client_secret,
                    'scopes': list(credentials.scopes),
                })
                profile.save()
                logger.info(f"Google credentials saved for user {user_id}")
            except UserProfile.DoesNotExist:
                logger.error(f"UserProfile not found for user {user_id}")
                return HttpResponseRedirect(f"{return_url}?google_auth=error&message=profile_not_found")
        
        # Clean up session
        request.session.pop('google_oauth_state', None)
        request.session.pop('google_oauth_return_url', None)
        request.session.pop('google_oauth_user_id', None)
        
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
        requests = [
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
            body={'requests': requests}
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
