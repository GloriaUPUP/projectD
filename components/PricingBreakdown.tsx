import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from './Card';

interface PricingBreakdownProps {
  breakdown: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    timePremium: number;
    insuranceFee: number;
    serviceFee: number;
    bulkDiscount: number;
    demandAdjustment: number;
    totalBeforeDiscounts: number;
    totalDiscounts: number;
    finalPrice: number;
  };
  distance?: number;
  weight?: number;
  estimatedTime?: string;
  expanded?: boolean;
}

export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  breakdown,
  distance,
  weight,
  estimatedTime,
  expanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getPriceColor = (amount: number) => {
    if (amount > 0) return styles.positivePrice;
    if (amount < 0) return styles.negativePrice;
    return styles.neutralPrice;
  };

  const getDemandStatus = (adjustment: number) => {
    if (adjustment > 0.5) return { text: 'High Demand', color: '#FF3B30' };
    if (adjustment > 0) return { text: 'Moderate Demand', color: '#FF9500' };
    if (adjustment < -0.5) return { text: 'Low Demand', color: '#34C759' };
    return { text: 'Normal Demand', color: '#666666' };
  };

  const demandStatus = getDemandStatus(breakdown.demandAdjustment);

  return (
    <Card style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.title}>Pricing Breakdown</Text>
        <View style={styles.headerRight}>
          <Text style={styles.finalPrice}>{formatPrice(breakdown.finalPrice)}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.details}>
          {/* Base Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Pricing</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Service Base Fee</Text>
              <Text style={styles.price}>{formatPrice(breakdown.baseFee)}</Text>
            </View>
            
            {distance && (
              <View style={styles.row}>
                <Text style={styles.label}>Distance Fee ({distance.toFixed(1)} km)</Text>
                <Text style={styles.price}>{formatPrice(breakdown.distanceFee)}</Text>
              </View>
            )}
            
            {weight && (
              <View style={styles.row}>
                <Text style={styles.label}>Weight Fee ({weight} kg)</Text>
                <Text style={styles.price}>{formatPrice(breakdown.weightFee)}</Text>
              </View>
            )}
          </View>

          {/* Additional Fees */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Services</Text>
            
            {breakdown.timePremium > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Rush Hour Premium</Text>
                <Text style={[styles.price, styles.premiumPrice]}>
                  +{formatPrice(breakdown.timePremium)}
                </Text>
              </View>
            )}
            
            <View style={styles.row}>
              <Text style={styles.label}>Package Insurance</Text>
              <Text style={styles.price}>{formatPrice(breakdown.insuranceFee)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Service Fee</Text>
              <Text style={styles.price}>{formatPrice(breakdown.serviceFee)}</Text>
            </View>
          </View>

          {/* Market Factors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Factors</Text>
            
            {breakdown.bulkDiscount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Bulk Order Discount</Text>
                <Text style={[styles.price, styles.discountPrice]}>
                  -{formatPrice(breakdown.bulkDiscount)}
                </Text>
              </View>
            )}
            
            <View style={styles.row}>
              <Text style={styles.label}>
                Real-time Demand 
                <Text style={[styles.demandStatus, { color: demandStatus.color }]}>
                  {' '}({demandStatus.text})
                </Text>
              </Text>
              <Text style={[styles.price, getPriceColor(breakdown.demandAdjustment)]}>
                {breakdown.demandAdjustment >= 0 ? '+' : ''}{formatPrice(breakdown.demandAdjustment)}
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.separator} />
          
          <View style={styles.row}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalPrice}>
              {formatPrice(breakdown.totalBeforeDiscounts)}
            </Text>
          </View>
          
          {breakdown.totalDiscounts > 0 && (
            <View style={styles.row}>
              <Text style={styles.discountLabel}>Total Discounts</Text>
              <Text style={[styles.price, styles.discountPrice]}>
                -{formatPrice(breakdown.totalDiscounts)}
              </Text>
            </View>
          )}
          
          <View style={styles.separator} />
          
          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>Total Price</Text>
            <Text style={styles.finalPriceDetailed}>
              {formatPrice(breakdown.finalPrice)}
            </Text>
          </View>

          {estimatedTime && (
            <View style={styles.estimateRow}>
              <Text style={styles.estimateLabel}>Estimated Delivery Time</Text>
              <Text style={styles.estimateTime}>{estimatedTime}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666666',
  },
  details: {
    marginTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  price: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  premiumPrice: {
    color: '#FF9500',
  },
  discountPrice: {
    color: '#34C759',
  },
  positivePrice: {
    color: '#FF3B30',
  },
  negativePrice: {
    color: '#34C759',
  },
  neutralPrice: {
    color: '#000000',
  },
  demandStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  subtotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  subtotalPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  discountLabel: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  finalPriceDetailed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  estimateLabel: {
    fontSize: 14,
    color: '#666666',
  },
  estimateTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});