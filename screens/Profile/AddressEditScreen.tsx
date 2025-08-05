import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../components';

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
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      name: 'Home',
      address: '123 Main Street',
      city: 'New York',
      postalCode: '10001',
      phone: '+1234567890',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Office',
      address: '456 Business Ave',
      city: 'New York',
      postalCode: '10002',
      phone: '+1234567890',
      isDefault: false,
    },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAddress = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!newAddress.name) newErrors.name = 'Address name is required';
    if (!newAddress.address) newErrors.address = 'Address is required';
    if (!newAddress.city) newErrors.city = 'City is required';
    if (!newAddress.phone) newErrors.phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAddress = () => {
    if (!validateAddress()) return;
    
    const address: Address = {
      id: Date.now().toString(),
      name: newAddress.name || '',
      address: newAddress.address || '',
      city: newAddress.city || '',
      postalCode: newAddress.postalCode || '',
      phone: newAddress.phone || '',
      isDefault: addresses.length === 0,
    };
    
    setAddresses([...addresses, address]);
    setNewAddress({});
    setShowAddForm(false);
    setErrors({});
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
          onPress: () => setAddresses(addresses.filter(addr => addr.id !== id)),
        },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
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
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(address.id)}
                >
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteAddress(address.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
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
});

export default AddressEditScreen;