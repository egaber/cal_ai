# Native Liquid Glass Tabs Setup

## ⚠️ Important: Requires Development Build

The `react-native-bottom-tabs` library provides **true native iOS tab bars** with authentic liquid glass effects, but it **requires native code** and cannot run in Expo Go.

## Current Status

✅ **Installed**: `react-native-bottom-tabs` package added
❌ **Not Active**: Still using JS-based BlurView tabs (works in Expo Go)

## To Enable Native Tabs

### Option 1: Use Expo Development Build (Recommended)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure project
eas build:configure

# 4. Create development build for iOS
eas build --profile development --platform ios

# 5. Install on device or simulator
# Download from Expo dashboard and install
```

### Option 2: Eject from Expo

```bash
# 1. Eject to bare React Native
npx expo prebuild

# 2. Install iOS dependencies
cd ios && pod install && cd ..

# 3. Run on iOS
npx expo run:ios
```

## Implementation with Native Tabs

Once you have a development build, replace the current tab implementation in `App.tsx`:

```typescript
import { BottomTabs } from 'react-native-bottom-tabs';

const Tabs = BottomTabs.createBottomTabs();

export default function App() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarIcon: '📅',
          // Native blur automatically applied!
        }}
      />
      <Tabs.Screen name="Tasks" component={TasksScreen} />
      <Tabs.Screen name="AI" component={AIScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
```

## Benefits of Native Tabs

- ✅ **True iOS blur** - System-level glass morphism
- ✅ **Better performance** - Native rendering
- ✅ **Authentic feel** - Matches iOS system tabs exactly
- ✅ **Haptic feedback** - Native touch responses
- ✅ **iOS 26 design** - Automatic system integration

## Current Fallback

The app currently uses:
- `expo-blur` for glass effects
- JavaScript-based tab switching
- Works in Expo Go for testing

This provides a **good approximation** of native tabs while allowing rapid development in Expo Go.

## Next Steps

1. **For development**: Keep current implementation (works in Expo Go)
2. **For production**: Build with EAS and switch to native tabs
3. **Test both**: Current version for quick iteration, native for polish

## Resources

- [react-native-bottom-tabs](https://github.com/okwasniewski/react-native-bottom-tabs)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
