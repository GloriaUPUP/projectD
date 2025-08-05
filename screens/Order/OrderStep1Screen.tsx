import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Input, Card } from '../../components';
import type { Address, ParcelInfo } from '../../contexts/OrderContext';

interface OrderStep1ScreenProps {
  navigation: any;
}

const OrderStep1Screen: React.FC<OrderStep1ScreenProps> = ({ navigation }) => {
  const { currentOrder, updateOrderStep } = useOrder();
  const { t } = useLanguage();
  
  const [sender, setSender] = useState<Partial<Address>>(currentOrder.sender || {});
  const [recipient, setRecipient] = useState<Partial<Address>>(currentOrder.recipient || {});
  const [parcel, setParcel] = useState<Partial<ParcelInfo>>(currentOrder.parcel || {
    dimensions: { length: 0, width: 0, height: 0 }
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate sender
    if (!sender.name) newErrors.senderName = 'Sender name is required';
    if (!sender.address) newErrors.senderAddress = 'Sender address is required';
    if (!sender.city) newErrors.senderCity = 'Sender city is required';
    if (!sender.phone) newErrors.senderPhone = 'Sender phone is required';
    
    // Validate recipient
    if (!recipient.name) newErrors.recipientName = 'Recipient name is required';
    if (!recipient.address) newErrors.recipientAddress = 'Recipient address is required';
    if (!recipient.city) newErrors.recipientCity = 'Recipient city is required';
    if (!recipient.phone) newErrors.recipientPhone = 'Recipient phone is required';
    
    // Validate parcel
    if (!parcel.weight || parcel.weight <= 0) newErrors.weight = 'Weight is required';
    if (!parcel.description) newErrors.description = 'Description is required';
    if (!parcel.value || parcel.value <= 0) newErrors.value = 'Value is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    const completeParcel: ParcelInfo = {
      weight: parcel.weight || 0,
      dimensions: parcel.dimensions || { length: 0, width: 0, height: 0 },
      value: parcel.value || 0,
      description: parcel.description || '',
      fragile: parcel.fragile || false,
    };

    const completeSender: Address = {
      id: sender.id || Date.now().toString(),
      name: sender.name || '',
      address: sender.address || '',
      city: sender.city || '',
      postalCode: sender.postalCode || '',
      phone: sender.phone || '',
    };

    const completeRecipient: Address = {
      id: recipient.id || Date.now().toString(),
      name: recipient.name || '',
      address: recipient.address || '',
      city: recipient.city || '',
      postalCode: recipient.postalCode || '',
      phone: recipient.phone || '',
    };

    updateOrderStep({
      sender: completeSender,
      recipient: completeRecipient,
      parcel: completeParcel,
    });

    navigation.navigate('OrderStep2');
  };

  const updateSender = (field: string) => (value: string) => {
    setSender(prev => ({ ...prev, [field]: value }));
  };

  const updateRecipient = (field: string) => (value: string) => {
    setRecipient(prev => ({ ...prev, [field]: value }));
  };

  const updateParcel = (field: string) => (value: string | boolean) => {
    if (field === 'dimensions') {
      // Handle dimensions separately if needed
      return;
    }
    setParcel(prev => ({ ...prev, [field]: field === 'weight' || field === 'value' ? parseFloat(value as string) || 0 : value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('order.step1Title')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.senderInfo')}</Text>
          <Input
            label="Name"
            value={sender.name || ''}
            onChangeText={updateSender('name')}
            error={errors.senderName}
            required
          />
          <Input
            label="Address"
            value={sender.address || ''}
            onChangeText={updateSender('address')}
            error={errors.senderAddress}
            required
          />
          <Input
            label="City"
            value={sender.city || ''}
            onChangeText={updateSender('city')}
            error={errors.senderCity}
            required
          />
          <Input
            label="Postal Code"
            value={sender.postalCode || ''}
            onChangeText={updateSender('postalCode')}
          />
          <Input
            label="Phone"
            value={sender.phone || ''}
            onChangeText={updateSender('phone')}
            error={errors.senderPhone}
            keyboardType="phone-pad"
            required
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.recipientInfo')}</Text>
          <Input
            label="Name"
            value={recipient.name || ''}
            onChangeText={updateRecipient('name')}
            error={errors.recipientName}
            required
          />
          <Input
            label="Address"
            value={recipient.address || ''}
            onChangeText={updateRecipient('address')}
            error={errors.recipientAddress}
            required
          />
          <Input
            label="City"
            value={recipient.city || ''}
            onChangeText={updateRecipient('city')}
            error={errors.recipientCity}
            required
          />
          <Input
            label="Postal Code"
            value={recipient.postalCode || ''}
            onChangeText={updateRecipient('postalCode')}
          />
          <Input
            label="Phone"
            value={recipient.phone || ''}
            onChangeText={updateRecipient('phone')}
            error={errors.recipientPhone}
            keyboardType="phone-pad"
            required
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.parcelInfo')}</Text>
          <Input
            label={t('order.weight')}
            value={parcel.weight?.toString() || ''}
            onChangeText={(value) => setParcel(prev => ({ ...prev, weight: parseFloat(value) || 0 }))}
            error={errors.weight}
            keyboardType="numeric"
            required
          />
          <Input
            label={t('order.value')}
            value={parcel.value?.toString() || ''}
            onChangeText={(value) => setParcel(prev => ({ ...prev, value: parseFloat(value) || 0 }))}
            error={errors.value}
            keyboardType="numeric"
            required
          />
          <Input
            label={t('order.description')}
            value={parcel.description || ''}
            onChangeText={(value) => setParcel(prev => ({ ...prev, description: value }))}
            error={errors.description}
            multiline
            numberOfLines={3}
            required
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default OrderStep1Screen;