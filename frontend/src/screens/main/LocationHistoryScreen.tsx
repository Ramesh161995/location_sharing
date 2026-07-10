import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Surface, List, Avatar, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { fetchLocationHistory } from '../../store/slices/locationSlice';
import type { Location } from '../../store/slices/locationSlice';
import { useTheme } from '../../contexts/ThemeContext';

const LocationHistoryScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const { locationHistory, isLoading } = useSelector((state: RootState) => state.location);
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  const gradientColors = theme.isDark 
    ? ['#764ba2', '#667eea', '#4a5568'] as const
    : ['#667eea', '#764ba2'] as const;

  useEffect(() => {
    if (token) {
      dispatch(fetchLocationHistory() as any);
    }
  }, [token, dispatch]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchLocationHistory() as any);
    } catch (error) {
      console.error('Error refreshing history:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, dispatch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const groupByDate = (locations: Location[]) => {
    const groups: { [key: string]: Location[] } = {};
    
    locations.forEach((location) => {
      const date = new Date(location.timestamp);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(location);
    });
    
    return groups;
  };

  const locationGroups = locationHistory.length > 0 ? groupByDate(locationHistory) : {};

  const dynamicStyles = createStyles(theme.isDark);

  return (
    <SafeAreaView style={dynamicStyles.container} edges={[]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={dynamicStyles.gradient}
      >
        <ScrollView 
          style={dynamicStyles.scrollView} 
          contentContainerStyle={dynamicStyles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.isDark ? '#FFFFFF' : '#667eea'}
              colors={[theme.isDark ? '#FFFFFF' : '#667eea']}
            />
          }
        >
          <View style={dynamicStyles.header}>
            <View style={dynamicStyles.headerTop}>
              <Button
                mode="text"
                icon="arrow-left"
                onPress={() => navigation.goBack()}
                textColor="white"
                style={dynamicStyles.backButton}
                labelStyle={dynamicStyles.backButtonLabel}
              >
                Back
              </Button>
            </View>
            <Text style={dynamicStyles.title}>Location History</Text>
            <Text style={dynamicStyles.subtitle}>
              {locationHistory.length > 0 
                ? `${locationHistory.length} location${locationHistory.length > 1 ? 's' : ''} recorded`
                : 'No location history yet'}
            </Text>
          </View>

          {isLoading && locationHistory.length === 0 ? (
            <View style={dynamicStyles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={dynamicStyles.loadingText}>Loading history...</Text>
            </View>
          ) : locationHistory.length === 0 ? (
            <Surface style={dynamicStyles.emptyCard}>
              <Text style={dynamicStyles.emptyTitle}>No History Yet</Text>
              <Text style={dynamicStyles.emptyText}>
                Your location history will appear here once you start tracking your location.
              </Text>
            </Surface>
          ) : (
            Object.keys(locationGroups).map((dateKey) => (
              <View key={dateKey} style={dynamicStyles.dateGroup}>
                <Text style={dynamicStyles.dateHeader}>{dateKey}</Text>
                <Surface style={dynamicStyles.locationsCard}>
                  {locationGroups[dateKey].map((location, index) => (
                    <List.Item
                      key={location.id}
                      title={
                        location.address 
                          ? location.address.split(',')[0] || 'Unknown Location'
                          : `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                      }
                      description={
                        <View>
                          <Text style={dynamicStyles.descriptionText}>
                            {formatTime(location.timestamp)} • {formatDate(location.timestamp)}
                          </Text>
                          {location.city && location.country && (
                            <Text style={dynamicStyles.descriptionText}>
                              {location.city}, {location.country}
                            </Text>
                          )}
                          {location.accuracy && (
                            <View style={dynamicStyles.chipContainer}>
                              <Chip 
                                icon="target" 
                                style={dynamicStyles.chip}
                                textStyle={dynamicStyles.chipText}
                              >
                                ±{Math.round(location.accuracy)}m
                              </Chip>
                              {location.speed && location.speed > 0 && (
                                <Chip 
                                  icon="speedometer" 
                                  style={dynamicStyles.chip}
                                  textStyle={dynamicStyles.chipText}
                                >
                                  {(location.speed * 3.6).toFixed(1)} km/h
                                </Chip>
                              )}
                            </View>
                          )}
                        </View>
                      }
                      left={() => (
                        <Avatar.Icon
                          size={40}
                          icon="map-marker"
                          style={dynamicStyles.avatar}
                        />
                      )}
                      onPress={() => {
                        // Navigate to map with this location
                        (navigation as any).navigate('Map', {
                          initialLocation: {
                            latitude: location.latitude,
                            longitude: location.longitude,
                          },
                        });
                      }}
                      style={dynamicStyles.locationItem}
                    />
                  ))}
                </Surface>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
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
    padding: 16,
    paddingTop: 48,
  },
  headerTop: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonLabel: {
    fontSize: 16,
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: isDark ? '#B0B0B0' : '#666',
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    elevation: 2,
    alignItems: 'center',
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: isDark ? '#FFFFFF' : '#666',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  locationsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
    overflow: 'hidden',
  },
  locationItem: {
    paddingVertical: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: isDark ? '#B0B0B0' : '#666',
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: isDark ? '#2A2A2A' : '#f0f0f0',
    height: 24,
  },
  chipText: {
    fontSize: 10,
    color: isDark ? '#FFFFFF' : '#333',
  },
  avatar: {
    backgroundColor: isDark ? '#2A2A2A' : '#e3f2fd',
  },
});

export default LocationHistoryScreen;

