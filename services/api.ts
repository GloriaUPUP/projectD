const API_BASE_URL = 'http://192.168.1.88:8086/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

interface OrderInfo {
  orderId: string;
  status: string;
  createdAt: string;
  pickup: {
    address: string;
    contactName: string;
    contactPhone: string;
    instructions?: string;
  };
  delivery: {
    address: string;
    contactName: string;
    contactPhone: string;
    instructions?: string;
  };
  package: {
    weight: number;
    type: string;
    value: number;
    description?: string;
  };
  cost?: number;
  deliveryMethod?: string;
}

interface DeliveryOption {
  optionId: string;
  type: string;
  name: string;
  price: number;
  estimatedTime: string;
  description: string;
  availableCount: number;
  weatherDependent?: boolean;
}

interface PaymentMethod {
  methodId: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

// Mock data for MVP demo
const mockUsers = [
  { 
    id: '1', 
    email: 'demo@test.com', 
    password: '123456', 
    firstName: 'Demo',
    lastName: 'User',
    phone: '+1234567890',
    address: '123 Main St, San Francisco, CA'
  }
];

const mockOrders: OrderInfo[] = [
  {
    orderId: 'order_001',
    status: 'completed',
    createdAt: '2024-03-15T10:00:00Z',
    pickup: {
      address: '123 Pickup St, San Francisco, CA',
      contactName: 'John Sender',
      contactPhone: '+1234567890',
      instructions: 'Ring doorbell twice'
    },
    delivery: {
      address: '456 Delivery Ave, San Francisco, CA',
      contactName: 'Jane Receiver',
      contactPhone: '+0987654321',
      instructions: 'Leave at front desk'
    },
    package: {
      weight: 2.5,
      type: 'electronics',
      value: 150.00,
      description: 'iPhone case'
    },
    cost: 12.50,
    deliveryMethod: 'robot'
  }
];

const mockAddresses = [
  {
    id: '1',
    addressId: 'addr_001',
    label: 'Home',
    name: 'Home',
    address: '123 Main Street',
    city: 'New York',
    postalCode: '10001',
    phone: '+1234567890',
    isDefault: true,
  },
  {
    id: '2',
    addressId: 'addr_002', 
    label: 'Office',
    name: 'Office',
    address: '456 Business Ave',
    city: 'New York',
    postalCode: '10002',
    phone: '+1234567890',
    isDefault: false,
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    methodId: 'card_1234',
    type: 'credit_card',
    last4: '4242',
    brand: 'visa',
    isDefault: true
  }
];

const mockDeliveryOptions: DeliveryOption[] = [
  {
    optionId: 'robot_standard',
    type: 'robot',
    name: '机器人配送',
    price: 12.50,
    estimatedTime: 'calculating...', // 将由pricingEngine动态计算
    description: '地面机器人配送，适合大部分物件',
    availableCount: 3
  },
  {
    optionId: 'drone_express',
    type: 'drone', 
    name: '无人机配送',
    price: 18.00,
    estimatedTime: 'calculating...', // 将由pricingEngine动态计算
    description: '空中无人机配送，快速直达',
    availableCount: 2,
    weatherDependent: true
  }
];

class ApiService {
  private useMockData = false; // Disable mock data to use real backend

  private async mockDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (this.useMockData) {
      // Handle mock API calls
      return this.handleMockRequest<T>(endpoint, options);
    }

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  private async handleMockRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.mockDelay();

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    // Mock authentication
    if (endpoint === '/auth/login' && method === 'POST') {
      const user = mockUsers.find(u => u.email === body.email && u.password === body.password);
      if (user) {
        return {
          success: true,
          message: '登录成功',
          data: { 
            userId: user.id, 
            email: user.email, 
            firstName: user.firstName,
            lastName: user.lastName,
            token: 'mock-token' 
          } as any
        };
      }
      return { 
        success: false, 
        message: '用户名或密码错误',
        error: 'INVALID_CREDENTIALS' 
      };
    }

