import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { Card } from '../../components';

interface TrackingScreenProps {
  route: any;
  navigation: any;
}

const TrackingScreen: React.FC<TrackingScreenProps> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { getOrderById } = useOrder();
  const [order, setOrder] = useState(getOrderById(orderId));

  const trackingSteps = [
    { id: 1, title: 'Order Confirmed', status: 'completed', time: '10:30 AM' },
    { id: 2, title: 'Package Picked Up', status: 'completed', time: '11:15 AM' },
    { id: 3, title: 'In Transit', status: 'current', time: '12:00 PM' },
    { id: 4, title: 'Out for Delivery', status: 'pending', time: 'Estimated 2:30 PM' },
    { id: 5, title: 'Delivered', status: 'pending', time: 'Estimated 3:00 PM' },
  ];

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Order</Text>
        <Text style={styles.subtitle}>Order #{order.id}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.orderInfo}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{order.sender.name}, {order.sender.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>{order.recipient.name}, {order.recipient.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service:</Text>
            <Text style={styles.infoValue}>{order.deliveryOption.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Est. Delivery:</Text>
            <Text style={styles.infoValue}>{order.estimatedDelivery.toLocaleDateString()}</Text>
          </View>
        </Card>

        <Card style={styles.trackingInfo}>
          <Text style={styles.sectionTitle}>Tracking Progress</Text>
          {trackingSteps.map((step, index) => (
            <View key={step.id} style={styles.trackingStep}>
              <View style={styles.stepIndicator}>
                <View style={[
                  styles.stepDot,
                  step.status === 'completed' && styles.completedDot,
                  step.status === 'current' && styles.currentDot,
                ]} />
                {index < trackingSteps.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    step.status === 'completed' && styles.completedLine,
                  ]} />
                )}
              </View>
              <View style={styles.stepContent}>
                <Text style={[
                  styles.stepTitle,
                  step.status === 'current' && styles.currentStepTitle,
                ]}>
                  {step.title}
                </Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={styles.additionalInfo}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <Text style={styles.infoText}>
            Your package is being delivered via {order.deliveryOption.type === 'robot' ? 'ground robot' : 'drone'}.
            You will receive real-time updates and notifications throughout the delivery process.
          </Text>
          <Text style={styles.infoText}>
            For any questions or concerns, please contact our support team.
          </Text>
        </Card>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666666',
  },
  orderInfo: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  trackingInfo: {
    marginBottom: 16,
  },
  trackingStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  completedDot: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  currentDot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E5EA',
    marginTop: 4,
  },
  completedLine: {
    backgroundColor: '#34C759',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  currentStepTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  stepTime: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  additionalInfo: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
});

export default TrackingScreen;