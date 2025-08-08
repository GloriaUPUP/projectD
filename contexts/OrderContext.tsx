import React, { createContext, useContext, useState } from 'react';

export interface Address {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
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
    if (currentOrder.sender && currentOrder.recipient && currentOrder.parcel && currentOrder.deliveryOption) {
      const newOrder: Order = {
        id: Date.now().toString(),
        sender: currentOrder.sender,
        recipient: currentOrder.recipient,
        parcel: currentOrder.parcel,
        deliveryOption: currentOrder.deliveryOption,
        status: 'confirmed',
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder({});
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