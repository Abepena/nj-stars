# Social Authentication Strategy

> **Recommendation:** Enable Facebook Login first; add Apple Sign In when developing the mobile app.

---

## Executive Summary

Both Facebook and Apple authentication are already configured in the codebase. This document recommends **prioritizing Facebook Login** for the initial launch, with Apple Sign In added later when the mobile app is developed.

---

## Comparison

| Factor | Facebook | Apple |
|--------|----------|-------|
| **Cost** | Free | $99/year (Developer Program) |
| **HTTPS Required** | No (development) | Yes (always) |
| **Localhost Testing** | Supported | Not supported |
| **Setup Complexity** | Moderate | High |
| **User Base** | Cross-platform, large | iOS/macOS users |
| **Mobile App Benefit** | Optional | Required for iOS App Store |
| **Time to Setup** | 15-30 minutes | 1-2 hours |

---

## Recommended Phased Approach

### Phase 1: Launch (Now) - Facebook Login

**Why Facebook First:**
- Free to set up and use
- Works on localhost without HTTPS
- Large user base across all platforms
- Simpler configuration process
- No annual fees

### Phase 2: Mobile App (Later) - Apple Sign In

**Why Apple Later:**
- Requires Apple Developer Program ($99/year) - needed anyway for iOS app
- iOS apps offering social login **must** include Apple Sign In (App Store requirement)
- Requires HTTPS even in development
- More complex setup with private keys and service IDs
- By Phase 2, production will have HTTPS configured

---

## Code Status

Both providers are already configured in the codebase:

**Frontend (NextAuth.js):** `frontend/src/auth.ts`
```typescript
// Facebook - lines 69-72
Facebook({
  clientId: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
}),

// Apple - lines 73-76
Apple({
  clientId: process.env.APPLE_CLIENT_ID,
  clientSecret: process.env.APPLE_CLIENT_SECRET,
}),
```

**Backend (Django allauth):** `backend/config/settings/base.py`
```python
# Facebook - lines 236-242
'facebook': {
    'METHOD': 'oauth2',
    'SCOPE': ['email', 'public_profile'],
    'APP': {
        'client_id': config('FACEBOOK_APP_ID', default=''),
        'secret': config('FACEBOOK_APP_SECRET', default=''),
    }
}

# Apple - lines 244-250
'apple': {
    'APP': {
        'client_id': config('APPLE_CLIENT_ID', default=''),
        'secret': config('APPLE_KEY_ID', default=''),
        'key': config('APPLE_PRIVATE_KEY', default=''),
    }
}
```

---

## Phase 1: Facebook Login Setup

### Step 1: Create Facebook Developer Account
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Log in with your Facebook account
3. Accept the developer terms

### Step 2: Create a New App
1. Click "My Apps" → "Create App"
2. Select "Consumer" as the app type
3. Enter app name: "NJ Stars Elite"
4. Enter contact email
5. Click "Create App"

### Step 3: Add Facebook Login Product
1. From the app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web"
4. Enter site URL: `http://localhost:3000` (development)

### Step 4: Configure OAuth Settings
1. Go to Facebook Login → Settings
2. Add Valid OAuth Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://njstarselite.com/api/auth/callback/facebook`
3. Save changes

### Step 5: Get Credentials
1. Go to Settings → Basic
2. Copy the **App ID**
3. Click "Show" next to App Secret and copy it

### Step 6: Configure Environment Variables

**Frontend (`frontend/.env.local`):**
```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

**Backend (`backend/.env`):**
```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

### Step 7: App Review (Production)
Before going live:
1. Complete the "App Review" process
2. Request `email` and `public_profile` permissions
3. Submit app for review
4. Switch app from "Development" to "Live" mode

---

## Phase 2: Apple Sign In Setup (Future Reference)

> **Prerequisites:**
> - Apple Developer Program membership ($99/year)
> - HTTPS configured (required for all environments)
> - A registered App ID or Services ID

### Step 1: Apple Developer Program
1. Enroll at [developer.apple.com/programs](https://developer.apple.com/programs)
2. Pay the $99/year fee
3. Complete identity verification

### Step 2: Create a Services ID
1. Go to Certificates, Identifiers & Profiles
2. Click Identifiers → Add (+)
3. Select "Services IDs"
4. Enter identifier: `com.njstarselite.web`
5. Enable "Sign In with Apple"

### Step 3: Configure Web Authentication
1. Click "Configure" next to Sign In with Apple
2. Select Primary App ID
3. Add Domains and Subdomains:
   - `njstarselite.com`
4. Add Return URLs:
   - `https://njstarselite.com/api/auth/callback/apple`

### Step 4: Create a Private Key
1. Go to Keys → Add (+)
2. Enable "Sign In with Apple"
3. Configure and download the key file
4. Note the Key ID

### Step 5: Configure Environment Variables

**Frontend (`frontend/.env.local`):**
```bash
APPLE_CLIENT_ID=com.njstarselite.web
APPLE_CLIENT_SECRET=your_generated_secret
```

**Backend (`backend/.env`):**
```bash
APPLE_CLIENT_ID=com.njstarselite.web
APPLE_KEY_ID=your_key_id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

> **Note:** Apple client secrets must be generated from the private key and expire after 6 months. Use a library like `python-jose` to generate them programmatically.

---

## Testing Checklist

### Facebook Login
- [ ] Can click "Continue with Facebook" on login page
- [ ] Redirects to Facebook authorization screen
- [ ] After approval, redirects back to app
- [ ] User is logged in with correct email/name
- [ ] User profile synced to Django backend

### Apple Sign In (Phase 2)
- [ ] Can click "Continue with Apple" on login page
- [ ] Shows Apple ID authentication
- [ ] Handles "Hide My Email" option correctly
- [ ] User is logged in successfully
- [ ] User profile synced to Django backend

---

## Troubleshooting

### Facebook: "App Not Set Up"
- Ensure app is in "Live" mode for production
- Check redirect URI matches exactly (including trailing slashes)

### Facebook: "Invalid Scopes"
- Request `email` and `public_profile` permissions in App Review

### Apple: "Invalid redirect_uri"
- Apple requires exact match including protocol
- Ensure HTTPS is properly configured
- Verify domain is registered in Apple Developer Console

### Apple: "Invalid client_secret"
- Client secrets expire after 6 months
- Regenerate using the private key

---

## Related Documentation

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [NextAuth.js Providers](https://next-auth.js.org/providers/)
