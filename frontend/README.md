# Location Sharing App - React Native Frontend

This is the React Native frontend for the Location Sharing App, built with Expo and modern React Native practices.

## 🚀 Features

- **Phone Authentication**: Secure login with OTP verification
- **Real-time Location Sharing**: Share and track locations with contacts
- **Contact Management**: Add, manage, and organize your contacts
- **Modern UI**: Beautiful Material Design interface
- **Cross-platform**: Works on both iOS and Android

## 🛠️ Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development toolchain and deployment
- **Redux Toolkit**: State management
- **React Navigation**: Navigation between screens
- **React Native Paper**: Material Design components
- **TypeScript**: Type-safe development

## 📱 Screens

### Authentication
- **Login Screen**: Phone number input and OTP request
- **OTP Verification**: 6-digit code verification

### Main App
- **Main Screen**: Dashboard with location and activity overview
- **Map Screen**: Interactive map view (placeholder)
- **Contacts Screen**: Contact management interface
- **Profile Screen**: User settings and preferences

## 🔧 Setup Instructions

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation
```bash
cd frontend
npm install
```

### Running the App
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── navigation/         # Navigation configuration
├── store/             # Redux store and slices
├── services/          # API and external services
├── theme/             # App theming
└── utils/             # Helper functions
```

## 🔌 API Integration

The frontend connects to the Python FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before testing the frontend.

## 🎨 UI Components

Built with React Native Paper for a consistent Material Design experience:
- Cards and surfaces for content organization
- Buttons with different styles and states
- Form inputs with validation
- Navigation with bottom tabs and stack navigation

## 📊 State Management

Uses Redux Toolkit for predictable state management:
- **Auth Slice**: User authentication and session
- **Location Slice**: Current and shared locations
- **Contacts Slice**: Contact management

## 🚀 Next Steps

1. **Implement Map Integration**: Add React Native Maps
2. **Real-time Features**: WebSocket integration
3. **Push Notifications**: Location alerts and updates
4. **Offline Support**: Local data persistence
5. **Testing**: Unit and integration tests

## 📝 Development Notes

- All screens are currently placeholder implementations
- Authentication flow is fully implemented
- Navigation structure is complete
- State management is set up and ready
- API service layer is configured

---

**Status**: 🟡 Development Phase - Basic Structure Complete
**Backend Required**: Python FastAPI server running on port 8000









