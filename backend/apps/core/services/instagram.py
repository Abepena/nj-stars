"""
Instagram API services for token management and post syncing.

Handles:
- Token refresh (before 60-day expiry)
- Post fetching from Instagram Graph API
- Error handling and logging
"""

import logging
import requests
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

# Instagram Graph API configuration
GRAPH_API_VERSION = 'v18.0'
FACEBOOK_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'
INSTAGRAM_API_BASE = 'https://graph.instagram.com'


def get_api_base(access_token: str) -> str:
    """Determine API base URL based on token type (IG vs EA tokens)."""
    if access_token.startswith('IG'):
        return INSTAGRAM_API_BASE
    return FACEBOOK_API_BASE


class InstagramAPIError(Exception):
    """Custom exception for Instagram API errors"""
    def __init__(self, message, error_code=None, error_subcode=None):
        self.message = message
        self.error_code = error_code
        self.error_subcode = error_subcode
        super().__init__(self.message)


def refresh_instagram_token(credential):
    """
    Refresh an Instagram long-lived access token.

    Long-lived tokens can be refreshed to get a new 60-day expiry,
    as long as the current token hasn't expired yet.

    Args:
        credential: InstagramCredential model instance

    Returns:
        tuple: (success: bool, message: str)

    Raises:
        InstagramAPIError: If the API returns an error
    """
    from apps.core.models import InstagramCredential

    if credential.is_expired:
        return False, "Token has expired. Manual re-authorization required."

    # Instagram (IG) tokens don't need app credentials for refresh
    is_ig_token = credential.access_token.startswith('IG')

    # Get app credentials from environment (needed for Facebook/EA tokens only)
    app_id = getattr(settings, 'META_APP_ID', '')
    app_secret = getattr(settings, 'META_APP_SECRET', '')

    if not is_ig_token and (not app_id or not app_secret):
        return False, "META_APP_ID and META_APP_SECRET environment variables required for Facebook token refresh."

    # Instagram (IG) tokens use a different refresh endpoint than Facebook (EA) tokens
    if credential.access_token.startswith('IG'):
        # Instagram API token refresh
        url = f'{INSTAGRAM_API_BASE}/refresh_access_token'
        params = {
            'grant_type': 'ig_refresh_token',
            'access_token': credential.access_token,
        }
    else:
        # Facebook API token refresh
        url = f'{FACEBOOK_API_BASE}/oauth/access_token'
        params = {
            'grant_type': 'fb_exchange_token',
            'client_id': app_id,
            'client_secret': app_secret,
            'fb_exchange_token': credential.access_token,
        }

    try:
        logger.info(f"Refreshing token for @{credential.instagram_username}")
        response = requests.get(url, params=params, timeout=30)

        if response.status_code != 200:
            error_data = response.json().get('error', {})
            error_msg = error_data.get('message', 'Unknown error')
            error_code = error_data.get('code')

            logger.error(f"Token refresh failed for @{credential.instagram_username}: {error_msg}")

            # Update credential with error
            credential.last_error = f"Refresh failed: {error_msg}"
            credential.save(update_fields=['last_error', 'updated_at'])

            raise InstagramAPIError(error_msg, error_code=error_code)

        data = response.json()
        new_token = data.get('access_token')
        expires_in = data.get('expires_in', 5184000)  # Default 60 days in seconds

        if not new_token:
            return False, "No access token in response"

        # Update credential with new token
        credential.access_token = new_token
        credential.token_expires_at = timezone.now() + timedelta(seconds=expires_in)
        credential.last_refreshed_at = timezone.now()
        credential.last_error = ''  # Clear any previous errors
        credential.save(update_fields=[
            'access_token',
            'token_expires_at',
            'last_refreshed_at',
            'last_error',
            'updated_at'
        ])

        logger.info(
            f"Token refreshed for @{credential.instagram_username}. "
            f"New expiry: {credential.token_expires_at}"
        )

        return True, f"Token refreshed successfully. Expires in {credential.days_until_expiry} days."

    except requests.exceptions.RequestException as e:
        error_msg = f"Network error during token refresh: {str(e)}"
        logger.error(error_msg)
        credential.last_error = error_msg
        credential.save(update_fields=['last_error', 'updated_at'])
        return False, error_msg


def refresh_all_expiring_tokens(days_threshold=7):
    """
    Refresh all tokens that are expiring within the threshold.

    Args:
        days_threshold: Refresh tokens expiring within this many days

    Returns:
        dict: Summary of refresh results
    """
    from apps.core.models import InstagramCredential

    results = {
        'checked': 0,
        'refreshed': 0,
        'failed': 0,
        'skipped': 0,
        'details': []
    }

    credentials = InstagramCredential.objects.filter(is_active=True)

    for credential in credentials:
        results['checked'] += 1

        if credential.is_expired:
            results['details'].append({
                'account': credential.instagram_username,
                'status': 'expired',
                'message': 'Token expired - manual re-auth required'
            })
            results['failed'] += 1
            continue

        if not credential.needs_refresh and credential.days_until_expiry > days_threshold:
            results['details'].append({
                'account': credential.instagram_username,
                'status': 'skipped',
                'message': f'Token valid for {credential.days_until_expiry} days'
            })
            results['skipped'] += 1
            continue

        if not credential.can_refresh:
            results['details'].append({
                'account': credential.instagram_username,
                'status': 'skipped',
                'message': 'Missing app credentials for refresh'
            })
            results['skipped'] += 1
            continue

        # Attempt refresh
        success, message = refresh_instagram_token(credential)

        if success:
            results['refreshed'] += 1
            results['details'].append({
                'account': credential.instagram_username,
                'status': 'refreshed',
                'message': message
            })
        else:
            results['failed'] += 1
            results['details'].append({
                'account': credential.instagram_username,
                'status': 'failed',
                'message': message
            })

    return results


def get_token_status_report():
    """
    Generate a status report for all Instagram credentials.

    Returns:
        list: Status information for each credential
    """
    from apps.core.models import InstagramCredential

    report = []
    for credential in InstagramCredential.objects.all():
        report.append({
            'account': credential.instagram_username,
            'name': credential.account_name,
            'is_active': credential.is_active,
            'is_primary': credential.is_primary,
            'status': credential.token_status,
            'days_until_expiry': credential.days_until_expiry,
            'needs_refresh': credential.needs_refresh,
            'can_refresh': credential.can_refresh,
            'last_sync': credential.last_sync_at,
            'last_error': credential.last_error,
        })

    return report


def verify_token(credential):
    """
    Verify that a token is still valid by making a test API call.

    Args:
        credential: InstagramCredential model instance

    Returns:
        tuple: (valid: bool, message: str)
    """
    api_base = get_api_base(credential.access_token)
    url = f'{api_base}/me'
    params = {
        'access_token': credential.access_token,
        'fields': 'id,username'
    }

    try:
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            return True, f"Token valid for user {data.get('username', data.get('id'))}"
        else:
            error = response.json().get('error', {}).get('message', 'Unknown error')
            return False, f"Token invalid: {error}"

    except requests.exceptions.RequestException as e:
        return False, f"Network error: {str(e)}"
