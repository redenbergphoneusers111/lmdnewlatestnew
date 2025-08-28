# Authentication System Documentation

This document describes the new authentication system implemented in the Delivery App.

## Overview

The app now includes a complete authentication flow with:

- Splash Screen
- Server Configuration Setup
- Server List Management
- Login Screen
- Persistent Authentication State

## Flow Description

### First Time Users

1. **Splash Screen**: App logo and branding animation
2. **Server Setup**: Configure first server (name, base URL, port, protocol)
3. **Server List**: View and select the configured server
4. **Login**: Enter credentials to access the app
5. **Main App**: Access to delivery features

### Returning Users

1. **Splash Screen**: Quick loading animation
2. **Login**: Direct access to login if server is configured
3. **Main App**: Access to delivery features

### Server Management

- Users can configure multiple servers
- Only one server can be active at a time
- Server configurations are stored locally
- Users can switch between servers from the login screen

## Screen Details

### SplashScreen

- Animated logo and app name
- 2.5 second duration with smooth animations
- Automatically transitions to next screen

### ServerSetupScreen

- Server name input
- Base URL input (e.g., api.example.com)
- Port number input (1-65535)
- Protocol selection (HTTP/HTTPS)
- Validation and error handling
- Save functionality

### ServerListScreen

- Display all configured servers
- Show active server status
- Select/deselect servers
- Delete server configurations
- Create new server configurations
- Pull-to-refresh functionality

### LoginScreen

- Username and password fields
- Server status display
- Access to server configuration
- Form validation
- Loading states

## Technical Implementation

### Storage

- Uses `@react-native-async-storage/async-storage`
- Stores server configurations, user auth, and first-time setup status
- Persistent across app restarts

### State Management

- React Context for authentication state
- Local state for screen navigation
- Async storage for persistence

### Navigation Flow

- Conditional rendering based on authentication state
- Screen transitions managed by AuthNavigator
- Proper back navigation handling

## Usage Examples

### Adding a New Server

```typescript
// Navigate to server setup
onCreateNew();

// Fill in server details
const serverConfig = {
  name: "Production Server",
  baseUrl: "api.mydelivery.com",
  port: "443",
  protocol: "https" as const,
};

// Save configuration
await StorageManager.saveServerConfig(serverConfig);
```

### Switching Servers

```typescript
// Get all servers
const servers = await StorageManager.getServerConfigs();

// Set active server
await StorageManager.setActiveServer(serverId);

// Refresh auth state
await refreshAuthState();
```

### Authentication Check

```typescript
const { isAuthenticated, user, activeServer } = useAuth();

if (isAuthenticated) {
  // User is logged in and has active server
  // Navigate to main app
} else {
  // Show authentication flow
}
```

## Configuration

### Server Requirements

- Valid base URL (alphanumeric, dots, hyphens)
- Valid port number (1-65535)
- Protocol selection (HTTP/HTTPS)

### Validation Rules

- All fields are required
- Base URL must be valid domain format
- Port must be numeric and in valid range
- Protocol must be either HTTP or HTTPS

## Error Handling

- Network connectivity issues
- Invalid server configurations
- Authentication failures
- Storage errors
- User input validation

## Security Considerations

- Credentials are stored locally
- Server configurations are stored locally
- No encryption of stored data (for demo purposes)
- In production, consider encrypting sensitive data

## Future Enhancements

- Server health checks
- Automatic server discovery
- Multi-factor authentication
- Biometric authentication
- Server connection testing
- Configuration import/export
- Backup and restore functionality

## Troubleshooting

### Common Issues

1. **Server not connecting**: Check base URL and port
2. **Login failing**: Verify server is active and accessible
3. **App not remembering login**: Check storage permissions
4. **Server list empty**: Navigate to server setup

### Debug Steps

1. Check console logs for errors
2. Verify AsyncStorage is working
3. Confirm server configuration is valid
4. Test server connectivity manually

## Dependencies

- `@react-native-async-storage/async-storage`: Local storage
- `expo-linear-gradient`: UI gradients
- `lucide-react-native`: Icons
- `react-native-reanimated`: Animations
- `nativewind`: Styling

## File Structure

```
├── contexts/
│   └── AuthContext.tsx          # Authentication context
├── screens/
│   ├── SplashScreen.tsx         # App splash screen
│   ├── ServerSetupScreen.tsx    # Server configuration
│   ├── ServerListScreen.tsx     # Server management
│   └── LoginScreen.tsx          # User login
├── components/navigation/
│   └── AuthNavigator.tsx        # Auth flow navigation
├── utils/
│   └── storage.ts               # Storage utilities
└── app/
    └── index.tsx                # Main app entry
```
