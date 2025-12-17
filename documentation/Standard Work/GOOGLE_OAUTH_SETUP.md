# Google OAuth Setup Guide

> **Status:** Code is fully configured. Only credentials are needed.

This guide walks you through setting up Google OAuth for the NJ Stars platform. Google authentication allows users to sign in with their Google accounts.

---

## Prerequisites

- Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

---

## Code Configuration (Already Complete)

The codebase is already configured for Google OAuth:

**Backend (`backend/config/settings/base.py` lines 227-235):**
```python
'google': {
    'SCOPE': ['profile', 'email'],
    'AUTH_PARAMS': {'access_type': 'online'},
    'APP': {
        'client_id': config('GOOGLE_CLIENT_ID', default=''),
        'secret': config('GOOGLE_CLIENT_SECRET', default=''),
    }
}
```

**Frontend (`frontend/src/auth.ts` lines 59-68):**
```typescript
Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
        params: {
            scope: 'openid email profile',
        },
    },
}),
```

---

## Setup Steps

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "New Project"
4. Enter project name: "NJ Stars Elite"
5. Click "Create"
6. Wait for the project to be created, then select it

### Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google+ API** (legacy, but sometimes required)
   - **Google People API** (for profile info)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select User Type:
   - **External** (for all Google users)
3. Click "Create"

**Fill in the form:**
- App name: `NJ Stars Elite`
- User support email: Your email
- App logo: Upload team logo (optional)
- App domain: `njstarselite.com`
- Authorized domains: `njstarselite.com`
- Developer contact email: Your email

4. Click "Save and Continue"

**Scopes:**
1. Click "Add or Remove Scopes"
2. Select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click "Update" → "Save and Continue"

**Test Users (Development only):**
- Add any Google accounts that need to test before publishing
- Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `NJ Stars Web App`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://njstarselite.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://njstarselite.com/api/auth/callback/google
```

5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

---

## Environment Variables

### Development (Local)

**Frontend (`frontend/.env.local`):**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

**Backend (`backend/.env.local`):**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Production

**Vercel (Frontend):**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   - `GOOGLE_CLIENT_ID` = your_client_id
   - `GOOGLE_CLIENT_SECRET` = your_client_secret

**Railway (Backend):**
1. Go to Railway Dashboard → Project → Variables
2. Add the same variables

---

## Testing

### Local Development

1. Start the development servers:
   ```bash
   make up  # Docker
   # OR
   cd frontend && npm run dev
   cd backend && python manage.py runserver
   ```

2. Navigate to `http://localhost:3000/portal/login`

3. Click "Continue with Google"

4. You should see:
   - Google account selection screen
   - Permission consent (first time only)
   - Redirect back to the app
   - Logged in state with user info

### Verification Checklist

- [ ] "Continue with Google" button appears on login page
- [ ] Clicking redirects to Google's auth screen
- [ ] Can select/enter Google account
- [ ] Consent screen shows correct app name and permissions
- [ ] After approval, redirects back to app
- [ ] User is logged in with correct email and name
- [ ] User profile is created/synced in Django backend
- [ ] Session persists across page refreshes

---

## Publishing for Production

Before going live:

1. **OAuth Consent Screen:**
   - Go to OAuth consent screen
   - Click "Publish App"
   - This moves from "Testing" to "Production"
   - **Note:** If requesting sensitive scopes, Google may require verification

2. **Update Redirect URIs:**
   - Ensure production URLs are in the authorized redirect URIs
   - Remove localhost URLs if not needed (or keep for debugging)

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- The redirect URI in the request doesn't match the authorized URIs
- Check for trailing slashes, http vs https, and exact domain match
- Add the exact redirect URI shown in the error to your credentials

### "Access blocked: This app's request is invalid"
- OAuth consent screen not configured correctly
- Ensure all required fields are filled
- Check that the app is published (for production)

### "Error 403: access_denied"
- User denied permission
- Check that required scopes are minimal (email, profile, openid)

### User not syncing to Django
- Check the `/api/portal/social-auth/` endpoint logs
- Verify `NEXTAUTH_SECRET` is set correctly
- Check that the backend can receive the OAuth callback

### "invalid_client" error
- Client ID or secret is incorrect
- Credentials may have been deleted/regenerated
- Check for extra whitespace in environment variables

---

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use different credentials** for development and production
3. **Restrict API keys** to specific domains in production
4. **Rotate secrets** if they may have been exposed
5. **Monitor usage** in Google Cloud Console for unusual activity

---

## Related Documentation

- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Django allauth Google Provider](https://django-allauth.readthedocs.io/en/latest/providers.html#google)
