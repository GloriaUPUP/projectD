const API_BASE_URL = 'http://localhost:8086/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Mock data for MVP demo
const mockUsers = [
  { id: '1', email: 'demo@test.com', password: '123456', name: 'Demo User' }
];

const mockOrders: any[] = [];

class ApiService {
  private useMockData = true; // Enable mock data for MVP

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
          data: { user: { id: user.id, email: user.email, name: user.name }, token: 'mock-token' } as any
        };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    if (endpoint === '/auth/register' && method === 'POST') {
      const existingUser = mockUsers.find(u => u.email === body.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }
      const newUser = {
        id: Date.now().toString(),
        email: body.email,
        password: body.password,
        name: body.name
      };
      mockUsers.push(newUser);
      return {
        success: true,
        data: { user: { id: newUser.id, email: newUser.email, name: newUser.name }, token: 'mock-token' } as any
      };
    }

    // Mock orders
    if (endpoint === '/orders' && method === 'POST') {
      const newOrder = {
        id: Date.now().toString(),
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      mockOrders.push(newOrder);
      return { success: true, data: newOrder as any };
    }

    if (endpoint === '/orders' && method === 'GET') {
      return { success: true, data: mockOrders as any };
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

  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Order APIs
  async createOrder(orderData: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request('/orders');
  }

  async getOrderById(orderId: string) {
    return this.request(`/orders/${orderId}`);
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
}

export const apiService = new ApiService();
export default apiService;