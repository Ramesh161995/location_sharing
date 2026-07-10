/**
 * Location Helper Service
 * Wraps expo-location for easier use with the app
 */
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface LocationWithAddress extends LocationData {
  address?: string;
  city?: string;
  country?: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Check if location permissions are granted
 */
export async function hasLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permissions:', error);
    return false;
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<LocationWithAddress | null> {
  try {
    // Check permissions
    const hasPermission = await hasLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });

    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
    };

    // Try to get address (reverse geocoding)
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Build full address string from address components
        const addressParts: string[] = [];
        if (address.streetNumber) addressParts.push(address.streetNumber);
        if (address.street) addressParts.push(address.street);
        if (address.district) addressParts.push(address.district);
        if (address.name && !addressParts.includes(address.name)) addressParts.push(address.name);
        
        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;
        
        return {
          ...locationData,
          address: fullAddress,
          city: address.city || address.subAdministrativeArea || address.region || undefined,
          country: address.country || undefined,
        };
      }
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed:', geocodeError);
      // Return location without address if geocoding fails
    }

    return locationData;
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
}

/**
 * Watch location updates
 */
export async function watchPosition(
  callback: (location: LocationWithAddress) => void,
  options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  }
): Promise<Location.LocationSubscription | null> {
  try {
    // Check permissions
    const hasPermission = await hasLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        throw new Error('Location permission denied');
      }
    }

    // Watch position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy || Location.Accuracy.Balanced,
        timeInterval: options?.timeInterval || 5000, // 5 seconds
        distanceInterval: options?.distanceInterval || 10, // 10 meters
        mayShowUserSettingsDialog: true,
      },
      async (location) => {
        const locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || undefined,
          accuracy: location.coords.accuracy || undefined,
          speed: location.coords.speed || undefined,
          heading: location.coords.heading || undefined,
        };

        // Try to get address (reverse geocoding)
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (addresses && addresses.length > 0) {
            const address = addresses[0];
            // Build full address string from address components
            const addressParts: string[] = [];
            if (address.streetNumber) addressParts.push(address.streetNumber);
            if (address.street) addressParts.push(address.street);
            if (address.district) addressParts.push(address.district);
            if (address.name && !addressParts.includes(address.name)) addressParts.push(address.name);
            
            const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;
            
            callback({
              ...locationData,
              address: fullAddress,
              city: address.city || address.subAdministrativeArea || address.region || undefined,
              country: address.country || undefined,
            });
          } else {
            callback(locationData);
          }
        } catch (geocodeError) {
          console.warn('Reverse geocoding failed:', geocodeError);
          callback(locationData);
        }
      }
    );

    return subscription;
  } catch (error) {
    console.error('Error watching position:', error);
    throw error;
  }
}

/**
 * Stop watching location
 */
export function stopWatchingLocation(subscription: Location.LocationSubscription | null) {
  if (subscription) {
    subscription.remove();
  }
}

