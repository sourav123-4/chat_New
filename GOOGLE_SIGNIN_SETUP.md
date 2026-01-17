# Google Sign-In Setup Guide for React Native Chat App

## Three Client IDs You Need

### 1. **Web Client ID**
- Used for server-side verification of tokens
- Also used when the app runs in web browsers
- Get from: Google Cloud Console → Credentials → OAuth 2.0 Client ID → Web application

### 2. **iOS Client ID**
- Specifically for iOS app authentication
- Get from: Google Cloud Console → Credentials → OAuth 2.0 Client ID → iOS
- Requires: iOS Bundle ID (e.g., `com.ChatAppNew`)
- Requires: iOS URL Scheme

### 3. **Android Client ID** ← This is what you asked about
- Specifically for Android app authentication
- Get from: Google Cloud Console → Credentials → OAuth 2.0 Client ID → Android
- Requires: Android Package Name (e.g., `com.chatappnew`)
- Requires: SHA-1 fingerprint of your signing certificate

## Step-by-Step: Get Android Client ID

### Step 1: Find Your Android Package Name
```
File: android/app/build.gradle

Look for:
applicationId "com.chatappnew"  ← This is your package name
```

### Step 2: Get SHA-1 Fingerprint
```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Look for: SHA1: XX:XX:XX:XX:XX...
```

### Step 3: Create OAuth 2.0 Credential in Google Cloud
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Android**
6. Enter:
   - Package name: `com.chatappnew`
   - SHA-1 fingerprint: `XX:XX:XX:XX:XX...` (from Step 2)
7. Click **Create**
8. Copy the generated **Client ID**

### Step 4: Update Your Code
```typescript
// src/utils/googleSignIn.ts

GoogleSignin.configure({
  webClientId: '1234567890-web.apps.googleusercontent.com',
  iosClientId: '1234567890-ios.apps.googleusercontent.com',
  androidClientId: '1234567890-android.apps.googleusercontent.com', // ← Add this
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});
```

## Configuration for Production

### Release Keystore SHA-1
For production builds, you need a different SHA-1 from your release keystore:

```bash
keytool -list -v -keystore /path/to/your-release-key.keystore -alias your-alias
```

Then create another Android OAuth credential in Google Cloud with the release SHA-1.

## Common Issues

### ❌ "Google Play Services not available"
- Make sure Google Play Services is installed on the Android device
- Check that your Android version is compatible

### ❌ "Invalid package name or SHA-1"
- Verify the package name matches exactly (case-sensitive)
- Make sure you're using the correct SHA-1 fingerprint
- Debug and Release use different SHA-1 values

### ❌ "Sign-in cancelled"
- This is normal when user taps back/cancel
- Your error handling already covers this

## Summary

| Client ID | Purpose | For |
|-----------|---------|-----|
| **Web** | Token verification on backend | Server-side validation |
| **iOS** | Native iOS authentication | iPhone/iPad |
| **Android** | Native Android authentication | Android phones/tablets |

All three are needed for full functionality across all platforms!
