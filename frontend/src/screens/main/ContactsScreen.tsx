import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput, Modal, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Surface, Button, Avatar, List, Dialog, Portal, Paragraph, TextInput as PaperTextInput, ActivityIndicator } from 'react-native-paper';
import { Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import * as Contacts from 'expo-contacts';
import type { Contact as ExpoContact } from 'expo-contacts';
import { RootState } from '../../store';
import { 
  fetchContacts, 
  addContact, 
  removeContact, 
  importContacts, 
  searchUserByPhone,
  clearError,
  Contact
} from '../../store/slices/contactsSlice';
import { trackLocationByPhone, fetchSharedLocations, stopSharingLocation, fetchContactsSharingWith } from '../../store/slices/locationSlice';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

const ContactsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { contacts, isLoading, error } = useSelector((state: RootState) => state.contacts);
  const { token } = useSelector((state: RootState) => state.auth);
  const { sharedLocations, contactsSharingWith } = useSelector((state: RootState) => state.location);
  const { theme } = useTheme();
  
  const gradientColors = theme.isDark 
    ? ['#764ba2', '#667eea', '#4a5568'] as const
    : ['#667eea', '#764ba2'] as const;
  
  const [addContactVisible, setAddContactVisible] = useState(false);
  const [trackPhoneVisible, setTrackPhoneVisible] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh contacts and shared locations when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        dispatch(fetchSharedLocations() as any);
        dispatch(fetchContacts() as any);
        dispatch(fetchContactsSharingWith() as any);
      }
    }, [token, dispatch])
  );

  useEffect(() => {
    if (token) {
      dispatch(fetchContacts() as any);
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleAddContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number');
      return;
    }

    try {
      await dispatch(
        addContact({
          contact_phone: contactPhone.trim(),
          contact_name: contactName.trim(),
        }) as any
      );
      setAddContactVisible(false);
      setContactName('');
      setContactPhone('');
      Alert.alert('Success', 'Contact added successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add contact');
    }
  };

  const handleImportContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required to import contacts');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length === 0) {
        Alert.alert('No Contacts', 'No contacts found on your device');
        return;
      }

      // Extract phone numbers (first phone number from each contact)
      const phones = data
        .filter((contact: ExpoContact) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: ExpoContact) => {
          // Clean phone number (remove spaces, dashes, etc.)
          const phone = contact.phoneNumbers![0].number?.replace(/[^\d+]/g, '') || '';
          return phone;
        })
        .filter((phone: string) => phone.length > 0);

      if (phones.length === 0) {
        Alert.alert('No Valid Phones', 'No valid phone numbers found in contacts');
        return;
      }

      // Import contacts
      const result = await dispatch(importContacts(phones) as any);
      Alert.alert(
        'Import Complete',
        `Imported ${result.payload?.contacts_added || 0} contact(s)`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to import contacts');
    }
  };

  const handleRemoveContact = (contactId: number) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeContact(contactId) as any);
              Alert.alert('Success', 'Contact removed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove contact');
            }
          },
        },
      ]
    );
  };

  const handleTrackByPhone = async () => {
    if (!trackPhone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      // First search for user
      const searchResponse = await dispatch(searchUserByPhone(trackPhone.trim()) as any);
      
      if (searchResponse.payload?.user_found) {
        // If user found, try to track location
        const trackResponse = await dispatch(trackLocationByPhone(trackPhone.trim()) as any);
        
        if (trackResponse.payload?.location) {
          setSearchResult({
            user: searchResponse.payload.user,
            location: trackResponse.payload.location,
            success: true,
          });
        } else {
          setSearchResult({
            user: searchResponse.payload.user,
            location: null,
            success: false,
            message: trackResponse.payload?.message || 'Location not available',
          });
        }
      } else {
        setSearchResult({
          user: null,
          location: null,
          success: false,
          message: 'User not found with this phone number',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to track location');
      setTrackPhoneVisible(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShareLocation = (contact: Contact) => {
    // Navigate to share location screen with contact pre-selected
    (navigation as any).navigate('Map', { shareWithContact: contact });
  };

  const getContactDisplayName = (contact: Contact) => {
    return contact.contact_name || contact.user_account_name || contact.contact_phone;
  };

  const getContactDisplayPhone = (contact: Contact) => {
    return contact.contact_phone;
  };

  const onRefresh = useCallback(async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchContacts() as any),
        dispatch(fetchSharedLocations() as any),
        dispatch(fetchContactsSharingWith() as any),
      ]);
    } catch (error) {
      console.error('Error refreshing contacts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, dispatch]);

  const handleStopSharing = async (contact: Contact) => {
    if (!contact.user_account_id) {
      Alert.alert('Error', 'Cannot stop sharing: Contact is not a registered user');
      return;
    }

    Alert.alert(
      'Stop Sharing Location',
      `Stop sharing your location with ${getContactDisplayName(contact)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Sharing',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(stopSharingLocation(Number(contact.user_account_id)) as any);
              await dispatch(fetchContactsSharingWith() as any);
              Alert.alert('Success', 'Location sharing stopped');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to stop sharing location');
            }
          },
        },
      ]
    );
  };

  const dynamicStyles = createContactsStyles(theme.isDark);

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
          <Animated.View
            style={[
              dynamicStyles.header,
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
            <View style={dynamicStyles.headerContent}>
              <Text style={dynamicStyles.title}>Contacts</Text>
              <Text style={dynamicStyles.subtitle}>Manage your location sharing contacts</Text>
            </View>
          </Animated.View>

      <Surface style={dynamicStyles.actionsCard}>
        <Button 
          mode="contained" 
          style={dynamicStyles.actionButton}
          onPress={() => setAddContactVisible(true)}
          loading={isLoading}
        >
          Add New Contact
        </Button>
        <Button 
          mode="outlined" 
          style={dynamicStyles.actionButton}
          onPress={handleImportContacts}
          loading={isLoading}
        >
          Import from Phone
        </Button>
        <Button 
          mode="outlined" 
          style={dynamicStyles.actionButton}
          onPress={() => setTrackPhoneVisible(true)}
        >
          Track by Phone Number
        </Button>
      </Surface>

      {isLoading && contacts.length === 0 ? (
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={dynamicStyles.loadingText}>Loading contacts...</Text>
        </View>
      ) : contacts.length > 0 ? (
        <Surface style={dynamicStyles.contactsCard}>
          <Text style={dynamicStyles.sectionTitle}>Your Contacts ({contacts.length})</Text>
          {contacts.map((contact) => {
            // Check if this contact has shared their location with us
            const hasSharedLocation = sharedLocations && sharedLocations.some(
              (loc: any) => String(loc.user_id) === String(contact.user_id) || loc.owner_phone === contact.contact_phone
            );
            
            // Check if we are sharing our location with this contact
            const isSharingWithContact = contact.user_account_id && 
              contactsSharingWith.includes(Number(contact.user_account_id));
            
            return (
              <View key={contact.id} style={dynamicStyles.contactItemContainer}>
                <List.Item
                  title={getContactDisplayName(contact)}
                  description={getContactDisplayPhone(contact)}
                  titleNumberOfLines={1}
                  descriptionNumberOfLines={1}
                  left={() => (
                    <Avatar.Text
                      size={40}
                      label={getContactDisplayName(contact).charAt(0).toUpperCase()}
                      style={dynamicStyles.avatar}
                    />
                  )}
                  style={dynamicStyles.contactItem}
                />
                <View style={dynamicStyles.contactActions}>
                  {hasSharedLocation && (
                    <Button
                      mode="contained"
                      compact
                      onPress={() => {
                        // Navigate to map view with this contact's location
                        (navigation as any).navigate('Map', { 
                          selectedUserId: contact.user_id,
                          selectedUserName: getContactDisplayName(contact)
                        });
                      }}
                      style={dynamicStyles.actionButtonCompact}
                      labelStyle={dynamicStyles.actionButtonLabel}
                    >
                      View on Map
                    </Button>
                  )}
                  {isSharingWithContact ? (
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleStopSharing(contact)}
                      style={[dynamicStyles.actionButtonCompact, { borderColor: '#F44336' }]}
                      labelStyle={[dynamicStyles.actionButtonLabel, { color: '#F44336' }]}
                    >
                      Stop Sharing
                    </Button>
                  ) : (
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleShareLocation(contact)}
                      style={dynamicStyles.actionButtonCompact}
                      labelStyle={dynamicStyles.actionButtonLabel}
                    >
                      Share
                    </Button>
                  )}
                  <Button
                    mode="text"
                    compact
                    onPress={() => handleRemoveContact(Number(contact.id))}
                    style={dynamicStyles.actionButtonCompact}
                    labelStyle={dynamicStyles.actionButtonLabel}
                  >
                    Remove
                  </Button>
                </View>
              </View>
            );
          })}
        </Surface>
      ) : (
        <Surface style={dynamicStyles.emptyCard}>
          <Text style={dynamicStyles.emptyTitle}>No Contacts Yet</Text>
          <Text style={dynamicStyles.emptyText}>
            Start by adding your first contact to share locations with
          </Text>
          <Button
            mode="contained"
            style={dynamicStyles.emptyButton}
            onPress={() => setAddContactVisible(true)}
          >
            Add Contact
          </Button>
        </Surface>
      )}

      {/* Add Contact Dialog */}
      <Portal>
        <Dialog visible={addContactVisible} onDismiss={() => setAddContactVisible(false)}>
          <Dialog.Title>Add New Contact</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Name"
              value={contactName}
              onChangeText={setContactName}
              style={dynamicStyles.dialogInput}
            />
            <PaperTextInput
              label="Phone Number"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              style={dynamicStyles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddContactVisible(false)}>Cancel</Button>
            <Button onPress={handleAddContact}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Track by Phone Dialog */}
      <Portal>
        <Dialog 
          visible={trackPhoneVisible} 
          onDismiss={() => {
            setTrackPhoneVisible(false);
            setTrackPhone('');
            setSearchResult(null);
          }}
        >
          <Dialog.Title>Track Location by Phone</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Phone Number"
              value={trackPhone}
              onChangeText={setTrackPhone}
              keyboardType="phone-pad"
              style={dynamicStyles.dialogInput}
              disabled={isSearching}
            />
            {isSearching && (
              <View style={dynamicStyles.searchingContainer}>
                <ActivityIndicator size="small" />
                <Text style={dynamicStyles.searchingText}>Searching...</Text>
              </View>
            )}
            {searchResult && (
              <View style={dynamicStyles.searchResultContainer}>
                {searchResult.user && (
                  <Paragraph style={dynamicStyles.searchResultText}>
                    User: {searchResult.user.name || searchResult.user.phone}
                  </Paragraph>
                )}
                {searchResult.success && searchResult.location ? (
                  <View>
                    <Paragraph style={dynamicStyles.successText}>
                      Location found!
                    </Paragraph>
                    <Paragraph style={dynamicStyles.searchResultText}>
                      Latitude: {searchResult.location.latitude.toFixed(6)}
                    </Paragraph>
                    <Paragraph style={dynamicStyles.searchResultText}>
                      Longitude: {searchResult.location.longitude.toFixed(6)}
                    </Paragraph>
                    {searchResult.location.address && (
                      <Paragraph style={dynamicStyles.searchResultText}>
                        Address: {searchResult.location.address}
                      </Paragraph>
                    )}
                    <Button
                      mode="contained"
                      style={dynamicStyles.viewMapButton}
                      onPress={() => {
                        (navigation as any).navigate('Map', {
                          trackLocation: searchResult.location,
                          trackUser: searchResult.user,
                        });
                        setTrackPhoneVisible(false);
                        setTrackPhone('');
                        setSearchResult(null);
                      }}
                    >
                      View on Map
                    </Button>
                  </View>
                ) : (
                  <Paragraph style={dynamicStyles.errorText}>
                    {searchResult.message || 'Location not available'}
                  </Paragraph>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setTrackPhoneVisible(false);
                setTrackPhone('');
                setSearchResult(null);
              }}
            >
              Close
            </Button>
            <Button onPress={handleTrackByPhone} disabled={isSearching}>
              Track
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const createContactsStyles = (isDark: boolean) => StyleSheet.create({
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
  headerContent: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  actionButton: {
    marginBottom: 12,
  },
  contactsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: isDark ? '#FFFFFF' : '#333',
  },
  contactItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  contactItem: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  avatar: {
    marginRight: 8,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: 4,
    paddingLeft: 56, // Align with content (avatar width + margin)
  },
  actionButtonCompact: {
    marginLeft: 4,
    marginRight: 4,
    minWidth: 60,
  },
  actionButtonLabel: {
    fontSize: 12,
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
    marginBottom: 24,
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
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
  dialogInput: {
    marginBottom: 16,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: isDark ? '#B0B0B0' : '#666',
  },
  searchResultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: isDark ? '#2A2A2A' : '#f5f5f5',
    borderRadius: 8,
  },
  searchResultText: {
    fontSize: 14,
    marginBottom: 8,
    color: isDark ? '#FFFFFF' : '#333',
  },
  successText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  viewMapButton: {
    marginTop: 12,
    marginRight: 8,
    marginBottom: 4,
  },
});

const styles = StyleSheet.create({});

export default ContactsScreen;
