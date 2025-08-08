# Comprehensive API Documentation

## 核心设计理念

### 前后端分离架构
- **前端**: 负责用户界面交互和数据收集
- **后端**: 负责业务逻辑处理和数据存储  
- **API**: 作为两者之间的通信桥梁

### 标准响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}
```

### HTTP 状态码
- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源未找到
- `422 Unprocessable Entity` - 数据验证失败
- `500 Internal Server Error` - 服务器内部错误

## API 端点详细说明

### 1. 用户认证系统

#### 用户注册
```http
POST /api/auth/register
```
**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St, San Francisco, CA"
}
```
**成功响应:**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "userId": "user_12345",
    "email": "user@example.com",
    "token": "jwt_token_here"
  }
}
```
**失败响应:**
```json
{
  "success": false,
  "message": "邮箱已被注册",
  "error": "EMAIL_ALREADY_EXISTS"
}
```

#### 用户登录
```http
POST /api/auth/login
```
**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**成功响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "userId": "user_12345",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "jwt_token_here"
  }
}
```

### 2. 订单管理系统

#### 创建订单
```http
POST /api/orders
```
**请求体:**
```json
{
  "pickupInfo": {
    "address": "123 Pickup St, San Francisco, CA 94102",
    "contactName": "John Sender",
    "contactPhone": "+1234567890",
    "instructions": "Ring doorbell twice"
  },
  "deliveryInfo": {
    "address": "456 Delivery Ave, San Francisco, CA 94103",
    "contactName": "Jane Receiver", 
    "contactPhone": "+0987654321",
    "instructions": "Leave at front desk"
  },
  "packageInfo": {
    "weight": 2.5,
    "type": "electronics",
    "value": 150.00,
    "description": "iPhone case"
  },
  "preferences": {
    "pickupTime": "2024-03-15T10:00:00Z",
    "serviceType": "standard"
  }
}
```
**成功响应:**
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": "order_789012",
    "status": "pending_options",
    "createdAt": "2024-03-14T15:30:00Z"
  }
}
```

#### 获取配送选项
```http
GET /api/orders/{orderId}/delivery-options
```
**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789012",
    "availableOptions": [
      {
        "optionId": "robot_standard",
        "type": "robot",
        "name": "机器人配送",
        "price": 12.50,
        "estimatedTime": "45分钟",
        "description": "地面机器人配送，适合大部分物件",
        "availableCount": 3
      },
      {
        "optionId": "drone_express",
        "type": "drone",
        "name": "无人机配送", 
        "price": 18.00,
        "estimatedTime": "20分钟",
        "description": "空中无人机配送，快速直达",
        "availableCount": 2,
        "weatherDependent": true
      }
    ]
  }
}
```

#### 选择配送方案
```http
PUT /api/orders/{orderId}/select-option
```
**请求体:**
```json
{
  "selectedOptionId": "robot_standard"
}
```
**响应:**
```json
{
  "success": true,
  "message": "配送方案已选择",
  "data": {
    "orderId": "order_789012",
    "selectedOption": "robot_standard",
    "totalCost": 12.50,
    "status": "awaiting_payment"
  }
}
```

#### 获取订单状态
```http
GET /api/orders/{orderId}/status
```
**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789012",
    "currentStatus": "in_transit",
    "statusHistory": [
      {
        "status": "created",
        "timestamp": "2024-03-15T10:00:00Z",
        "description": "订单已创建"
      },
      {
        "status": "confirmed",
        "timestamp": "2024-03-15T10:15:00Z", 
        "description": "订单已确认，分配机器人"
      },
      {
        "status": "picked_up",
        "timestamp": "2024-03-15T10:30:00Z",
        "description": "包裹已取件"
      },
      {
        "status": "in_transit", 
        "timestamp": "2024-03-15T10:35:00Z",
        "description": "正在配送中"
      }
    ],
    "currentLocation": {
      "lat": 37.7749,
      "lng": -122.4194,
      "address": "Market St & 5th St"
    },
    "estimatedDelivery": "2024-03-15T11:00:00Z",
    "assignedDevice": {
      "deviceId": "robot_r001",
      "type": "robot",
      "name": "配送机器人#1"
    }
  }
}
```

#### 获取订单历史
```http
GET /api/orders/history?page=1&limit=10&status=completed
```
**响应:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "order_789012",
        "createdAt": "2024-03-15T10:00:00Z",
        "status": "completed",
        "pickup": {
          "address": "123 Pickup St",
          "time": "2024-03-15T10:30:00Z"
        },
        "delivery": {
          "address": "456 Delivery Ave",
          "time": "2024-03-15T11:05:00Z" 
        },
        "cost": 12.50,
        "deliveryMethod": "robot"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "limit": 10
    }
  }
}
```

