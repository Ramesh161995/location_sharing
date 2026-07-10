import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Surface, Button, Card, Avatar } from 'react-native-paper';
import { Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { fetchCurrentLocation, updateCurrentLocation, fetchSharedLocations } from '../../store/slices/locationSlice';
import { getCurrentLocation } from '../../services/locationHelper';
import { calculateDistance, formatDistance } from '../../utils/distance';
import { useTheme } from '../../contexts/ThemeContext';
import { getLocationErrorMessage } from '../../utils/errorHandler';
import ErrorDialog from '../../components/ErrorDialog';

const MainScreenContent = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { currentLocation, sharedLocations, isLoading } = useSelector((state: RootState) => state.location);
  const { contacts } = useSelector((state: RootState) => state.contacts);
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ visible: boolean; error: any; onRetry?: () => void }>({
    visible: false,
    error: null,
  });
  
  const headerAnim = useRef(new Animated.Value(0)).current;
  const styles = createStyles(theme.isDark);
  
  const gradientColors = theme.isDark 
    ? ['#764ba2', '#667eea', '#4a5568'] as const
    : ['#667eea', '#764ba2'] as const;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh shared locations when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        dispatch(fetchSharedLocations() as any);
        dispatch(fetchCurrentLocation() as any);
      }
    }, [token, dispatch])
  );

  // Auto-refresh shared locations periodically (every 60 seconds) for live updates
  // Only refresh when we have shared locations to avoid unnecessary calls
  useEffect(() => {
    if (!token || sharedLocations.length === 0) return;
    
    const intervalId = setInterval(() => {
      dispatch(fetchSharedLocations() as any);
    }, 60000); // Refresh every 60 seconds, only if there are shared locations
    
    return () => clearInterval(intervalId);
  }, [token, dispatch, sharedLocations.length]);
  
  const handleUpdateLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location && token) {
        await dispatch(
          updateCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            accuracy: location.accuracy,
            address: location.address,
            city: location.city,
            country: location.country,
          }) as any
        );
        // Refresh current location
        await dispatch(fetchCurrentLocation() as any);
      }
    } catch (error: any) {
      console.error('Error updating location:', error);
      const errorInfo = getLocationErrorMessage(error);
      setErrorDialog({
        visible: true,
        error: errorInfo,
        onRetry: handleUpdateLocation,
      });
    }
  };
  
  const handleShareLocation = () => {
    // Navigate to share location screen (to be implemented)
    navigation.navigate('Contacts' as never);
  };

  const onRefresh = useCallback(async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchCurrentLocation() as any),
        dispatch(fetchSharedLocations() as any),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, dispatch]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.isDark ? '#FFFFFF' : '#667eea'}
              colors={[theme.isDark ? '#FFFFFF' : '#667eea']}
            />
          }
        >
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
            <Surface style={styles.welcomeCard} elevation={4}>
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeIconContainer}>
                  <Text style={styles.welcomeIcon}>👋</Text>
                </View>
                <View style={styles.welcomeTextContainer}>
                  <Text style={styles.welcomeGreeting}>Welcome back!</Text>
                  <Text style={styles.welcomeName}>{user?.name || 'User'}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Your location sharing overview
                  </Text>
                </View>
              </View>
            </Surface>
          </Animated.View>

      {/* Current Location Card */}
      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>
          Current Location
        </Text>
        {currentLocation ? (
          <View style={styles.locationInfo}>
            {currentLocation.address ? (
              <>
                <Text style={styles.bodyText}>
                  📍 {currentLocation.address}
                </Text>
                {(currentLocation.city || currentLocation.country) && (
                  <Text style={styles.addressDetails}>
                    {[currentLocation.city, currentLocation.country].filter(Boolean).join(', ')}
                  </Text>
                )}
                <Text style={styles.coordinates}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.bodyText}>
                📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            )}
            <Text style={styles.timestamp}>
              Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.noLocation}>
            Location not available
          </Text>
        )}
        <Button 
          mode="outlined" 
          style={styles.cardButton}
          onPress={handleUpdateLocation}
        >
          Update Location
        </Button>
      </Surface>

      {/* Quick Actions */}
      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>
          Quick Actions
        </Text>
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            onPress={handleShareLocation}
          >
            Share Location
          </Button>
          <Button 
            mode="outlined" 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Contacts' as never)}
          >
            Add Contact
          </Button>
        </View>
      </Surface>

      {/* Recent Activity */}
      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>
          Recent Activity
        </Text>
        {sharedLocations.length > 0 ? (
          sharedLocations.slice(0, 3).map((location, index) => {
            // Calculate distance from current user location if available
            let distanceText = '';
            if (currentLocation) {
              const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                location.latitude,
                location.longitude
              );
              distanceText = formatDistance(distance);
            }
            
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  // Navigate to map view with this contact's location
                  (navigation as any).navigate('Map', { 
                    selectedUserId: location.user_id,
                    selectedUserName: location.owner_name || 'Contact'
                  });
                }}
              >
              <Card style={styles.activityCard}>
                <Card.Content>
                  <View style={styles.activityContent}>
                    <View style={styles.activityInfo}>
                      <Text style={styles.bodyText}>
                        📍 Location from {location.owner_name || location.owner_phone || 'Contact'}
                      </Text>
                      {distanceText && (
                        <Text style={styles.distanceText}>
                          📏 {distanceText} away
                        </Text>
                      )}
                      <Text style={styles.timestamp}>
                        {new Date(location.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.viewOnMap}>View on Map →</Text>
                  </View>
                </Card.Content>
              </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noActivity}>
            No recent activity
          </Text>
        )}
      </Surface>

      {/* Contacts Summary */}
      <Surface style={styles.card}>
        <Text style={styles.cardTitle}>
          Contacts ({contacts.length})
        </Text>
        {contacts.length > 0 ? (
          contacts.slice(0, 3).map((contact, index) => {
            const displayName = contact.contact_name || contact.user_account_name || contact.contact_phone;
            return (
              <View key={index} style={styles.contactItem}>
                <Avatar.Text 
                  size={40} 
                  label={displayName.charAt(0).toUpperCase()} 
                  style={styles.avatar}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.bodyText}>{displayName}</Text>
                  <Text style={styles.contactStatus}>
                    {contact.is_online ? '🟢 Online' : '⚫ Offline'}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noContacts}>
            No contacts yet
          </Text>
        )}
        <Button 
          mode="outlined" 
          style={styles.cardButton}
          onPress={() => (navigation as any).navigate('Contacts')}
        >
          View All Contacts
        </Button>
      </Surface>
        </ScrollView>
      </LinearGradient>
      
      <ErrorDialog
        visible={errorDialog.visible}
        errorInfo={errorDialog.error}
        onDismiss={() => setErrorDialog({ visible: false, error: null })}
        onRetry={errorDialog.onRetry}
      />
    </SafeAreaView>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
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
  },
  welcomeCard: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)',
  },
  welcomeIcon: {
    fontSize: 36,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontStyle: 'italic',
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: isDark ? '#FFFFFF' : '#333',
  },
  bodyText: {
    fontSize: 14,
    marginBottom: 8,
    color: isDark ? '#FFFFFF' : '#212121',
  },
  cardButton: {
    marginTop: 16,
  },
  locationInfo: {
    marginBottom: 16,
  },
  addressDetails: {
    fontSize: 12,
    color: isDark ? '#B0B0B0' : '#666',
    marginTop: 4,
  },
  coordinates: {
    fontSize: 12,
    color: isDark ? '#888' : '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  noLocation: {
    fontStyle: 'italic',
    color: isDark ? '#B0B0B0' : '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  activityCard: {
    marginBottom: 8,
    cursor: 'pointer',
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  viewOnMap: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 12,
  },
  distanceText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  noActivity: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactStatus: {
    fontSize: 14,
    color: '#666',
  },
  noContacts: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default MainScreenContent;



