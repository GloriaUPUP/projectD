import React, { createContext, useContext, useState } from 'react';
import { apiService } from '../services/api';

export interface Address {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface ParcelInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  value: number;
  description: string;
  fragile: boolean;
}

export interface DeliveryOption {
  id: string;
  type: 'robot' | 'drone';
  name: string;
  estimatedTime: string;
  price: number;
  description: string;
  available: boolean;
  breakdown?: {
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
}

export interface Order {
  id: string;
  sender: Address;
  recipient: Address;
  parcel: ParcelInfo;
  deliveryOption: DeliveryOption;
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: Date;
  estimatedDelivery: Date;
}

interface OrderContextType {
  currentOrder: Partial<Order>;
  orders: Order[];
  updateOrderStep: (step: Partial<Order>) => void;
  confirmOrder: () => Promise<void>;
  clearCurrentOrder: () => void;
  getOrderById: (id: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({});
  const [orders, setOrders] = useState<Order[]>([]);

  const updateOrderStep = (step: Partial<Order>) => {
    setCurrentOrder(prev => ({ ...prev, ...step }));
  };

  const confirmOrder = async () => {
    console.log('confirmOrder called with currentOrder:', currentOrder);
    console.log('Checking conditions:');
    console.log('- sender exists:', !!currentOrder.sender, currentOrder.sender);
    console.log('- recipient exists:', !!currentOrder.recipient, currentOrder.recipient);  
    console.log('- parcel exists:', !!currentOrder.parcel, currentOrder.parcel);
    console.log('- deliveryOption exists:', !!currentOrder.deliveryOption, currentOrder.deliveryOption);
    
    if (currentOrder.sender && currentOrder.recipient && currentOrder.parcel && currentOrder.deliveryOption) {
      try {
        // Format order data for backend API (using camelCase field names)
        const orderData = {
          pickupInfo: {
            address: currentOrder.sender.address,
            contactName: currentOrder.sender.name,
            contactPhone: currentOrder.sender.phone,
            instructions: 'Ring doorbell'
          },
          deliveryInfo: {
            address: currentOrder.recipient.address,
            contactName: currentOrder.recipient.name,  
            contactPhone: currentOrder.recipient.phone,
            instructions: 'Leave at door'
          },
          packageInfo: {
            weight: Number(currentOrder.parcel.weight),
            type: 'package',
            value: Number(currentOrder.parcel.value),
            description: currentOrder.parcel.description || 'Package delivery'
          }
        };

        console.log('Sending order data to backend:', orderData);
        
        // Call backend API to create order
        const response = await apiService.createOrder(orderData);
        
        if (response.success) {
          // Create local order object for UI
          const newOrder: Order = {
            id: response.data?.orderId || Date.now().toString(),
            sender: currentOrder.sender,
            recipient: currentOrder.recipient,
            parcel: currentOrder.parcel,
            deliveryOption: currentOrder.deliveryOption,
            status: 'confirmed',
            createdAt: new Date(),
            estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
          };
          
          setOrders(prev => [newOrder, ...prev]);
          setCurrentOrder({});
        } else {
          throw new Error(response.message || 'Failed to create order');
        }
      } catch (error) {
        console.error('Order creation failed:', error);
        throw error;
      }
    } else {
      console.error('Order confirmation failed: Missing required order information');
      throw new Error('Missing required order information. Please complete all steps.');
    }
  };

  const clearCurrentOrder = () => {
    setCurrentOrder({});
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const value: OrderContextType = {
    currentOrder,
    orders,
    updateOrderStep,
    confirmOrder,
    clearCurrentOrder,
    getOrderById
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};