    if (endpoint === '/auth/register' && method === 'POST') {
      const existingUser = mockUsers.find(u => u.email === body.email);
      if (existingUser) {
        return { 
          success: false, 
          message: '邮箱已被注册',
          error: 'EMAIL_ALREADY_EXISTS' 
        };
      }
      const newUser = {
        id: Date.now().toString(),
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        address: body.address
      };
      mockUsers.push(newUser);
      return {
        success: true,
        message: '注册成功',
        data: { 
          userId: newUser.id, 
          email: newUser.email, 
          token: 'mock-token' 
        } as any
      };
    }

    // Mock orders - Create Order
    if (endpoint === '/orders' && method === 'POST') {
      const newOrder: OrderInfo = {
        orderId: `order_${Date.now()}`,
        status: 'pending_options',
        createdAt: new Date().toISOString(),
        pickup: body.pickupInfo,
        delivery: body.deliveryInfo,
        package: body.packageInfo
      };
      mockOrders.push(newOrder);
      return { 
        success: true, 
        message: '订单创建成功',
        data: {
          orderId: newOrder.orderId,
          status: newOrder.status,
          createdAt: newOrder.createdAt
        } as any 
      };
    }

    // Get Orders History
    if (endpoint.startsWith('/orders/history') && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const page = parseInt(params.get('page') || '1');
      const limit = parseInt(params.get('limit') || '10');
      const status = params.get('status');
      
      let filteredOrders = mockOrders;
      if (status) {
        filteredOrders = mockOrders.filter(o => o.status === status);
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      return { 
        success: true, 
        data: {
          orders: paginatedOrders.map(order => ({
            orderId: order.orderId,
            createdAt: order.createdAt,
            status: order.status,
            pickup: {
              address: order.pickup.address,
              time: order.createdAt
            },
            delivery: {
              address: order.delivery.address,
              time: order.createdAt
            },
            cost: order.cost || 0,
            deliveryMethod: order.deliveryMethod || 'pending'
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredOrders.length / limit),
            totalItems: filteredOrders.length,
            limit: limit
          }
        } as any 
      };
    }

    // Get Order Details
    if (endpoint.match(/\/orders\/order_\d+\/details/) && method === 'GET') {
      const orderId = endpoint.split('/')[2];
      const order = mockOrders.find(o => o.orderId === orderId);
      if (order) {
        return { 
          success: true, 
          data: {
            ...order,
            completedAt: order.status === 'completed' ? new Date().toISOString() : undefined,
            pickup: {
              ...order.pickup,
              actualTime: order.createdAt
            },
            delivery: {
              ...order.delivery,
              actualTime: order.createdAt
            },
            deviceUsed: order.deliveryMethod ? {
              deviceId: `${order.deliveryMethod}_r001`,
              name: `配送${order.deliveryMethod === 'robot' ? '机器人' : '无人机'}#1`
            } : undefined
          } as any 
        };
      }
      return { success: false, error: 'Order not found' };
    }

    // Get Delivery Options for Order
    if (endpoint.match(/\/orders\/order_\d+\/delivery-options/) && method === 'GET') {
      const orderId = endpoint.split('/')[2];
      const order = mockOrders.find(o => o.orderId === orderId);
      if (order) {
        return {
          success: true,
          data: {
            orderId: orderId,
            availableOptions: mockDeliveryOptions
          } as any
        };
      }
      return { success: false, error: 'Order not found' };
    }

    // Select Delivery Option
    if (endpoint.match(/\/orders\/order_\d+\/select-option/) && method === 'PUT') {
      const orderId = endpoint.split('/')[2];
      const order = mockOrders.find(o => o.orderId === orderId);
      const selectedOption = mockDeliveryOptions.find(opt => opt.optionId === body.selectedOptionId);
      
      if (order && selectedOption) {
        order.status = 'awaiting_payment';
        order.cost = selectedOption.price;
        order.deliveryMethod = selectedOption.type;
        
        return {
          success: true,
          message: '配送方案已选择',
          data: {
            orderId: orderId,
            selectedOption: body.selectedOptionId,
            totalCost: selectedOption.price,
            status: 'awaiting_payment'
          } as any
        };
      }
      return { success: false, error: 'Order or option not found' };
    }

    // Get Order Status/Tracking
    if (endpoint.match(/\/orders\/order_\d+\/status/) && method === 'GET') {
      const orderId = endpoint.split('/')[2];
      const order = mockOrders.find(o => o.orderId === orderId);
      if (order) {
        return {
          success: true,
          data: {
            orderId: orderId,
            currentStatus: order.status,
            statusHistory: [
              {
                status: 'created',
                timestamp: order.createdAt,
                description: '订单已创建'
              },
              {
                status: 'confirmed',
                timestamp: order.createdAt,
                description: '订单已确认，分配机器人'
              }
            ],
            currentLocation: order.status === 'in_transit' ? {
              lat: 37.7749,
              lng: -122.4194,
              address: 'Market St & 5th St'
            } : null,
            estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
            assignedDevice: order.deliveryMethod ? {
              deviceId: `${order.deliveryMethod}_r001`,
              type: order.deliveryMethod,
              name: `配送${order.deliveryMethod === 'robot' ? '机器人' : '无人机'}#1`
            } : null
          } as any
        };
      }
      return { success: false, error: 'Order not found' };
    }

    // Mock delivery options
    if (endpoint === '/delivery/options' && method === 'POST') {
      return {
        success: true,
        data: {
          options: [
            {
              id: 'drone-1',
              type: 'drone',
              name: 'Express Drone',
              price: 15.99,
              estimatedTime: '30-45 min',
              available: 3
            },
            {
              id: 'robot-1',
              type: 'robot',
              name: 'Ground Robot',
              price: 8.99,
              estimatedTime: '60-90 min',
              available: 5
            },
            {
              id: 'standard-1',
              type: 'standard',
              name: 'Standard Delivery',
              price: 5.99,
              estimatedTime: '2-3 hours',
              available: 10
            }
          ]
        } as any
      };
    }

    // Payment APIs
    if (endpoint === '/payments/methods' && method === 'GET') {
      return {
        success: true,
        data: {
          savedCards: mockPaymentMethods.filter(pm => pm.type === 'credit_card'),
          availableMethods: ['credit_card', 'paypal', 'apple_pay']
        } as any
      };
    }

    if (endpoint === '/payments/process' && method === 'POST') {
      // Simulate payment processing
      const orderId = body.orderId;
      const order = mockOrders.find(o => o.orderId === orderId);
      
      if (!order) {
        return {
          success: false,
          message: '订单未找到',
          error: 'ORDER_NOT_FOUND'
        };
      }

      // Simulate payment validation (mock card decline for testing)
      if (body.paymentInfo?.cardNumber === '4000000000000002') {
        return {
          success: false,
          message: '支付失败',
          error: 'CARD_DECLINED',
          details: {
            reason: 'insufficient_funds'
          }
        };
      }

      // Update order status on successful payment
      order.status = 'confirmed';
      
      return {
        success: true,
        message: '支付成功',
        data: {
          paymentId: `pay_${Date.now()}`,
          orderId: orderId,
          amount: body.amount,
          status: 'completed',
          transactionId: `txn_${Date.now()}`
        } as any
      };
    }

    // User Settings APIs
    if (endpoint === '/users/settings' && method === 'GET') {
      const currentUser = mockUsers[0]; // Simulate current logged in user
      return {
        success: true,
        data: {
          profile: {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone
          },
          addresses: mockAddresses.map(addr => ({
            addressId: addr.addressId,
            label: addr.label,
            address: `${addr.address}, ${addr.city}, ${addr.postalCode}`,
            isDefault: addr.isDefault
          })),
          preferences: {
            language: 'en',
            notifications: {
              email: true,
              sms: true,
              push: true
            },
            defaultDeliveryMethod: 'robot'
          }
        } as any
      };
    }

    if (endpoint === '/users/settings' && method === 'PUT') {
      const updatedFields: string[] = [];
      
      if (body.profile) {
        Object.keys(body.profile).forEach(key => {
          updatedFields.push(`profile.${key}`);
        });
      }
      
      if (body.preferences) {
        Object.keys(body.preferences).forEach(key => {
          updatedFields.push(`preferences.${key}`);
        });
      }
      
      return {
        success: true,
        message: '设置已更新',
        data: {
          updatedFields: updatedFields
        } as any
      };
    }

    // Mock addresses
    if (endpoint === '/addresses' && method === 'GET') {
      return { success: true, data: mockAddresses as any };
    }

    if (endpoint.startsWith('/addresses/') && method === 'GET') {
      const addressId = endpoint.split('/')[2];
      const address = mockAddresses.find(a => a.id === addressId);
      if (address) {
        return { success: true, data: address as any };
      }
      return { success: false, error: 'Address not found' };
    }

    if (endpoint === '/addresses' && method === 'POST') {
      const newAddress = {
        id: Date.now().toString(),
        ...body,
        isDefault: mockAddresses.length === 0
      };
      mockAddresses.push(newAddress);
      return { success: true, data: newAddress as any };
    }

    if (endpoint.startsWith('/addresses/') && method === 'PUT') {
      const addressId = endpoint.split('/')[2];
      const index = mockAddresses.findIndex(a => a.id === addressId);
      if (index !== -1) {
        mockAddresses[index] = { ...mockAddresses[index], ...body };
        return { success: true, data: mockAddresses[index] as any };
      }
      return { success: false, error: 'Address not found' };
    }

    if (endpoint.startsWith('/addresses/') && method === 'DELETE') {
      const addressId = endpoint.split('/')[2];
      const index = mockAddresses.findIndex(a => a.id === addressId);
      if (index !== -1) {
        mockAddresses.splice(index, 1);
        return { success: true, data: { message: 'Address deleted successfully' } as any };
      }
      return { success: false, error: 'Address not found' };
    }

    if (endpoint.includes('/default') && method === 'PATCH') {
      const addressId = endpoint.split('/')[2];
      const address = mockAddresses.find(a => a.id === addressId);
      if (address) {
        mockAddresses.forEach(a => a.isDefault = false);
        address.isDefault = true;
        return { success: true, data: address as any };
      }
      return { success: false, error: 'Address not found' };
    }

    if (endpoint === '/addresses/validate' && method === 'POST') {
      return {
        success: true,
        data: {
          isValid: true,
          suggestion: null,
          formatted: {
            address: body.address,
            city: body.city,
            postalCode: body.postalCode
          }
        } as any
      };
    }

    if (endpoint.startsWith('/addresses/search')) {
      const query = new URLSearchParams(endpoint.split('?')[1] || '').get('q') || '';
      const filtered = mockAddresses.filter(a => 
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.address.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase())
      );
      return { success: true, data: filtered as any };
    }

    if (endpoint.startsWith('/addresses/suggestions')) {
      const query = new URLSearchParams(endpoint.split('?')[1] || '').get('q') || '';
      const suggestions = [
        { address: '123 Main Street, New York, NY 10001', confidence: 0.95 },
        { address: '124 Main Street, New York, NY 10001', confidence: 0.87 },
        { address: '125 Main Street, New York, NY 10001', confidence: 0.78 }
      ].filter(s => s.address.toLowerCase().includes(query.toLowerCase()));
      return { success: true, data: { suggestions } as any };
    }

    // Default mock response
    return { success: true, data: {} as any };
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, firstName: string, lastName: string, phone: string, address: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        firstName, 
        lastName, 
        phone, 
        address 
      }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Order APIs
  async createOrder(orderData: {
    pickupInfo: any;
    deliveryInfo: any;
    packageInfo: any;
    preferences?: any;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrdersHistory(page: number = 1, limit: number = 10, status?: string) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return this.request(`/orders/history?${queryParams}`);
  }

  async getOrderDetails(orderId: string) {
    return this.request(`/orders/${orderId}/details`);
  }

  async getDeliveryOptionsForOrder(orderId: string) {
    return this.request(`/orders/${orderId}/delivery-options`);
  }

  async selectDeliveryOption(orderId: string, selectedOptionId: string) {
    return this.request(`/orders/${orderId}/select-option`, {
      method: 'PUT',
      body: JSON.stringify({ selectedOptionId }),
    });
  }

  async getOrderStatus(orderId: string) {
    return this.request(`/orders/${orderId}/status`);
  }

  // Legacy methods for backward compatibility
  async getOrders() {
    return this.getOrdersHistory();
  }

  async getOrderById(orderId: string) {
    return this.getOrderDetails(orderId);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Delivery APIs
  async getDeliveryOptions(orderData: any) {
    return this.request('/delivery/options', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // 随时随地都可以更新（好像是）
  async getRecommendations(orderData: any) {
    return this.request('/delivery/recommendations', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Tracking APIs
  async getTrackingInfo(orderId: string) {
    return this.request(`/tracking/${orderId}`);
  }

  // Support APIs
  async submitSupportRequest(requestData: any) {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getFAQ() {
    return this.request('/support/faq');
  }

  // Payment APIs
  async getPaymentMethods() {
    return this.request('/payment/methods');
  }

  async processPayment(paymentData: {
    orderId: string;
    paymentMethod: string;
    paymentInfo: any;
    amount: number;
  }) {
    return this.request('/payment/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // User Settings APIs
  async getUserSettings() {
    return this.request('/auth/settings');
  }

  async updateUserSettings(settingsData: {
    profile?: any;
    preferences?: any;
  }) {
    return this.request('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // User Profile APIs  
  async getUserProfile() {
    return this.request('/auth/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Address APIs
  async getAddresses() {
    return this.request('/addresses');
  }

  async getAddressById(addressId: string) {
    return this.request(`/addresses/${addressId}`);
  }

  async addAddress(addressData: any) {
    // Map frontend fields to backend expected fields
    const backendData = {
      label: addressData.name || addressData.label || 'Home',
      address: addressData.address,
      city: addressData.city,
      postalCode: addressData.postalCode,
      country: addressData.country || 'US',
      phone: addressData.phone,
      isDefault: addressData.isDefault || false
    };
    
    return this.request('/addresses', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  async updateAddress(addressId: string, addressData: any) {
    return this.request(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId: string) {
    return this.request(`/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(addressId: string) {
    return this.request(`/addresses/${addressId}/default`, {
      method: 'PATCH',
    });
  }

  // Address validation and autocomplete APIs
  async validateAddress(addressData: any) {
    return this.request('/addresses/validate', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async searchAddresses(query: string) {
    return this.request(`/addresses/search?q=${encodeURIComponent(query)}`);
  }

  async getAddressSuggestions(partialAddress: string) {
    return this.request(`/addresses/suggestions?q=${encodeURIComponent(partialAddress)}`);
  }

  // Support APIs (connecting to backend)
  async createSupportTicket(ticketData: any) {
    return this.request('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async getFAQList() {
    return this.request('/support/faq');
  }

  // Route and Maps APIs
  async calculateRoute(origin: string, destination: string) {
    const params = new URLSearchParams({
      origin,
      destination
    });
    return this.request(`/routes/calculate?${params}`);
  }

  async calculateDistanceMatrix(origins: string[], destinations: string[]) {
    return this.request('/routes/distance-matrix', {
      method: 'POST',
      body: JSON.stringify({
        origins,
        destinations
      }),
    });
  }

  async geocodeAddress(address: string) {
    const params = new URLSearchParams({ address });
    return this.request(`/routes/geocode?${params}`);
  }

  async validateServiceArea(address: string) {
    const params = new URLSearchParams({ address });
    return this.request(`/routes/validate?${params}`);
  }

  async getActiveDeliveries(): Promise<ApiResponse<any[]>> {
    return this.request('/orders/active-deliveries');
  }
}

// 创建路径相关的单独API类
class RouteAPI {
  private baseUrl = 'http://192.168.1.88:8086/api';

  private async request(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async calculateRoute(origin: string, destination: string) {
    const params = new URLSearchParams({
      origin,
      destination
    });
    return this.request(`/routes/calculate?${params}`);
  }

  async calculateDistanceMatrix(origins: string[], destinations: string[]) {
    return this.request('/routes/distance-matrix', {
      method: 'POST',
      body: JSON.stringify({
        origins,
        destinations
      }),
    });
  }

  async geocodeAddress(address: string) {
    const params = new URLSearchParams({ address });
    return this.request(`/routes/geocode?${params}`);
  }

  async validateServiceArea(address: string) {
    const params = new URLSearchParams({ address });
    return this.request(`/routes/validate?${params}`);
  }
}

export const apiService = new ApiService();
export const routeAPI = new RouteAPI();
export default apiService;