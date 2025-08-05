import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Card, PricingBreakdown } from '../../components';
import { PricingEngine } from '../../services/pricingEngine';
import type { DeliveryOption } from '../../contexts/OrderContext';

interface OrderStep2ScreenProps {
  navigation: any;
}

const OrderStep2Screen: React.FC<OrderStep2ScreenProps> = ({ navigation }) => {
  const { currentOrder, updateOrderStep } = useOrder();
  const { t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<any[]>([]);
  const [distance, setDistance] = useState(12.5); // Mock distance in km

  useEffect(() => {
    if (currentOrder.sender && currentOrder.recipient && currentOrder.parcel) {
      // Calculate distance between sender and recipient (mock calculation)
      const mockDistance = Math.random() * 20 + 5; // 5-25 km
      setDistance(mockDistance);

      // Generate delivery options with dynamic pricing
      const pricingFactors = {
        distance: mockDistance,
        weight: currentOrder.parcel.weight || 1,
        packageValue: currentOrder.parcel.value || 100,
        deliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        orderCount: 1, // Could be fetched from user's order history
      };

      const options = PricingEngine.getAllDeliveryOptions(pricingFactors);
      setDeliveryOptions(options);
    }
  }, [currentOrder]);

  const deliveryOptionsLegacy: DeliveryOption[] = deliveryOptions.map(option => ({
    id: option.id,
    type: option.type,
    name: option.name,
    estimatedTime: option.pricing.estimatedTime,
    price: option.pricing.price,
    description: option.description,
    available: option.pricing.available,
    breakdown: option.pricing.breakdown, // Add breakdown for detailed pricing
  }));

  const handleOptionSelect = (option: DeliveryOption) => {
    if (option.available) {
      setSelectedOption(option);
    }
  };

  const handleContinue = () => {
    if (selectedOption) {
      updateOrderStep({ deliveryOption: selectedOption });
      navigation.navigate('Recommendation');
    }
  };

  const getOptionIcon = (type: 'robot' | 'drone') => {
    return type === 'robot' ? '🤖' : '🚁';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('order.step2Title')}</Text>
        <Text style={styles.subtitle}>Choose your preferred delivery method</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.routeInfo}>
          <Card>
            <Text style={styles.routeTitle}>Delivery Route</Text>
            <Text style={styles.routeText}>
              From: {currentOrder.sender?.city}
            </Text>
            <Text style={styles.routeText}>
              To: {currentOrder.recipient?.city}
            </Text>
            <Text style={styles.routeText}>
              Package: {currentOrder.parcel?.weight}kg, ${currentOrder.parcel?.value}
            </Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Available Delivery Options</Text>

        {deliveryOptionsLegacy.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedOption?.id === option.id && styles.selectedOption,
              !option.available && styles.disabledOption,
            ]}
            onPress={() => handleOptionSelect(option)}
            disabled={!option.available}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>{getOptionIcon(option.type)}</Text>
                <View>
                  <Text style={[styles.optionName, !option.available && styles.disabledText]}>
                    {option.name}
                  </Text>
                  <Text style={[styles.optionTime, !option.available && styles.disabledText]}>
                    {option.estimatedTime}
                  </Text>
                </View>
              </View>
              <Text style={[styles.optionPrice, !option.available && styles.disabledText]}>
                ${option.price}
              </Text>
            </View>
            <Text style={[styles.optionDescription, !option.available && styles.disabledText]}>
              {option.description}
            </Text>
            {!option.available && (
              <Text style={styles.unavailableText}>
                Not available for this package
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {selectedOption && selectedOption.breakdown && (
          <PricingBreakdown
            breakdown={selectedOption.breakdown}
            distance={distance}
            weight={currentOrder.parcel?.weight}
            estimatedTime={selectedOption.estimatedTime}
            expanded={false}
          />
        )}

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Delivery Information</Text>
          <Text style={styles.infoText}>
            • All deliveries are tracked in real-time
          </Text>
          <Text style={styles.infoText}>
            • Secure handling with photo confirmation
          </Text>
          <Text style={styles.infoText}>
            • Insurance coverage up to package value
          </Text>
          <Text style={styles.infoText}>
            • SMS and push notifications included
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
          title={t('common.continue')}
          onPress={handleContinue}
          disabled={!selectedOption}
          style={styles.continueButton}
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
  routeInfo: {
    marginVertical: 16,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  optionTime: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  disabledText: {
    color: '#999999',
  },
  unavailableText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoCard: {
    marginVertical: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
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
  continueButton: {
    flex: 2,
    marginLeft: 8,
  },
});

export default OrderStep2Screen;