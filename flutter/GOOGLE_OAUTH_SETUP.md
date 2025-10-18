# Google OAuth Setup Guide for Web

## Problem
The Google Sign-In button opens a popup but shows a 404 error. This happens because the OAuth 2.0 client needs proper configuration.

## Solution: Create Web OAuth Client

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Select project: **studio-1327110304-6895e**
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Create OAuth 2.0 Client ID (or Edit Existing)

#### If No Web Client Exists:
1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. Application type: **Web application**
3. Name: **Calendar AI Web**
4. **Authorized JavaScript origins:**
   - Add: `http://localhost`
   - Add: `http://localhost:51296` (or your dev server port)
5. **Authorized redirect URIs:**
   - Add: `http://localhost`
   - Add: `http://localhost/signin-callback`
   - Add: `http://localhost:51296` (replace with your port)
   - Add: `http://localhost:51296/signin-callback`
6. Click **CREATE**
7. **Copy the Client ID** that is generated

#### If Web Client Already Exists:
1. Find the web OAuth client in the credentials list
2. Click the **pencil icon** (Edit) next to it
3. Verify **Authorized JavaScript origins** includes:
   - `http://localhost`
4. Verify **Authorized redirect URIs** includes:
   - `http://localhost`
5. Click **SAVE**
6. **Copy the Client ID**

### Step 3: Update Flutter App

Update the client ID in `web/index.html`:

```html
<!-- Google Sign-In -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
<meta name="google-signin-client_id" content="YOUR_NEW_WEB_CLIENT_ID.apps.googleusercontent.com">
```

Replace `YOUR_NEW_WEB_CLIENT_ID` with the client ID from Step 2.

### Step 4: Update Auth Service (If Needed)

If you want to specify the client ID in code, update `lib/services/auth_service.dart`:

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  scopes: [
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar',
  ],
);
```

### Step 5: Test

```bash
flutter clean
flutter pub get
flutter run -d chrome
```

## Alternative: Use Firebase Authentication Web SDK

Instead of the Flutter Google Sign-In plugin, use Firebase Auth's web support directly:

### Update web/index.html

The Firebase Auth Web SDK is already included. The issue might be with the OAuth client configuration.

## Current Client IDs

**Current Client ID in use:**
```
289875815919-724rru6novnr424m5vcpp0voac6fil8v.apps.googleusercontent.com
```

This client ID needs to be:
1. Configured as a Web application type
2. Have localhost in authorized origins
3. Have proper redirect URIs

## Quick Check

To verify the client ID is correct for web:
1. The client ID should end in `.apps.googleusercontent.com`
2. It should be listed under "OAuth 2.0 Client IDs" in Google Cloud Console
3. The type should be "Web application"

## Recommended Approach for Now

Until Google OAuth is fully configured, **use Email/Password authentication**:

✅ **Email/Password authentication works perfectly:**
1. Click "Sign Up"
2. Enter name, email, password
3. Sign in and use the app

This uses Firebase Authentication and works immediately without additional OAuth setup.

## Common Issues

### Issue: "popup_closed" error
**Cause:** OAuth redirect URI not configured
**Fix:** Add `http://localhost` to authorized redirect URIs

### Issue: 404 error in popup
**Cause:** Wrong client ID or missing redirect URI
**Fix:** Verify client ID is for Web application type

### Issue: Client ID not found
**Cause:** Using wrong Google Cloud project
**Fix:** Ensure you're in project: studio-1327110304-6895e

## Support

If you continue having issues:
1. Try Email/Password authentication (already working)
2. Check Firebase Console → Authentication → Sign-in method
3. Ensure Google sign-in provider is enabled
4. Verify OAuth client is properly configured in Google Cloud Console
