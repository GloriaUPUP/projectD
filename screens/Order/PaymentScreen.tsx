import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Input, Card } from '../../components';

interface PaymentScreenProps {
  navigation: any;
}

interface CreditCard {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  isDefault: boolean;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation }) => {
  const { currentOrder, updateOrderStep } = useOrder();
  const { t } = useLanguage();
  
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [showAddCard, setShowAddCard] = useState(false);

  // Mock saved cards
  const savedCards: CreditCard[] = [
    { id: '1', type: 'visa', lastFour: '4242', isDefault: true },
    { id: '2', type: 'mastercard', lastFour: '8888', isDefault: false },
  ];

  const getCardIcon = (type: 'visa' | 'mastercard' | 'amex') => {
    switch (type) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  const handlePayment = async () => {
    if (!selectedPayment && !showAddCard) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateOrderStep({ 
        paymentMethod: selectedPayment || 'new-card',
        paymentStatus: 'completed' 
      });
      
      Alert.alert(
        'Payment Successful!',
        'Your payment has been processed successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderConfirm'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
    }
  };

  const totalAmount = (currentOrder.deliveryOption?.price || 0) + 2.50;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Choose your payment method</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>${currentOrder.deliveryOption?.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>$2.50</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          {savedCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.paymentOption,
                selectedPayment === card.id && styles.selectedPayment,
              ]}
              onPress={() => setSelectedPayment(card.id)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardIcon}>{getCardIcon(card.type)}</Text>
                <View>
                  <Text style={styles.cardType}>
                    {card.type.toUpperCase()} •••• {card.lastFour}
                  </Text>
                  {card.isDefault && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedPayment === card.id && styles.selectedRadio,
              ]} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              showAddCard && styles.selectedPayment,
            ]}
            onPress={() => {
              setShowAddCard(!showAddCard);
              setSelectedPayment('');
            }}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.cardIcon}>➕</Text>
              <Text style={styles.cardType}>Add New Card</Text>
            </View>
            <View style={[
              styles.radioButton,
              showAddCard && styles.selectedRadio,
            ]} />
          </TouchableOpacity>
        </Card>

        {showAddCard && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Card</Text>
            <Input
              label="Card Number"
              value={newCard.number}
              onChangeText={(value) => setNewCard(prev => ({ ...prev, number: value }))}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
            />
            <View style={styles.cardRow}>
              <Input
                label="Expiry Date"
                value={newCard.expiry}
                onChangeText={(value) => setNewCard(prev => ({ ...prev, expiry: value }))}
                placeholder="MM/YY"
                style={styles.halfInput}
              />
              <Input
                label="CVV"
                value={newCard.cvv}
                onChangeText={(value) => setNewCard(prev => ({ ...prev, cvv: value }))}
                placeholder="123"
                keyboardType="numeric"
                style={styles.halfInput}
              />
            </View>
            <Input
              label="Cardholder Name"
              value={newCard.name}
              onChangeText={(value) => setNewCard(prev => ({ ...prev, name: value }))}
              placeholder="John Doe"
            />
          </Card>
        )}

        <Card style={styles.securityInfo}>
          <Text style={styles.sectionTitle}>🔒 Secure Payment</Text>
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We never store your card details.
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title={`Pay $${totalAmount.toFixed(2)}`}
          onPress={handlePayment}
          style={styles.payButton}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 10,
  },
  orderSummary: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedPayment: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  selectedRadio: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  securityInfo: {
    backgroundColor: '#F8F9FA',
    borderColor: '#34C759',
  },
  securityText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  payButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default PaymentScreen;