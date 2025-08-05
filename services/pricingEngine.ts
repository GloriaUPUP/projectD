interface PricingFactors {
  distance: number; // in kilometers
  weight: number; // in kg
  packageValue: number; // in dollars
  deliveryTime: Date;
  deliveryType: 'robot' | 'drone';
  serviceLevel: 'standard' | 'express';
  orderCount?: number; // for bulk discounts
  demandMultiplier?: number; // real-time demand
}

interface PricingBreakdown {
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
}

interface DeliveryPricing {
  price: number;
  breakdown: PricingBreakdown;
  estimatedTime: string;
  available: boolean;
}

export class PricingEngine {
  private static readonly BASE_RATES = {
    robot: {
      standard: { base: 8.99, perKm: 1.20, perKg: 0.50 },
      express: { base: 14.99, perKm: 1.80, perKg: 0.75 }
    },
    drone: {
      standard: { base: 18.99, perKm: 2.40, perKg: 1.20 },
      express: { base: 28.99, perKm: 3.60, perKg: 1.80 }
    }
  };

  private static readonly WEIGHT_LIMITS = {
    robot: { standard: 25, express: 20 },
    drone: { standard: 10, express: 5 }
  };

  private static readonly TIME_MULTIPLIERS = {
    // Rush hours: 7-9 AM, 12-1 PM, 5-7 PM
    rushHour: 1.35,
    peakHour: 1.20, // 9-12 PM, 1-5 PM
    offPeak: 1.00, // 7 PM - 7 AM
    lateNight: 0.90, // 10 PM - 6 AM
    weekend: 1.10
  };

  private static readonly BULK_DISCOUNTS = [
    { minOrders: 1, discount: 0 },
    { minOrders: 3, discount: 0.05 }, // 5% off
    { minOrders: 5, discount: 0.10 }, // 10% off
    { minOrders: 10, discount: 0.15 }, // 15% off
    { minOrders: 20, discount: 0.20 }, // 20% off
  ];

  private static readonly SERVICE_FEE = 2.50;
  private static readonly MIN_INSURANCE_FEE = 1.00;
  private static readonly INSURANCE_RATE = 0.015; // 1.5% of package value

  // Calculate distance between two coordinates (simplified Haversine formula)
  static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get time-based multiplier
  static getTimeMultiplier(deliveryTime: Date): number {
    const hour = deliveryTime.getHours();
    const day = deliveryTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Weekend multiplier
    if (day === 0 || day === 6) {
      return this.TIME_MULTIPLIERS.weekend;
    }
    
    // Weekday time-based multipliers
    if ((hour >= 7 && hour < 9) || (hour >= 12 && hour < 13) || (hour >= 17 && hour < 19)) {
      return this.TIME_MULTIPLIERS.rushHour;
    } else if ((hour >= 9 && hour < 12) || (hour >= 13 && hour < 17)) {
      return this.TIME_MULTIPLIERS.peakHour;
    } else if (hour >= 22 || hour < 6) {
      return this.TIME_MULTIPLIERS.lateNight;
    } else {
      return this.TIME_MULTIPLIERS.offPeak;
    }
  }

  // Calculate bulk discount
  static getBulkDiscount(orderCount: number): number {
    const applicableDiscount = this.BULK_DISCOUNTS
      .filter(tier => orderCount >= tier.minOrders)
      .pop();
    return applicableDiscount?.discount || 0;
  }

  // Generate real-time demand multiplier (simulated)
  static getDemandMultiplier(
    deliveryTime: Date,
    location: { lat: number; lon: number },
    deliveryType: 'robot' | 'drone'
  ): number {
    // Simulate demand based on time and location
    const hour = deliveryTime.getHours();
    const isBusinessDistrict = Math.abs(location.lat - 40.7589) < 0.01; // Near NYC business area
    const baseMultiplier = 1.0;
    
    let demandFactor = 0;
    
    // Time-based demand
    if (hour >= 12 && hour < 14) demandFactor += 0.15; // Lunch time
    if (hour >= 17 && hour < 19) demandFactor += 0.20; // Dinner time
    
    // Location-based demand
    if (isBusinessDistrict) demandFactor += 0.10;
    
    // Delivery type demand
    if (deliveryType === 'drone') demandFactor += 0.05; // Higher demand for drones
    
    // Random market fluctuation (-5% to +15%)
    const marketFactor = (Math.random() * 0.20) - 0.05;
    demandFactor += marketFactor;
    
    return Math.max(0.8, Math.min(1.5, baseMultiplier + demandFactor));
  }