#### 获取订单详情
```http
GET /api/orders/{orderId}/details
```
**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_789012",
    "status": "completed",
    "createdAt": "2024-03-15T10:00:00Z",
    "completedAt": "2024-03-15T11:05:00Z",
    "pickup": {
      "address": "123 Pickup St, San Francisco, CA",
      "contactName": "John Sender",
      "actualTime": "2024-03-15T10:30:00Z"
    },
    "delivery": {
      "address": "456 Delivery Ave, San Francisco, CA",
      "contactName": "Jane Receiver",
      "actualTime": "2024-03-15T11:05:00Z"
    },
    "package": {
      "weight": 2.5,
      "type": "electronics",
      "value": 150.00
    },
    "cost": 12.50,
    "deliveryMethod": "robot",
    "deviceUsed": {
      "deviceId": "robot_r001",
      "name": "配送机器人#1"
    }
  }
}
```

### 3. 支付系统

#### 获取支付方式
```http
GET /api/payments/methods
```
**响应:**
```json
{
  "success": true,
  "data": {
    "savedCards": [
      {
        "methodId": "card_1234",
        "last4": "4242",
        "brand": "visa",
        "isDefault": true
      }
    ],
    "availableMethods": ["credit_card", "paypal", "apple_pay"]
  }
}
```

#### 处理支付
```http
POST /api/payments/process
```
**请求体:**
```json
{
  "orderId": "order_789012",
  "paymentMethod": "credit_card",
  "paymentInfo": {
    "cardNumber": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  },
  "amount": 12.50
}
```
**成功响应:**
```json
{
  "success": true,
  "message": "支付成功",
  "data": {
    "paymentId": "pay_567890",
    "orderId": "order_789012", 
    "amount": 12.50,
    "status": "completed",
    "transactionId": "txn_abc123"
  }
}
```
**失败响应:**
```json
{
  "success": false,
  "message": "支付失败",
  "error": "CARD_DECLINED",
  "details": {
    "reason": "insufficient_funds"
  }
}
```

### 4. 地址管理

#### 获取地址列表
```http
GET /api/addresses
```

#### 添加地址
```http
POST /api/addresses
```

#### 更新地址
```http
PUT /api/addresses/{addressId}
```

#### 删除地址
```http
DELETE /api/addresses/{addressId}
```

#### 设置默认地址
```http
PATCH /api/addresses/{addressId}/default
```

#### 地址验证
```http
POST /api/addresses/validate
```

#### 地址搜索
```http
GET /api/addresses/search?q={query}
```

#### 地址建议
```http
GET /api/addresses/suggestions?q={partialAddress}
```

### 5. 用户设置

#### 获取用户设置
```http
GET /api/users/settings
```
**响应:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "addresses": [
      {
        "addressId": "addr_001",
        "label": "Home",
        "address": "123 Main St, San Francisco, CA 94102",
        "isDefault": true
      }
    ],
    "preferences": {
      "language": "en",
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "defaultDeliveryMethod": "robot"
    }
  }
}
```

#### 更新用户设置
```http
PUT /api/users/settings
```
**请求体:**
```json
{
  "profile": {
    "firstName": "John",
    "phone": "+1234567890"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  }
}
```
**响应:**
```json
{
  "success": true,
  "message": "设置已更新",
  "data": {
    "updatedFields": ["profile.phone", "preferences.notifications.sms"]
  }
}
```

### 6. 客服支持

#### 提交支持请求
```http
POST /api/support/tickets
```

#### 获取常见问题
```http
GET /api/support/faq
```

## 前端处理逻辑模式

对于每个功能，前端的处理流程：

1. **收集用户输入** → 表单验证
2. **发送API请求** → 显示loading状态  
3. **处理响应**:
   - 成功: 更新UI状态，显示成功消息，跳转页面
   - 失败: 显示错误消息，保持当前状态
4. **错误处理** → 网络错误、超时等异常情况

## TypeScript 接口定义

```typescript
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}
```

## Mock 数据支持

所有 API 端点都配置了完整的 Mock 数据支持，便于前端开发和测试：

- 用户认证模拟
- 订单创建和状态管理
- 支付处理模拟（包含失败场景）
- 地址管理完整功能
- 用户设置管理
- 配送选项和跟踪

这套 API 设计提供了完整的配送应用功能支持，符合 RESTful 设计原则，具有良好的可扩展性和维护性。