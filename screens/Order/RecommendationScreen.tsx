import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Card } from '../../components';

interface RecommendationScreenProps {
  navigation: any;
}

const RecommendationScreen: React.FC<RecommendationScreenProps> = ({ navigation }) => {
  const { currentOrder, updateOrderStep } = useOrder();
  const { t } = useLanguage();

  const recommendations = [
    {
      id: 'recommended',
      title: '⭐ Recommended',
      option: currentOrder.deliveryOption,
      reason: 'Best balance of speed and cost for your package',
      savings: null,
    },
    {
      id: 'fastest',
      title: '⚡ Fastest',
      option: {
        ...currentOrder.deliveryOption,
        name: 'Drone - Express',
        estimatedTime: '30-60 minutes',
        price: (currentOrder.deliveryOption?.price || 0) + 15,
      },
      reason: 'Get your package delivered in record time',
      savings: null,
    },
    {
      id: 'cheapest',
      title: '💰 Most Economical',
      option: {
        ...currentOrder.deliveryOption,
        name: 'Ground Robot - Standard',
        estimatedTime: '4-6 hours',
        price: (currentOrder.deliveryOption?.price || 0) - 10,
      },
      reason: 'Save money with our standard delivery',
      savings: 10,
    },
  ];

  const handleSelectRecommendation = (recommendation: any) => {
    updateOrderStep({ deliveryOption: recommendation.option });
    navigation.navigate('Payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('order.recommendations')}</Text>
        <Text style={styles.subtitle}>Choose the best option for your delivery</Text>
      </View>

      <ScrollView style={styles.content}>
        {recommendations.map((recommendation) => (
          <TouchableOpacity
            key={recommendation.id}
            style={styles.recommendationCard}
            onPress={() => handleSelectRecommendation(recommendation)}
          >
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{recommendation.title}</Text>
                {recommendation.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save ${recommendation.savings}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.optionDetails}>
                <Text style={styles.optionName}>{recommendation.option?.name}</Text>
                <Text style={styles.optionTime}>{recommendation.option?.estimatedTime}</Text>
                <Text style={styles.optionPrice}>${recommendation.option?.price}</Text>
              </View>
              
              <Text style={styles.reason}>{recommendation.reason}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
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
    paddingTop: 16,
  },
  recommendationCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  savingsBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionDetails: {
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  optionTime: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 2,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  reason: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  backButton: {
    width: '100%',
  },
});

export default RecommendationScreen;