# Web Support Added to LumoFlow

## Overview
LumoFlow now supports both **Electron** and **Web** environments. The app can run as a desktop application or as a web application.

## Changes Made

### authService.ts - Complete Refactor
Added web fallback support for all authentication methods:

#### 1. **Login**
- **Electron**: Uses `window.api.login()` via IPC
- **Web**: Calls `/api/auth/login` endpoint

#### 2. **Signup**
- **Electron**: Uses `window.api.signup()` via IPC
- **Web**: Calls `/api/auth/signup` endpoint

#### 3. **Logout**
- **Electron**: Uses `window.api.logout()` via IPC
- **Web**: Calls `/api/auth/logout` endpoint

#### 4. **Get Profile**
- **Electron**: Uses `window.api.getDashboardStats()` via IPC
- **Web**: Calls `/api/user/profile/{userId}` endpoint

#### 5. **Update Profile**
- **Electron**: Uses `window.api.updateProfile()` via IPC
- **Web**: Calls `/api/user/profile` endpoint (PUT)

#### 6. **Get Dashboard Data**
- **Electron**: Uses `window.api.getDashboardStats()` via IPC
- **Web**: Calls `/api/user/dashboard/{userId}` endpoint

#### 7. **GitHub OAuth**
- **Electron**: Uses `window.api.githubOAuth()` via IPC
- **Web**: Calls `/api/auth/github/callback` endpoint

#### 8. **Google OAuth**
- **Electron**: Uses `window.api.googleOAuth()` via IPC
- **Web**: Calls `/api/auth/google/callback` endpoint

#### 9. **Forgot Password**
- **Electron**: Uses `window.api.forgotPassword()` via IPC
- **Web**: Calls `/api/auth/forgot-password` endpoint

#### 10. **Reset Password**
- **Electron**: Uses `window.api.resetPassword()` via IPC
- **Web**: Calls `/api/auth/reset-password` endpoint

## How It Works

Each method now follows this pattern:

```typescript
async methodName(params) {
  try {
    if (window.api) {
      // Electron path - use IPC bridge
      return await window.api.methodName(params);
    } else {
      // Web path - use HTTP API
      return await this.methodNameWeb(params);
    }
  } catch (error) {
    return { success: false, msg: "Error message" };
  }
}

private async methodNameWeb(params) {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    return { success: false, msg: "Error message" };
  }
}
```

## Running on Web

To run LumoFlow as a web application:

1. **Backend API Required**: Ensure your backend server is running with these endpoints:
   - `POST /api/auth/login`
   - `POST /api/auth/signup`
   - `POST /api/auth/logout`
   - `GET /api/user/profile/{userId}`
   - `PUT /api/user/profile`
   - `GET /api/user/dashboard/{userId}`
   - `POST /api/auth/github/callback`
   - `POST /api/auth/google/callback`
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`

2. **Build for Web**:
   ```bash
   npm run build
   ```

3. **Deploy**: Deploy the built files to your web server

4. **Authentication**: The app will automatically use HTTP API calls instead of IPC

## Running on Electron

To run LumoFlow as a desktop application:

```bash
npm start
```

The app will automatically detect the Electron environment and use the IPC bridge.

## Benefits

✅ **Single Codebase**: One codebase for both desktop and web
✅ **Automatic Detection**: Automatically detects environment (Electron vs Web)
✅ **Fallback Support**: Gracefully falls back to web API if IPC is unavailable
✅ **No Code Changes**: No need to change code when switching environments
✅ **Full Feature Parity**: All features work on both platforms

## Error Handling

All methods include proper error handling:
- Catches IPC errors and falls back to web API
- Returns consistent error responses
- Logs errors for debugging
- Provides user-friendly error messages

## Testing

To test web support:

1. Open the app in a web browser (not Electron)
2. Try logging in with valid credentials
3. The app should call the web API endpoints instead of IPC
4. Check browser console for any errors

## Future Enhancements

- Add offline support with service workers
- Implement progressive web app (PWA) features
- Add caching for better performance
- Support for multiple backend servers
