# Tech Context

## Technologies Used

### Core Framework
- **React Native**: v0.74.x
- **Expo SDK**: v51.0.x
- **TypeScript**: v5.3.x
- **Node.js**: v20.x or higher

### Navigation
- **@react-navigation/native**: v6.1.x
- **@react-navigation/bottom-tabs**: v6.5.x
- **@react-navigation/stack**: v6.3.x
- **react-native-screens**: Optimized screen navigation
- **react-native-safe-area-context**: Safe area handling

### UI & Animation
- **react-native-reanimated**: v3.10.x - High-performance animations
- **react-native-gesture-handler**: v2.16.x - Native gesture handling
- **expo-blur**: v13.0.x - iOS blur effects (liquid glass)
- **expo-haptics**: v13.0.x - Haptic feedback
- **react-native-svg**: Vector graphics support

### Backend & Storage
- **Firebase SDK**: v10.7.x
  - `@react-native-firebase/app`: Core Firebase
  - `@react-native-firebase/auth`: Authentication
  - `@react-native-firebase/firestore`: Database
  - `@react-native-firebase/storage`: File storage
- **@react-native-async-storage/async-storage**: Local persistence
- **expo-secure-store**: Secure credential storage

### Date & Time
- **date-fns**: v3.0.x - Modern date manipulation
- **date-fns-tz**: Timezone support

### AI/LLM Integration
- **axios**: v1.6.x - HTTP client for API calls
- Custom service layer for multiple LLM providers

### Developer Tools
- **@typescript-eslint**: TypeScript linting
- **prettier**: Code formatting
- **jest**: Testing framework
- **@testing-library/react-native**: Component testing
- **detox**: E2E testing (optional)

## Development Setup

### Prerequisites
```bash
# Required versions
Node.js: 20.x or higher
npm: 10.x or higher
Expo CLI: Latest

# iOS Development (macOS only)
Xcode: 15.0 or higher
CocoaPods: 1.15.x
iOS Simulator: iOS 17.0+
```

### Installation Steps

1. **Install Expo CLI**
```bash
npm install -g expo-cli
```

2. **Initialize Project**
```bash
cd react_native
npx create-expo-app@latest . --template blank-typescript
```

3. **Install Core Dependencies**
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install expo-blur expo-haptics expo-linear-gradient
```

4. **Install Firebase**
```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

5. **Install Utilities**
```bash
npm install date-fns date-fns-tz
npm install @react-native-async-storage/async-storage
npm install expo-secure-store
npm install axios
```

6. **Install Dev Dependencies**
```bash
npm install -D @types/react @types/react-native
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier
npm install -D jest @testing-library/react-native @testing-library/jest-native
```

### Project Configuration

#### app.json (Expo Configuration)
```json
{
  "expo": {
    "name": "Calendar AI",
    "slug": "calendar-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.calendarai.app",
      "buildNumber": "1",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"],
        "NSCameraUsageDescription": "Allow access to camera for profile pictures",
        "NSPhotoLibraryUsageDescription": "Allow access to photos for event attachments"
      }
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.0"
          }
        }
      ]
    ]
  }
}
```

#### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@config/*": ["src/config/*"],
      "@contexts/*": ["src/contexts/*"],
      "@constants/*": ["src/constants/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

#### babel.config.js
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@hooks': './src/hooks',
            '@types': './src/types',
            '@utils': './src/utils',
            '@config': './src/config',
            '@contexts': './src/contexts',
            '@constants': './src/constants'
          }
        }
      ]
    ]
  };
};
```

#### .eslintrc.js
```javascript
module.exports = {
  root: true,
  extends: [
    'expo',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

#### .prettierrc.js
```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf'
};
```

## Technical Constraints

### iOS Version Support
- **Minimum**: iOS 15.0
- **Target**: iOS 17.0+
- **Recommended**: iOS 18.0 (latest)

### Device Support
- iPhone 12 and newer (optimal)
- iPhone X and newer (supported)
- iPad support (basic, phone layout)

### Performance Budget
- **App Size**: < 50MB (after optimization)
- **Launch Time**: < 2 seconds (cold start)
- **Frame Rate**: 60 FPS target
- **Memory**: < 150MB typical usage
- **Network**: < 5MB/day typical data usage

### Offline Requirements
- Core calendar features work offline
- Event creation queued for sync
- Read operations from local cache
- Conflict resolution on reconnect

## Firebase Configuration

### Structure
```
firebase/
├── firestore/          # Database rules
├── storage/            # Storage rules
└── config/             # Firebase configuration files
```

### Firestore Schema
```
users/{userId}
  ├── profile: { name, email, avatar }
  ├── settings: { theme, notifications }
  └── families/{familyId}
      ├── members/
      │   └── {memberId}: { name, role, color, age }
      └── events/
          └── {eventId}: { title, startTime, endTime, ... }
```

### Security Rules
- Users can only access their own data
- Family members share event data
- Read/write rules enforced server-side

## Build Configuration

### Development Build
```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on physical device
npx expo start --tunnel
```

### Production Build
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Environment Variables
```bash
# .env file
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

## Tool Usage Patterns

### React Native Reanimated
```typescript
// Shared values for animations
const translateY = useSharedValue(0);

// Animated style
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: translateY.value }]
}));

// Gesture handling
const gesture = Gesture.Pan()
  .onUpdate((e) => {
    translateY.value = e.translationY;
  })
  .onEnd(() => {
    translateY.value = withSpring(0);
  });
```

### Expo Blur (Liquid Glass Effect)
```typescript
import { BlurView } from 'expo-blur';

<BlurView
  intensity={80}
  tint="light"
  style={styles.blurContainer}
>
  {/* Content */}
</BlurView>
```

### Firebase Integration
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
```

### AsyncStorage Pattern
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load data
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : null;
```

## Testing Strategy

### Unit Tests (Jest)
```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Component Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('EventCard', () => {
  it('renders event details', () => {
    const { getByText } = render(<EventCard event={mockEvent} />);
    expect(getByText('Test Event')).toBeTruthy();
  });
});
```

### E2E Tests (Detox - Optional)
```bash
# Build for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug
```

## Performance Monitoring

### Tools
- **Flipper**: React Native debugging
- **React DevTools**: Component inspection
- **Xcode Instruments**: Performance profiling
- **Firebase Performance**: Production monitoring

### Key Metrics
- JS thread utilization
- UI thread frame rate
- Memory usage
- Network requests
- Bundle size

## Deployment

### App Store Requirements
- App Store Connect account
- Valid Apple Developer certificate
- Privacy policy URL
- App description and screenshots
- Age rating and content warnings

### Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

## Known Limitations

1. **iOS Only**: Currently targeting iOS only (no Android)
2. **Network Dependency**: Initial setup requires internet
3. **Storage Size**: Limited by device storage for offline data
4. **Firebase Limits**: Free tier has quota limits

## Future Technical Considerations

- **Watch App**: Consider Apple Watch companion app
- **Widgets**: iOS home screen and lock screen widgets
- **Shortcuts**: Siri shortcuts integration
- **Live Activities**: Real-time event updates
- **App Clips**: Lightweight event sharing
