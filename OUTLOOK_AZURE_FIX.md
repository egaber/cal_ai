# Fixing Azure App Registration for Outlook Integration

## Problem
You're getting error: `AADSTS70002: The provided request must include a 'client_secret' input parameter`

This means your Azure app is configured as a "Web" application instead of a "Single-page application (SPA)".

## Solution: Update Azure App Registration

### Step 1: Go to Azure Portal
1. Navigate to https://portal.azure.com
2. Go to **Azure Active Directory** > **App registrations**
3. Find your app: "Calendar AI - Outlook Integration" (or whatever you named it)
4. Click on it to open

### Step 2: Fix Authentication Settings

1. In the left menu, click **Authentication**

2. Under **Platform configurations**, you should see your redirect URI. Check what type it is:
   - If it says "Web" → This is the problem!
   - We need it to be "Single-page application"

3. **Option A: If you have a "Web" platform configured:**
   - Click the trash icon to **Remove** the Web platform
   - Click **Add a platform**
   - Select **Single-page application**
   - Enter your Redirect URI: `http://localhost:5173` (or your domain)
   - Click **Configure**

4. **Option B: If you need to add SPA platform:**
   - Click **Add a platform**
   - Select **Single-page application**
   - Enter your Redirect URI: `http://localhost:5173`
   - Click **Configure**

5. Scroll down to **Implicit grant and hybrid flows**
   - ✅ Check **Access tokens (used for implicit flows)**
   - ✅ Check **ID tokens (used for implicit and hybrid flows)**
   - Click **Save**

### Step 3: Verify Supported Account Types

1. Click **Overview** in the left menu
2. Check **Supported account types**
3. Should be: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
4. If not, click **Edit** and change it

### Step 4: Verify API Permissions

1. Click **API permissions** in the left menu
2. Make sure you have:
   - ✅ Microsoft Graph > Calendars.Read (Delegated)
   - ✅ Microsoft Graph > Calendars.ReadWrite (Delegated)
   - ✅ Microsoft Graph > User.Read (Delegated)
3. If any are missing, click **Add a permission** and add them
4. Click **Grant admin consent** (if you have admin rights)

### Step 5: Test the Fix

1. Clear your browser cache or use incognito mode
2. Go back to your Calendar AI app
3. Click the "Outlook Calendar" button
4. Click "Connect"
5. You should now see the Microsoft login popup without the client_secret error

## Visual Guide

### Before (Wrong - Web platform):
```
Authentication > Platform configurations
├── Web
│   └── Redirect URIs: http://localhost:5173
```

### After (Correct - SPA platform):
```
Authentication > Platform configurations
├── Single-page application
│   └── Redirect URIs: http://localhost:5173

Implicit grant and hybrid flows:
✅ Access tokens
✅ ID tokens
```

## Why This Happens

- **Web applications** require a client secret because they run on a server where the secret can be kept secure
- **Single-page applications** run entirely in the browser, so they can't securely store secrets
- SPAs use PKCE (Proof Key for Code Exchange) instead, which is more secure for browser-based apps

## Still Having Issues?

If you still get errors after following these steps:

1. **Clear MSAL cache**: 
   - Open browser dev tools (F12)
   - Go to Application > Local Storage
   - Delete all keys starting with `msal.`
   - Refresh the page

2. **Check redirect URI matches exactly**:
   - Azure Portal URI: `http://localhost:5173`
   - Your app's actual URL: `http://localhost:5173`
   - They must match exactly (including http/https, port, trailing slash)

3. **Wait a few minutes**:
   - Azure changes can take 5-10 minutes to propagate

4. **Try incognito/private mode**:
   - This ensures no cached authentication tokens

## Quick Checklist

- [ ] Platform type is "Single-page application" (not "Web")
- [ ] Redirect URI is correct: `http://localhost:5173`
- [ ] Access tokens enabled in implicit grant
- [ ] ID tokens enabled in implicit grant
- [ ] Account type is "Multitenant and personal accounts"
- [ ] API permissions include Calendars.Read, Calendars.ReadWrite, User.Read
- [ ] Cleared browser cache
- [ ] Waited a few minutes after making changes
