import React from 'react';
import { useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootState } from '../store';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import MainScreen from '../screens/main/MainScreen';
import MapScreen from '../screens/main/MapScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LocationHistoryScreen from '../screens/main/LocationHistoryScreen';

// Icons
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Main') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Main" 
        component={MainScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Map' }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{ title: 'Contacts' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="LocationHistory" 
        component={LocationHistoryScreen}
        options={{
          gestureEnabled: true,
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;






