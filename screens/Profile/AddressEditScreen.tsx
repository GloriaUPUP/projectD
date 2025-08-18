import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, LoadingSpinner } from '../../components';
import { apiService } from '../../services/api';
import { theme } from '../../utils/theme';

interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
}

interface AddressEditScreenProps {
  navigation: any;
}

const AddressEditScreen: React.FC<AddressEditScreenProps> = ({ navigation }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAddresses();
      console.log('Address API Response:', response);
      
      if (response.success) {
        // Handle different response structures
        let addressData = response.data;
        
        // Backend returns data in format: {"data": {"data": [...], "success": true}, "success": true}
        if (addressData && addressData.data && Array.isArray(addressData.data)) {
          addressData = addressData.data;
        } else if (addressData && typeof addressData === 'object' && !Array.isArray(addressData)) {
          if (addressData.addresses && Array.isArray(addressData.addresses)) {
            addressData = addressData.addresses;
          }
        }
        
        // Ensure we have an array
        if (Array.isArray(addressData)) {
          // Map backend response to frontend format
          const mappedAddresses = addressData.map((addr: any) => ({
            id: addr.id?.toString(),
            label: addr.label,
            address: addr.address,
            city: addr.city,
            postalCode: addr.postalCode,
            phone: addr.phone,
            isDefault: addr.default || false
          }));
          setAddresses(mappedAddresses);
        } else {
          console.warn('Address data is not an array:', addressData);
          setAddresses([]);
        }
      } else {
        console.error('API call failed:', response.error);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!newAddress.label) newErrors.label = 'Address name is required';
    if (!newAddress.address) newErrors.address = 'Address is required';
    if (!newAddress.city) newErrors.city = 'City is required';
    if (!newAddress.phone) newErrors.phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = async () => {
    if (!validateAddress()) return;
    
    try {
      setActionLoading('add');
      const addressData = {
        name: newAddress.label || '',
        address: newAddress.address || '',
        city: newAddress.city || '',
        postalCode: newAddress.postalCode || '',
        phone: newAddress.phone || '',
      };
      
      const response = await apiService.addAddress(addressData);
      if (response.success && response.data) {
        // Map the new address response to frontend format
        const newAddr = {
          id: response.data.id?.toString(),
          label: response.data.label,
          address: response.data.address,
          city: response.data.city,
          postalCode: response.data.postalCode,
          phone: response.data.phone,
          isDefault: response.data.default || false
        };
        setAddresses([...addresses, newAddr]);
        setNewAddress({});
        setShowAddForm(false);
        setErrors({});
      } else {
        Alert.alert('Error', response.error || 'Failed to add address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAddress(id),
        },
      ]
    );
  };

  const deleteAddress = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await apiService.deleteAddress(id);
      if (response.success) {
        setAddresses(addresses.filter(addr => addr.id !== id));
      } else {
        Alert.alert('Error', response.error || 'Failed to delete address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete address');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setActionLoading(id);
      const response = await apiService.setDefaultAddress(id);
      if (response.success) {
        setAddresses(addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === id,
        })));
      } else {
        Alert.alert('Error', response.error || 'Failed to set default address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Address Book</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {showAddForm && (
          <Card style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Address</Text>
            <Input
              label="Address Name"
              value={newAddress.label || ''}
              onChangeText={(value) => setNewAddress({...newAddress, label: value})}
              error={errors.label}
              placeholder="e.g., Home, Office"
              required
            />
            <Input
              label="Address"
              value={newAddress.address || ''}
              onChangeText={(value) => setNewAddress({...newAddress, address: value})}
              error={errors.address}
              required
            />
            <Input
              label="City"
              value={newAddress.city || ''}
              onChangeText={(value) => setNewAddress({...newAddress, city: value})}
              error={errors.city}
              required
            />
            <Input
              label="Postal Code"
              value={newAddress.postalCode || ''}
              onChangeText={(value) => setNewAddress({...newAddress, postalCode: value})}
            />
            <Input
              label="Phone"
              value={newAddress.phone || ''}
              onChangeText={(value) => setNewAddress({...newAddress, phone: value})}
              error={errors.phone}
              keyboardType="phone-pad"
              required
            />
            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowAddForm(false);
                  setNewAddress({});
                  setErrors({});
                }}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Add Address"
                onPress={handleAddAddress}
                style={styles.addAddressButton}
                loading={actionLoading === 'add'}
              />
            </View>
          </Card>
        )}

        {addresses && addresses.length > 0 ? addresses.map((address) => (
          <Card key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressName}>{address.label}</Text>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressText}>{address.address}</Text>
            <Text style={styles.addressText}>{address.city} {address.postalCode}</Text>
            <Text style={styles.addressText}>{address.phone}</Text>
            
            <View style={styles.addressActions}>
              {!address.isDefault && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    actionLoading === address.id && styles.disabledButton
                  ]}
                  onPress={() => handleSetDefault(address.id)}
                  disabled={actionLoading === address.id}
                >
                  <Text style={styles.setDefaultText}>
                    {actionLoading === address.id ? 'Setting...' : 'Set as Default'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  actionLoading === address.id && styles.disabledButton
                ]}
                onPress={() => handleDeleteAddress(address.id)}
                disabled={actionLoading === address.id}
              >
                <Text style={styles.deleteText}>
                  {actionLoading === address.id ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No addresses found</Text>
            <Text style={styles.emptySubtext}>Tap the + Add button to add your first address</Text>
          </Card>
        )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  addButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.lg,
  },
  addButtonText: {
    color: theme.colors.background.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  addForm: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  addAddressButton: {
    flex: 1,
    marginLeft: 8,
  },
  addressCard: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  defaultText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background.primary,
  },
  addressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  actionButton: {
    marginRight: theme.spacing.lg,
  },
  setDefaultText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default AddressEditScreen;