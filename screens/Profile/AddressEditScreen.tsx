import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card, LoadingSpinner } from '../../components';
import { apiService } from '../../services/api';

interface Address {
  id: string;
  name: string;
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
      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!newAddress.name) newErrors.name = 'Address name is required';
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
        name: newAddress.name || '',
        address: newAddress.address || '',
        city: newAddress.city || '',
        postalCode: newAddress.postalCode || '',
        phone: newAddress.phone || '',
      };
      
      const response = await apiService.addAddress(addressData);
      if (response.success && response.data) {
        setAddresses([...addresses, response.data]);
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
              value={newAddress.name || ''}
              onChangeText={(value) => setNewAddress({...newAddress, name: value})}
              error={errors.name}
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

        {addresses.map((address) => (
          <Card key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressName}>{address.name}</Text>
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
        ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addForm: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    marginRight: 16,
  },
  setDefaultText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AddressEditScreen;