import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Surface, Button, Avatar, List, Switch, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import { Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { logout, setUser } from '../../store/slices/authSlice';
import { userAPI } from '../../services/userAPI';
import { useTheme } from '../../contexts/ThemeContext';
import PrivacyPolicyDialog from '../../components/PrivacyPolicyDialog';
import TermsOfServiceDialog from '../../components/TermsOfServiceDialog';
import PinShareLogo from '../../components/PinShareLogo';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  
  const { theme: themeContext, setThemeMode } = useTheme();
  
  // Dialog states
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Settings states
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);
  const [shareLocation, setShareLocation] = useState(user?.settings?.share_location ?? false);
  const [theme, setTheme] = useState(user?.settings?.theme || 'light');
  const [privacyLevel, setPrivacyLevel] = useState(user?.settings?.privacy_level || 'private');

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setNotifications(user.settings?.notifications ?? true);
      setShareLocation(user.settings?.share_location ?? false);
      setTheme(user.settings?.theme || 'light');
      setPrivacyLevel(user.settings?.privacy_level || 'private');
    }
  }, [user]);

  const handleEditProfile = () => {
    setEditName(user?.name || '');
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!token || !editName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await userAPI.updateProfile(token, { name: editName.trim() });
      if (response.success && response.user) {
        dispatch(setUser(response.user));
        setEditProfileVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacyLevelChange = async (level: string) => {
    if (!token) return;
    
    setPrivacyLevel(level);
    
    try {
      const response = await userAPI.updateSettings(token, { privacy_level: level });
      if (response.success && response.user) {
        dispatch(setUser(response.user));
      }
    } catch (error: any) {
      console.error('Error updating privacy level:', error);
      Alert.alert('Error', 'Failed to update privacy settings');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (!token) return;
    
    setNotifications(value);
    
    try {
      const response = await userAPI.updateSettings(token, { notifications: value });
      if (response.success && response.user) {
        dispatch(setUser(response.user));
      }
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      setNotifications(!value); // Revert on error
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleShareLocationToggle = async (value: boolean) => {
    if (!token) return;
    
    setShareLocation(value);
    
    try {
      const response = await userAPI.updateSettings(token, { share_location: value });
      if (response.success && response.user) {
        dispatch(setUser(response.user));
      }
    } catch (error: any) {
      console.error('Error updating share location:', error);
      setShareLocation(!value); // Revert on error
      Alert.alert('Error', 'Failed to update location sharing settings');
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    if (!token) return;
    
    setTheme(newTheme);
    // Update theme context immediately for instant UI update
    setThemeMode(newTheme as 'light' | 'dark' | 'auto');
    
    try {
      const response = await userAPI.updateSettings(token, { theme: newTheme });
      if (response.success && response.user) {
        dispatch(setUser(response.user));
      }
    } catch (error: any) {
      console.error('Error updating theme:', error);
      Alert.alert('Error', 'Failed to update theme');
    }
  };
  
  // Sync theme from user settings when component loads or user changes
  useEffect(() => {
    if (user?.settings?.theme) {
      const userTheme = user.settings.theme as 'light' | 'dark' | 'auto';
      if (userTheme !== themeContext.mode) {
        setThemeMode(userTheme);
        setTheme(userTheme); // Also update local state
      }
    }
  }, [user?.settings?.theme]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logout() as any);
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const gradientColors = themeContext.isDark 
    ? ['#764ba2', '#667eea', '#4a5568'] as const
    : ['#667eea', '#764ba2'] as const;
  const styles = ProfileScreenStyles(themeContext.isDark);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.headerContent}>
              <Avatar.Text 
                size={60} 
                label={user?.name?.charAt(0).toUpperCase() || 'U'} 
                style={styles.profileAvatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>
                  {user?.name || 'User'}
                </Text>
                <Text style={styles.phone}>
                  {user?.phone || 'No phone number'}
                </Text>
              </View>
            </View>
          </Animated.View>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account Settings
        </Text>
        <List.Item
          title="Edit Profile"
          description="Update your name and avatar"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleEditProfile}
        />
        <List.Item
          title="Privacy Settings"
          description={`Current: ${privacyLevel.charAt(0).toUpperCase() + privacyLevel.slice(1)}`}
          left={(props) => <List.Icon {...props} icon="shield-account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            Alert.alert(
              'Privacy Level',
              'Select privacy level',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Private',
                  onPress: () => handlePrivacyLevelChange('private'),
                  style: privacyLevel === 'private' ? 'default' : undefined,
                },
                {
                  text: 'Friends Only',
                  onPress: () => handlePrivacyLevelChange('friends'),
                  style: privacyLevel === 'friends' ? 'default' : undefined,
                },
                {
                  text: 'Public',
                  onPress: () => handlePrivacyLevelChange('public'),
                  style: privacyLevel === 'public' ? 'default' : undefined,
                },
              ]
            );
          }}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>
          App Preferences
        </Text>
        <List.Item
          title="Notifications"
          description="Receive push notifications"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
            />
          )}
        />
        <List.Item
          title="Location Sharing"
          description="Share location by default"
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          right={() => (
            <Switch
              value={shareLocation}
              onValueChange={handleShareLocationToggle}
            />
          )}
        />
        <List.Item
          title="Theme"
          description={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            const themes = ['light', 'dark', 'auto'];
            const currentIndex = themes.indexOf(theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            handleThemeChange(nextTheme);
          }}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>
          Location & History
        </Text>
        <List.Item
          title="Location History"
          description="View your past locations and routes"
          left={(props) => <List.Icon {...props} icon="history" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            (navigation as any).navigate('LocationHistory');
          }}
        />
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>
          Support & About
        </Text>
        <List.Item
          title="Help & Support"
          description="Phone: +91 9818336765 | Email: ranjan23.ramesh@gmail.com"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {
            Alert.alert(
              'Help & Support',
              'Contact us for assistance:\n\nPhone: +91 9818336765\nEmail: ranjan23.ramesh@gmail.com',
              [{ text: 'OK' }]
            );
          }}
        />
        <List.Item
          title="Privacy Policy"
          description="Read our privacy policy"
          left={(props) => <List.Icon {...props} icon="file-document" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => setPrivacyPolicyVisible(true)}
        />
        <List.Item
          title="Terms of Service"
          description="Read our terms of service"
          left={(props) => <List.Icon {...props} icon="file-document-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => setTermsVisible(true)}
        />
        <List.Item
          title="App Version"
          description="PinShare v1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <View style={styles.appBranding}>
          <PinShareLogo size="small" variant="horizontal" />
          <Text style={[styles.tagline, { color: themeContext.isDark ? '#B0B0B0' : '#666' }]}>
            Pin your location, share your world
          </Text>
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Button 
          mode="outlined" 
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#B00020"
        >
          Logout
        </Button>
      </Surface>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={editProfileVisible} onDismiss={() => setEditProfileVisible(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Full Name"
              value={editName}
              onChangeText={setEditName}
              style={styles.dialogInput}
              autoCapitalize="words"
              textColor={themeContext.isDark ? '#FFFFFF' : '#000000'}
              underlineColor={themeContext.isDark ? '#666' : undefined}
              activeUnderlineColor={themeContext.isDark ? '#2196F3' : undefined}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditProfileVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSaveProfile}
              loading={isUpdating}
              disabled={isUpdating || !editName.trim()}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Privacy Policy Dialog */}
      <Portal>
        <PrivacyPolicyDialog
          visible={privacyPolicyVisible}
          onDismiss={() => setPrivacyPolicyVisible(false)}
        />
      </Portal>

      {/* Terms of Service Dialog */}
      <Portal>
        <TermsOfServiceDialog
          visible={termsVisible}
          onDismiss={() => setTermsVisible(false)}
        />
      </Portal>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const ProfileScreenStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    margin: 16,
    marginTop: 48,
    marginBottom: 8,
    alignItems: 'center',
  },
  headerContent: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    marginRight: 16,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 12,
  },
  phone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
    color: isDark ? '#FFFFFF' : '#333',
  },
  logoutButton: {
    margin: 16,
    borderColor: '#B00020',
  },
  dialogInput: {
    marginTop: 8,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  appBranding: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 10,
  },
  tagline: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ProfileScreen;






