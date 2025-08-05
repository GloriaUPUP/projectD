import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Card, PricingBreakdown } from '../../components';

interface OrderConfirmScreenProps {
  navigation: any;
}

const OrderConfirmScreen: React.FC<OrderConfirmScreenProps> = ({ navigation }) => {
  const { currentOrder, confirmOrder } = useOrder();
  const { t } = useLanguage();

  const handleConfirmOrder = async () => {
    try {
      await confirmOrder();
      Alert.alert(
        'Order Confirmed!',
        'Your delivery order has been confirmed. You will receive tracking updates shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm order. Please try again.');
    }
  };

  const totalCost = (currentOrder.deliveryOption?.price || 0) + 2.50; // Add service fee

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Your Order</Text>
        <Text style={styles.subtitle}>Review and confirm your delivery details</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>
              {currentOrder.sender?.name}, {currentOrder.sender?.city}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To:</Text>
            <Text style={styles.detailValue}>
              {currentOrder.recipient?.name}, {currentOrder.recipient?.city}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Package:</Text>
            <Text style={styles.detailValue}>
              {currentOrder.parcel?.weight}kg, ${currentOrder.parcel?.value}
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{currentOrder.deliveryOption?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Time:</Text>
            <Text style={styles.detailValue}>{currentOrder.deliveryOption?.estimatedTime}</Text>
          </View>
        </Card>

        {currentOrder.deliveryOption?.breakdown ? (
          <PricingBreakdown
            breakdown={currentOrder.deliveryOption.breakdown}
            estimatedTime={currentOrder.deliveryOption.estimatedTime}
            expanded={true}
          />
        ) : (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Fee:</Text>
              <Text style={styles.detailValue}>${currentOrder.deliveryOption?.price}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Fee:</Text>
              <Text style={styles.detailValue}>$2.50</Text>
            </View>
            <View style={[styles.detailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            • Package will be handled with care and tracked in real-time
          </Text>
          <Text style={styles.termsText}>
            • Insurance coverage up to declared package value
          </Text>
          <Text style={styles.termsText}>
            • Delivery confirmation required at destination
          </Text>
          <Text style={styles.termsText}>
            • Standard cancellation policy applies
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
          title={t('common.confirm')}
          onPress={handleConfirmOrder}
          style={styles.confirmButton}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
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
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 2,
    textAlign: 'right',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
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
  confirmButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default OrderConfirmScreen;