  // Calculate estimated delivery time
  static getEstimatedTime(
    distance: number,
    deliveryType: 'robot' | 'drone',
    serviceLevel: 'standard' | 'express'
  ): string {
    const speeds = {
      robot: { standard: 15, express: 25 }, // km/h
      drone: { standard: 45, express: 65 }   // km/h
    };
    
    const speed = speeds[deliveryType][serviceLevel];
    const baseTimeHours = distance / speed;
    
    // Add processing and handling time
    const processingTime = serviceLevel === 'express' ? 0.25 : 0.5; // 15-30 min
    const totalHours = baseTimeHours + processingTime;
    
    if (totalHours < 1) {
      return `${Math.round(totalHours * 60)} minutes`;
    } else if (totalHours < 2) {
      const minutes = Math.round((totalHours % 1) * 60);
      return minutes > 0 ? `1h ${minutes}m` : '1 hour';
    } else {
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours % 1) * 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  // Main pricing calculation method
  static calculatePricing(factors: PricingFactors): DeliveryPricing {
    const { distance, weight, packageValue, deliveryTime, deliveryType, serviceLevel, orderCount = 1, demandMultiplier } = factors;
    
    // Check availability based on weight limits
    const weightLimit = this.WEIGHT_LIMITS[deliveryType][serviceLevel];
    const available = weight <= weightLimit;
    
    if (!available) {
      return {
        price: 0,
        breakdown: {} as PricingBreakdown,
        estimatedTime: 'Not available',
        available: false
      };
    }
    
    const rates = this.BASE_RATES[deliveryType][serviceLevel];
    
    // Calculate base fees
    const baseFee = rates.base;
    const distanceFee = distance * rates.perKm;
    const weightFee = weight * rates.perKg;
    
    // Time-based premium
    const timeMultiplier = this.getTimeMultiplier(deliveryTime);
    const basePrice = baseFee + distanceFee + weightFee;
    const timePremium = basePrice * (timeMultiplier - 1);
    
    // Insurance fee
    const insuranceFee = Math.max(
      this.MIN_INSURANCE_FEE,
      packageValue * this.INSURANCE_RATE
    );
    
    // Service fee
    const serviceFee = this.SERVICE_FEE;
    
    // Calculate total before discounts and adjustments
    const totalBeforeDiscounts = baseFee + distanceFee + weightFee + timePremium + insuranceFee + serviceFee;
    
    // Bulk discount
    const bulkDiscountRate = this.getBulkDiscount(orderCount);
    const bulkDiscount = totalBeforeDiscounts * bulkDiscountRate;
    
    // Real-time demand adjustment
    const finalDemandMultiplier = demandMultiplier || this.getDemandMultiplier(
      deliveryTime,
      { lat: 40.7589, lon: -73.9851 }, // Default NYC coordinates
      deliveryType
    );
    
    const afterDiscounts = totalBeforeDiscounts - bulkDiscount;
    const demandAdjustment = afterDiscounts * (finalDemandMultiplier - 1);
    
    const finalPrice = Math.max(5.00, afterDiscounts + demandAdjustment); // Minimum $5 delivery
    
    const breakdown: PricingBreakdown = {
      baseFee: Math.round(baseFee * 100) / 100,
      distanceFee: Math.round(distanceFee * 100) / 100,
      weightFee: Math.round(weightFee * 100) / 100,
      timePremium: Math.round(timePremium * 100) / 100,
      insuranceFee: Math.round(insuranceFee * 100) / 100,
      serviceFee: Math.round(serviceFee * 100) / 100,
      bulkDiscount: Math.round(bulkDiscount * 100) / 100,
      demandAdjustment: Math.round(demandAdjustment * 100) / 100,
      totalBeforeDiscounts: Math.round(totalBeforeDiscounts * 100) / 100,
      totalDiscounts: Math.round(bulkDiscount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
    
    const estimatedTime = this.getEstimatedTime(distance, deliveryType, serviceLevel);
    
    return {
      price: breakdown.finalPrice,
      breakdown,
      estimatedTime,
      available
    };
  }

  // Get all delivery options with pricing
  static getAllDeliveryOptions(factors: Omit<PricingFactors, 'deliveryType' | 'serviceLevel'>): Array<{
    id: string;
    type: 'robot' | 'drone';
    serviceLevel: 'standard' | 'express';
    name: string;
    description: string;
    pricing: DeliveryPricing;
  }> {
    const options = [
      {
        id: '1',
        type: 'robot' as const,
        serviceLevel: 'standard' as const,
        name: 'Ground Robot - Standard',
        description: 'Reliable ground delivery robot for secure transport'
      },
      {
        id: '2',
        type: 'robot' as const,
        serviceLevel: 'express' as const,
        name: 'Ground Robot - Express',
        description: 'Priority ground delivery with faster service'
      },
      {
        id: '3',
        type: 'drone' as const,
        serviceLevel: 'standard' as const,
        name: 'Drone - Standard',
        description: 'Aerial delivery for urgent packages'
      },
      {
        id: '4',
        type: 'drone' as const,
        serviceLevel: 'express' as const,
        name: 'Drone - Express',
        description: 'Ultra-fast aerial delivery service'
      }
    ];

    return options.map(option => ({
      ...option,
      pricing: this.calculatePricing({
        ...factors,
        deliveryType: option.type,
        serviceLevel: option.serviceLevel
      })
    }));
  }
}

export default PricingEngine;