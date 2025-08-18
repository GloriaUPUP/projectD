import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrder } from '../../contexts/OrderContext';
import { Card } from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

interface MyParcelsScreenProps {
  navigation: any;
}

const MyParcelsScreen: React.FC<MyParcelsScreenProps> = ({ navigation }) => {
  const { orders } = useOrder();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'confirmed': return '#007AFF';
      case 'picked_up': return '#5856D6';
      case 'in_transit': return '#30B0C7';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Order</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.colors.text.tertiary} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Enter track number"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="scan-outline" size={20} color={theme.colors.background.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
            <Text style={styles.filterTabTextActive}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>On Process</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Delivered</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.resultsCount}>{orders.length} Results</Text>
        
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Start by creating your first delivery order</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => navigation.navigate('Tracking', { orderId: order.id })}
            >
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIconContainer}>
                    <Ionicons name="cube" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderStatus}>
                      {order.status === 'delivered' ? 'Delivered' : 
                       order.status === 'pending' ? 'Returned to sender' :
                       order.status === 'in_transit' ? 'On Process' : 
                       'Waiting to picked up'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: order.status === 'delivered' ? theme.colors.primary : 
                                   order.status === 'pending' ? '#FF9800' : 
                                   order.status === 'in_transit' ? '#2196F3' : 
                                   theme.colors.text.secondary
                  }]}>
                    <Text style={styles.statusText}>
                      {order.status === 'delivered' ? 'Delivered' : 
                       order.status === 'pending' ? 'Pending' :
                       order.status === 'in_transit' ? 'On Process' : 
                       'Delivered'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.background.primary,
    fontSize: theme.typography.fontSize.base,
  },
  searchButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  filterTabActive: {
    backgroundColor: theme.colors.text.primary,
  },
  filterTabText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterTabTextActive: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  resultsCount: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  orderCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background.primary,
  },
});

export default MyParcelsScreen;