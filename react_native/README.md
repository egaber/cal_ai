# Cal AI Mobile - React Native App

A beautiful iOS 26-styled calendar and task management application built with React Native and Expo, featuring liquid glass bottom navigation tabs and modern UI/UX patterns.

## 🌟 Features

### ✅ Currently Implemented
- **iOS 26 Liquid Glass Tab Bar** - Beautiful animated bottom navigation with blur effects
- **Calendar View** - Day and 3-day view with smooth date navigation
- **Modern iOS Styling** - System colors, SF Symbols, and glass morphism effects
- **Dark Mode Support** - Automatic theme switching based on system preferences
- **Responsive Design** - Optimized for iPhone and iPad
- **Type-Safe** - Built with TypeScript for reliability

### 🚧 Coming Soon
- **Firebase Integration** - Cloud sync for events and tasks
- **AI Assistant** - Intelligent scheduling and task management
- **Task Management** - Create, edit, and organize tasks
- **Family Sharing** - Multi-user support with shared calendars
- **Push Notifications** - Reminders and event notifications
- **Google Calendar Sync** - Import and sync with Google Calendar

## 📱 Screenshots

*Add screenshots here after building the app*

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.18.3 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or physical iOS device
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   cd react_native
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on iOS Simulator**
   ```bash
   npm run ios
   ```

5. **Run on Android Emulator**
   ```bash
   npm run android
   ```

6. **Run on physical device**
   - Scan the QR code with Expo Go app (iOS) or Expo app (Android)

## 📁 Project Structure

```
react_native/
├── App.tsx                 # Main app component with navigation
├── index.js               # Entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── src/
│   ├── components/       # Reusable components
│   │   └── LiquidGlassTabBar.tsx
│   ├── screens/          # Screen components
│   │   ├── CalendarScreen.tsx
│   │   ├── TasksScreen.tsx (coming soon)
│   │   ├── AIAssistantScreen.tsx (coming soon)
│   │   └── ProfileScreen.tsx (coming soon)
│   ├── types/           # TypeScript interfaces
│   │   ├── calendar.ts
│   │   ├── task.ts
│   │   └── user.ts
│   ├── theme/           # Styling and theming
│   │   ├── colors.ts   # iOS 26 color palette
│   │   └── styles.ts   # Shared styles
│   ├── services/        # API and business logic (coming soon)
│   ├── contexts/        # React contexts (coming soon)
│   └── utils/           # Helper functions (coming soon)
└── assets/             # Images, fonts, etc.
```

## 🎨 Design System

### Colors
The app uses iOS 26 system colors and follows Apple's Human Interface Guidelines:
- System Blue (#007AFF)
- System Green (#34C759)
- System Purple (#AF52DE)
- And more iOS system colors

### Typography
- SF Pro Display and SF Pro Text fonts
- iOS standard type scales (H1, H2, Body, Caption, etc.)

### Components
- **Liquid Glass Effects** - Blur views with semi-transparent backgrounds
- **Rounded Corners** - iOS-style border radius (8, 12, 16, 20px)
- **Shadows** - Subtle elevation with proper shadow values
- **Animations** - Spring-based animations using Reanimated

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **React Native Reanimated** - Performant animations
- **Expo Blur** - Native blur effects
- **Expo Linear Gradient** - Gradient backgrounds
- **date-fns** - Modern date utility library
- **Firebase** (coming soon) - Backend and authentication
- **React Navigation** (planned) - Advanced routing

## 📝 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser (limited support)

### Code Style

The project follows these conventions:
- **TypeScript** for all source files
- **Functional components** with hooks
- **iOS 26 design patterns** for UI/UX
- **Modular architecture** for scalability

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the react_native directory:

```env
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
# Add other environment variables as needed
```

### Expo Configuration

Edit `app.json` to customize:
- App name and slug
- Bundle identifiers
- Icons and splash screens
- Platform-specific settings

## 🐛 Known Issues

- Date picker animation needs refinement
- Some TypeScript warnings in development (will be fixed)
- Android glass effects may need optimization

## 🤝 Contributing

This is a private project, but contributions are welcome:

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit a pull request

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Design inspired by iOS 26 and iPadOS
- Based on the original Cal AI web application
- Built with love for the family

## 📞 Support

For issues or questions, contact the development team.

---

**Made with ❤️ for the Gaber family**
