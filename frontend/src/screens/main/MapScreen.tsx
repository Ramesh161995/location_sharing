import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapType } from 'react-native-maps';
import { Button, Text, Menu, Divider, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { calculateDistance, formatDistance } from '../../utils/distance';
import { useTheme } from '../../contexts/ThemeContext';
import { getBatteryImpact, getBatteryOptimizedSettings, getBatteryOptimizationTips } from '../../utils/batteryOptimization';
import {
  fetchCurrentLocation,
  fetchSharedLocations,
  updateCurrentLocation,
  setTracking,
  shareLocationWithContacts,
} from '../../store/slices/locationSlice';
import { getCurrentLocation, watchPosition, stopWatchingLocation, requestLocationPermissions } from '../../services/locationHelper';
import type { LocationSubscription } from 'expo-location';

const MapScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { currentLocation, sharedLocations, isLoading, isTracking } = useSelector(
    (state: RootState) => state.location
  );
  const { token } = useSelector((state: RootState) => state.auth);
  const { contacts } = useSelector((state: RootState) => state.contacts);
  const { theme: themeContext } = useTheme();
  const styles = createMapStyles(themeContext.isDark);

  // Get navigation params (selectedUserId from MainScreen or ContactsScreen, or shareWithContact for sharing)
  const routeParams = route.params as { 
    selectedUserId?: number; 
    selectedUserName?: string;
    shareWithContact?: any;
  } | undefined;
  const initialSelectedUserId = routeParams?.selectedUserId ? String(routeParams.selectedUserId) : null;
  const shareContact = routeParams?.shareWithContact;

  const mapRef = useRef<MapView>(null);
  const locationSubscriptionRef = useRef<LocationSubscription | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 28.6139, // Default to Delhi, India
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(initialSelectedUserId);
  const [menuVisible, setMenuVisible] = useState(false);
  const [batteryHint, setBatteryHint] = useState<{ level: 'low' | 'medium' | 'high'; message: string; suggestion: string } | null>(null);
  const [showBatteryTips, setShowBatteryTips] = useState(false);
  const [mapType, setMapType] = useState<MapType>('standard');

  // Get unique contacts who have shared their location
  const contactsWithSharedLocations = React.useMemo(() => {
    const contactMap = new Map<string, any>();
    
    sharedLocations.forEach((sharedLoc) => {
      const userId = sharedLoc.user_id;
      if (!contactMap.has(userId)) {
        // Find contact by user_id
        const contact = contacts.find((c) => 
          c.user_account_id === userId || c.contact_phone === sharedLoc.owner_phone
        );
        
        contactMap.set(userId, {
          user_id: userId,
          name: sharedLoc.owner_name || contact?.contact_name || sharedLoc.owner_phone || 'Unknown',
          phone: sharedLoc.owner_phone,
          location: sharedLoc,
        });
      }
    });
    
    return Array.from(contactMap.values());
  }, [sharedLocations, contacts]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
    loadLocations();

    return () => {
      // Cleanup: stop watching location when component unmounts
      if (locationSubscriptionRef.current) {
        stopWatchingLocation(locationSubscriptionRef.current);
      }
    };
  }, []);

  // Handle sharing location with contact when navigated from ContactsScreen
  useEffect(() => {
    const handleShareWithContact = async () => {
      if (!shareContact) return;
      
      if (!token) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      console.log('🔵 Share flow triggered:', { shareContact, hasCurrentLocation: !!currentLocation });
      
      // Try to get current location if not available
      let locationId: number | null = null;
      
      if (currentLocation?.id) {
        locationId = parseInt(String(currentLocation.id));
        console.log('✅ Using existing location ID:', locationId);
      } else {
        console.log('⚠️ No current location, fetching...');
        try {
          const locationResponse = await dispatch(fetchCurrentLocation() as any);
          if (locationResponse.payload?.id) {
            locationId = parseInt(String(locationResponse.payload.id));
            console.log('✅ Fetched location ID:', locationId);
          } else {
            Alert.alert('Error', 'Please update your location first before sharing');
            return;
          }
        } catch (error) {
          console.error('❌ Error fetching location:', error);
          Alert.alert('Error', 'Please update your location first before sharing');
          return;
        }
      }
      
      // Get contact user ID
      const contactUserId = shareContact.user_account_id || shareContact.user_id;
      if (!contactUserId) {
        Alert.alert('Error', 'Contact user ID not found');
        return;
      }
      
      console.log('📤 Sharing location:', { locationId, contactUserId, contact: shareContact });
      
      try {
        // Share location
        const shareResponse = await dispatch(shareLocationWithContacts({
          locationId: locationId!,
          contactUserIds: [parseInt(String(contactUserId))],
          permissionLevel: 'view'
        }) as any);
        
        console.log('📥 Share response:', shareResponse);
        
        if (shareResponse.type === 'location/shareLocationWithContacts/fulfilled') {
          Alert.alert('Success', `Location shared with ${shareContact.contact_name || shareContact.contact_phone}`);
          // Refresh shared locations
          await dispatch(fetchSharedLocations() as any);
        } else {
          const errorMsg = shareResponse.payload || shareResponse.error?.message || 'Failed to share location';
          console.error('❌ Share failed:', errorMsg);
          Alert.alert('Error', errorMsg);
        }
      } catch (error: any) {
        console.error('❌ Error sharing location:', error);
        Alert.alert('Error', error.message || 'Failed to share location');
      }
    };

    if (shareContact && token) {
      handleShareWithContact();
    }
  }, [shareContact, token]); // Removed currentLocation from dependencies to handle it inside the effect

  // Refresh shared locations when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        dispatch(fetchSharedLocations() as any);
        if (!selectedContactId) {
          dispatch(fetchCurrentLocation() as any);
        }
      }
    }, [token, dispatch, selectedContactId])
  );

  // Auto-refresh shared locations periodically (every 60 seconds) for live updates
  // Only when map screen is active and user has shared locations
  useEffect(() => {
    if (!token || sharedLocations.length === 0) return;
    
    const intervalId = setInterval(() => {
      dispatch(fetchSharedLocations() as any);
    }, 60000); // Refresh every 60 seconds, only if there are shared locations
    
    return () => clearInterval(intervalId);
  }, [token, dispatch, sharedLocations.length]);

  // Update map region when current location changes (only if no contact is selected)
  useEffect(() => {
    if (currentLocation && !selectedContactId && sharedLocations.length === 0) {
      // Only auto-center on current location if no shared locations exist
      const region: Region = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
      
      // Animate to location
      mapRef.current?.animateToRegion(region, 1000);
    } else if (currentLocation && !selectedContactId && sharedLocations.length > 0) {
      // If there are shared locations but no selection, center on the first shared location
      const firstShared = sharedLocations[0];
      const region: Region = {
        latitude: firstShared.latitude,
        longitude: firstShared.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 1000);
    }
  }, [currentLocation, selectedContactId, sharedLocations]);

  // Update map region when selected contact changes or when navigating from other screens
  useEffect(() => {
    // First, handle initial navigation params
    if (initialSelectedUserId && sharedLocations.length > 0 && selectedContactId !== initialSelectedUserId) {
      // If we have an initial selected user from navigation params, find their location
      const selectedSharedLocation = sharedLocations.find(
        (loc: any) => String(loc.user_id) === String(initialSelectedUserId)
      );
      if (selectedSharedLocation) {
        setSelectedContactId(initialSelectedUserId);
        const region: Region = {
          latitude: selectedSharedLocation.latitude,
          longitude: selectedSharedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 1000);
        return;
      }
    }
    
    // Then, handle selected contact changes
    if (selectedContactId && !initialSelectedUserId) {
      const selectedContact = contactsWithSharedLocations.find(
        (c) => String(c.user_id) === String(selectedContactId)
      );
      
      if (selectedContact && selectedContact.location) {
        const region: Region = {
          latitude: selectedContact.location.latitude,
          longitude: selectedContact.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 1000);
      }
    }
  }, [selectedContactId, contactsWithSharedLocations, initialSelectedUserId, sharedLocations]);

  const checkPermissions = async () => {
    const granted = await requestLocationPermissions();
    setHasPermission(granted);
    
    if (!granted) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions in settings to use this feature.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadLocations = async () => {
    if (!token) return;
    
    try {
      await Promise.all([
        dispatch(fetchCurrentLocation() as any),
        dispatch(fetchSharedLocations() as any),
      ]);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleGetLocation = async () => {
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }
      setHasPermission(true);
    }

    try {
      const location = await getCurrentLocation();
      if (location && token) {
        // Update location in backend
        await dispatch(
          updateCurrentLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: location.altitude,
            accuracy: location.accuracy,
            speed: location.speed,
            heading: location.heading,
            address: location.address,
            city: location.city,
            country: location.country,
          }) as any
        );

        // Refresh current location from backend
        await dispatch(fetchCurrentLocation() as any);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get location');
    }
  };

  const handleStartTracking = async () => {
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }
      setHasPermission(true);
    }

    try {
      dispatch(setTracking(true));
      
      // Calculate battery impact
      const hint = getBatteryImpact(10000, 'high'); // 10 second interval, high accuracy
      setBatteryHint(hint);
      
      // Start watching location
      const subscription = await watchPosition(
        async (location) => {
          if (token) {
            // Update location in backend periodically
            await dispatch(
              updateCurrentLocation({
                latitude: location.latitude,
                longitude: location.longitude,
                altitude: location.altitude,
                accuracy: location.accuracy,
                speed: location.speed,
                heading: location.heading,
                address: location.address,
                city: location.city,
                country: location.country,
              }) as any
            );
          }
        },
        {
          accuracy: 4, // High accuracy
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        }
      );

      locationSubscriptionRef.current = subscription;
    } catch (error: any) {
      dispatch(setTracking(false));
      Alert.alert('Error', error.message || 'Failed to start tracking');
    }
  };

  const handleStopTracking = () => {
    if (locationSubscriptionRef.current) {
      stopWatchingLocation(locationSubscriptionRef.current);
      locationSubscriptionRef.current = null;
    }
    dispatch(setTracking(false));
    setBatteryHint(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={mapRegion}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={isTracking}
        loadingEnabled={true}
      >
        {/* Waterdrop 3D gradient overlay - subtle overlay for map visibility */}
        <LinearGradient
          colors={['rgba(128, 128, 128, 0.08)', 'rgba(105, 105, 105, 0.12)', 'rgba(128, 128, 128, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.waterdropOverlay}
          pointerEvents="none"
        />

        {/* Shared locations markers */}
        {sharedLocations
          .filter((sharedLocation) => {
            if (!selectedContactId) return true;
            // Match by user_id field (which represents the owner in shared locations)
            return sharedLocation.user_id === selectedContactId;
          })
          .map((sharedLocation) => {
            // Find the contact info for this shared location
            const contactInfo = contactsWithSharedLocations.find(
              (c: any) => c.user_id === sharedLocation.user_id
            );
            const contactName = contactInfo?.name || sharedLocation.owner_name || 'Shared Location';
            const isSelected = selectedContactId === sharedLocation.user_id;
            
            // Calculate rotation angle if heading is available (for future use)
            const speed = sharedLocation.speed ? (sharedLocation.speed * 3.6).toFixed(1) : null; // Convert m/s to km/h
            const heading = sharedLocation.heading !== undefined && sharedLocation.heading !== null 
              ? Math.round(sharedLocation.heading) 
              : null;
            
            return (
              <Marker
                key={sharedLocation.id}
                coordinate={{
                  latitude: sharedLocation.latitude,
                  longitude: sharedLocation.longitude,
                }}
                title={contactName}
                description={
                  sharedLocation.address 
                    ? `${sharedLocation.address}${speed ? ` • ${speed} km/h` : ''}${heading !== null ? ` • ${heading}°` : ''}`
                    : `${sharedLocation.latitude.toFixed(6)}, ${sharedLocation.longitude.toFixed(6)}${speed ? ` • ${speed} km/h` : ''}${heading !== null ? ` • ${heading}°` : ''}`
                }
                pinColor={isSelected ? "green" : "blue"}
              />
            );
          })}
      </MapView>

      {/* Contacts dropdown - shows contacts who have shared location */}
      {contactsWithSharedLocations.length > 0 && (
        <SafeAreaView style={styles.contactsDropdown} edges={['top']}>
          <Button
            mode="contained"
            onPress={() => setMenuVisible(true)}
            icon="account-group"
            style={styles.dropdownButton}
            compact
          >
            {selectedContactId
              ? contactsWithSharedLocations.find((c: any) => c.user_id === selectedContactId)?.name || 'Select Contact'
              : `Track (${contactsWithSharedLocations.length})`}
          </Button>
          <Portal>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                  }}
                />
              }
              style={styles.menu}
            >
              <Menu.Item
                onPress={() => {
                  setSelectedContactId(null);
                  setMenuVisible(false);
                  if (currentLocation) {
                    const region: Region = {
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    };
                    mapRef.current?.animateToRegion(region, 1000);
                  }
                }}
                title="My Location"
              />
              <Divider />
              {contactsWithSharedLocations.map((contact: any) => (
                <Menu.Item
                  key={contact.user_id}
                  onPress={() => {
                    setSelectedContactId(contact.user_id);
                    setMenuVisible(false);
                    const region: Region = {
                      latitude: contact.location.latitude,
                      longitude: contact.location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    };
                    mapRef.current?.animateToRegion(region, 1000);
                  }}
                  title={contact.name}
                />
              ))}
            </Menu>
          </Portal>
        </SafeAreaView>
      )}

      {/* Control buttons */}
      <SafeAreaView style={styles.controlsContainer} edges={['top']}>
        <View style={styles.controls}>
          <Button
            mode="contained"
            onPress={handleGetLocation}
            disabled={isLoading || !hasPermission}
            style={styles.controlButtonIcon}
            contentStyle={styles.buttonContentIcon}
            icon="crosshairs-gps"
            buttonColor={themeContext.isDark ? 'rgba(169, 169, 169, 0.8)' : 'rgba(220, 220, 220, 0.8)'}
            compact
          >
            {''}
          </Button>

          {!isTracking ? (
            <Button
              mode="contained"
              onPress={handleStartTracking}
              disabled={isLoading || !hasPermission}
              style={[styles.controlButtonIcon, styles.trackButton]}
              contentStyle={styles.buttonContentIcon}
              icon="play"
              buttonColor={themeContext.isDark ? 'rgba(169, 169, 169, 0.8)' : 'rgba(220, 220, 220, 0.8)'}
              compact
            >
              {''}
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleStopTracking}
              style={[styles.controlButtonIcon, styles.stopButton]}
              contentStyle={styles.buttonContentIcon}
              icon="stop"
              buttonColor={themeContext.isDark ? 'rgb(169, 169, 169)' : 'rgba(220, 220, 220, 0.8)'}
              compact
            >
              {''}
            </Button>
          )}

          <Button
            mode="contained"
            onPress={loadLocations}
            disabled={isLoading}
            style={styles.controlButtonIcon}
            contentStyle={styles.buttonContentIcon}
            icon="refresh"
            buttonColor={themeContext.isDark ? 'rgba(169, 169, 169, 0.8)' : 'rgba(220, 220, 220, 0.8)'}
            compact
          >
            {''}
          </Button>
          
          <Button
            mode="contained"
            onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
            style={styles.controlButtonIcon}
            contentStyle={styles.buttonContentIcon}
            icon={mapType === 'satellite' ? 'satellite-variant' : 'map'}
            buttonColor={themeContext.isDark ? 'rgba(169, 169, 169, 0.74)' : 'rgba(220, 220, 220, 0.8)'}
            compact
          >
            {''}
          </Button>
        </View>
      </SafeAreaView>

      {/* Info overlay */}
      <SafeAreaView style={styles.infoContainer} edges={['bottom']}>
        <View style={styles.info}>
          {selectedContactId ? (
            <>
              {(() => {
                const selectedContact = contactsWithSharedLocations.find((c: any) => c.user_id === selectedContactId);
                const selectedLocation = selectedContact?.location;
                let distanceText = '';
                if (currentLocation && selectedLocation) {
                  const distance = calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    selectedLocation.latitude,
                    selectedLocation.longitude
                  );
                  distanceText = formatDistance(distance);
                }
                
                return (
                  <>
                    <View style={styles.infoHeader}>
                      <Text style={styles.infoTitle}>
                        📍 Tracking: {selectedContact?.name || 'Contact'}
                      </Text>
                    </View>
                    {selectedLocation && (
                      <View style={styles.infoContentRow}>
                        <View style={styles.infoAddressContainer}>
                          <Text style={styles.infoAddress} numberOfLines={2}>
                            {selectedLocation.address || 
                             `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                          </Text>
                          {distanceText && (
                            <Text style={styles.distanceText}>
                              📏 {distanceText} away
                            </Text>
                          )}
                        </View>
                        <View style={styles.infoButtonsContainer}>
                          {currentLocation && (
                            <Button
                              mode="contained"
                              compact
                              icon="directions"
                              onPress={() => {
                                const url = Platform.select({
                                  ios: `maps://maps.apple.com/?daddr=${selectedLocation.latitude},${selectedLocation.longitude}&dirflg=d`,
                                  android: `google.navigation:q=${selectedLocation.latitude},${selectedLocation.longitude}`,
                                });
                                if (url) {
                                  Linking.openURL(url).catch((err) => {
                                    console.error('Failed to open directions:', err);
                                    Alert.alert('Error', 'Could not open directions. Please check your map app.');
                                  });
                                }
                              }}
                              style={styles.directionsButtonIcon}
                              contentStyle={styles.directionsButtonIconContent}
                            >
                              {''}
                            </Button>
                          )}
                          <Button
                            mode="text"
                            compact
                            icon="close"
                            onPress={() => setSelectedContactId(null)}
                            style={styles.clearButtonIcon}
                            contentStyle={styles.clearButtonIconContent}
                          >
                            {''}
                          </Button>
                        </View>
                      </View>
                    )}
                    {selectedLocation && (
                      <View style={styles.infoDetailsRow}>
                        {selectedLocation.speed && selectedLocation.speed > 0 && (
                          <Text style={styles.speedText}>
                            ⚡ {(selectedLocation.speed * 3.6).toFixed(1)} km/h
                          </Text>
                        )}
                        {selectedLocation.heading !== undefined && selectedLocation.heading !== null && (
                          <Text style={styles.headingText}>
                            🧭 {Math.round(selectedLocation.heading)}°
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            <>
              <Text style={styles.infoTitle}>📍 Your Location</Text>
              {currentLocation && (
                <>
                  <Text style={styles.infoAddress}>
                    {currentLocation.address || 
                     `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
                  </Text>
                  {currentLocation.speed && currentLocation.speed > 0 && (
                    <Text style={styles.speedText}>
                      ⚡ {(currentLocation.speed * 3.6).toFixed(1)} km/h
                    </Text>
                  )}
                  {currentLocation.heading !== undefined && currentLocation.heading !== null && (
                    <Text style={styles.headingText}>
                      🧭 Heading: {Math.round(currentLocation.heading)}°
                    </Text>
                  )}
                </>
              )}
              {contactsWithSharedLocations.length > 0 && (
                <Text style={styles.infoSubtext}>
                  👥 {contactsWithSharedLocations.length} contact(s) sharing location
                </Text>
              )}
              {isTracking && batteryHint && (
                <View style={styles.batteryHintContainer}>
                  <View style={[styles.batteryIndicator, { backgroundColor: batteryHint.level === 'high' ? '#F44336' : batteryHint.level === 'medium' ? '#FF9800' : '#4CAF50' }]}>
                    <Text style={styles.batteryIndicatorText}>
                      🔋 {batteryHint.level === 'high' ? 'High' : batteryHint.level === 'medium' ? 'Mod' : 'Low'}
                    </Text>
                  </View>
                  <Text style={styles.batteryHintText}>{batteryHint.suggestion}</Text>
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const createMapStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  waterdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
    
  },
  controls: {
    borderRadius: 16,
    padding: 8,
    margin: 8,
    overflow: 'hidden',
  
    // iOS glass shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  
    // Android elevation
    elevation: 14,
  
    flexDirection: 'column',
    gap: 6,
  
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(255,255,255,0.35)',
  },
  controlButton: {
    minWidth: 100,
    marginVertical: 2,
  },
  controlButtonIcon: {
    minWidth: 48,
    width: 48,
    height: 48,
    marginVertical: 1,
  
    // Glassy green
    backgroundColor: isDark
      ? 'rgba(46, 125, 50, 0.7)'   // dark green, translucent
      : 'rgba(76, 175, 80, 0.75)', // light green, translucent
  
    borderRadius: 16,
  
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.35)',
  
    // Soft floating shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonContentIcon: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 48,
    height: 48,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackButton: {
    marginVertical: 2,
  },
  stopButton: {
    marginVertical: 2,
  },
  contactsDropdown: {
    position: 'absolute',
    top: 0,
    left: 16,
    zIndex: 1000,
    maxWidth: 200,
    paddingTop: 8,
  },
  dropdownButton: {
    backgroundColor: '#2196F3',
    elevation: 4,
  },
  menu: {
    marginTop: 60,
    marginLeft: 16,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  info: {
    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    margin: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoHeader: {
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDark ? '#FFFFFF' : '#333',
    marginBottom: 8,
  },
  infoContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoAddressContainer: {
    flex: 1,
    marginRight: 8,
  },
  infoButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsButtonIcon: {
    minWidth: 40,
    width: 40,
    height: 40,
  },
  directionsButtonIconContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 40,
    height: 40,
  },
  clearButtonIcon: {
    minWidth: 40,
    width: 40,
    height: 40,
  },
  clearButtonIconContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 40,
    height: 40,
  },
  infoAddress: {
    fontSize: 14,
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 20,
  },
  infoSubtext: {
    fontSize: 12,
    color: isDark ? '#888' : '#888',
    marginTop: 8,
  },
  distanceText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 6,
  },
  batteryHintContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: isDark ? '#2A2A2A' : '#f0f0f0',
    borderRadius: 8,
  },
  batteryIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  batteryIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  batteryHintText: {
    fontSize: 11,
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 16,
  },
  speedText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  headingText: {
    fontSize: 12,
    color: isDark ? '#B0B0B0' : '#666',
    marginTop: 2,
  },
  infoDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});

const styles = StyleSheet.create({});

export default MapScreen;
