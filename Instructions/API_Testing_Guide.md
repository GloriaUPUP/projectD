# DeliveryApp API Testing Guide

## 📁 Collection文件
- **文件名**: `DeliveryApp_Complete_API_Collection.json`
- **包含**: 全部后端API端点，共30+个API
- **组织结构**: 按功能模块分组

## 🚀 快速开始

### 1. 导入Postman Collection
1. 打开Postman
2. 点击 "Import" 
3. 选择 `DeliveryApp_Complete_API_Collection.json` 文件
4. 导入成功后会看到5个主要分组

### 2. 环境变量设置
Collection自动包含以下变量：
- `base_url`: http://localhost:8086/api
- `jwt_token`: 自动从登录响应中提取
- `user_id`: 自动从注册/登录响应中提取  
- `order_id`: 自动从订单创建响应中提取
- `address_id`: 自动从地址创建响应中提取

### 3. 测试顺序建议

#### 🔐 第一步：用户认证
```
1. Register New User (会自动保存JWT token)
   或者
2. Login User (使用现有用户)
```

#### 📍 第二步：地址管理
```
3. Get All Addresses
4. Add New Address (会自动保存address_id)
5. Get Address by ID
6. Update Address  
7. Validate Address
8. Search Addresses
9. Get Address Suggestions
```

#### 📦 第三步：订单管理
```
10. Create New Order (会自动保存order_id)
11. Get Order History
12. Get Order Details
13. Get Delivery Options for Order
14. Select Delivery Option
15. Get Order Status
16. Calculate Delivery Options
17. Get Delivery Recommendations
18. Track Order
```

#### 💳 第四步：支付处理
```
19. Get Payment Methods
20. Process Payment
```

#### 🎧 第五步：客服支持
```
21. Create Support Ticket
22. Get FAQ
```

#### 👤 第六步：用户管理
```
23. Get User Profile
24. Update User Profile  
25. Get User Settings
26. Update User Settings
27. Logout User
```

## 📋 API端点详情

### 🔐 Authentication & User Management
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 用户注册 | ❌ |
| POST | `/auth/login` | 用户登录 | ❌ |
| POST | `/auth/logout` | 用户登出 | ✅ |
| GET | `/auth/profile` | 获取用户资料 | ✅ |
| PUT | `/auth/profile` | 更新用户资料 | ✅ |
| GET | `/auth/settings` | 获取用户设置 | ✅ |
| PUT | `/auth/settings` | 更新用户设置 | ✅ |

### 📦 Order Management
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/orders` | 创建订单 | ✅ |
| GET | `/orders/history` | 订单历史 | ✅ |
| GET | `/orders/{id}/details` | 订单详情 | ✅ |
| GET | `/orders/{id}/delivery-options` | 获取配送选项 | ✅ |
| PUT | `/orders/{id}/select-option` | 选择配送方式 | ✅ |
| GET | `/orders/{id}/status` | 订单状态 | ✅ |
| POST | `/delivery/options` | 计算配送选项 | ✅ |
| POST | `/delivery/recommendations` | 配送推荐 | ✅ |
| GET | `/tracking/{id}` | 订单跟踪 | ✅ |

### 📍 Address Management
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/addresses` | 获取地址列表 | ✅ |
| GET | `/addresses/{id}` | 获取单个地址 | ✅ |
| POST | `/addresses` | 添加地址 | ✅ |
| PUT | `/addresses/{id}` | 更新地址 | ✅ |
| DELETE | `/addresses/{id}` | 删除地址 | ✅ |
| POST | `/addresses/validate` | 地址验证 | ✅ |
| GET | `/addresses/search` | 地址搜索 | ✅ |
| GET | `/addresses/suggestions` | 地址建议 | ✅ |

### 💳 Payment Management
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/payment/methods` | 获取支付方式 | ✅ |
| POST | `/payment/process` | 处理支付 | ✅ |

### 🎧 Support & Help
| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/support/tickets` | 创建客服工单 | ✅ |
| GET | `/support/faq` | 获取FAQ | ✅ |

## ✅ 自动化测试功能

Collection包含以下自动化功能：

### 🔄 自动Token管理
- 注册/登录成功后自动保存JWT token
- 后续请求自动使用保存的token

### 📊 自动ID提取
- 创建订单后自动保存order_id
- 创建地址后自动保存address_id
- 用于后续相关API测试

### ⏱️ 性能监控
- 自动检查响应时间（< 2秒）
- 验证响应格式为JSON

### 📝 日志输出
- 成功操作自动输出确认信息
- 便于跟踪测试进度

## 🔧 测试配置

### 服务器要求
- 后端服务运行在: `localhost:8086`
- API前缀: `/api`
- 数据库连接正常

### 数据格式注意事项
- **用户注册**: 使用camelCase (`firstName`, `lastName`)
- **订单创建**: 使用snake_case (`pickup_info`, `delivery_info`, `package_info`)
- **其他API**: 大部分使用camelCase

## 🐛 常见问题排查

### 401 Unauthorized
- 确保先执行登录获取token
- 检查token是否正确设置

### 400 Bad Request  
- 检查请求体JSON格式
- 确认必填字段都已提供
- 验证字段名称格式（camelCase vs snake_case）

### 404 Not Found
- 确认后端服务正在运行
- 检查API路径是否正确
- 验证端口号8086

### 500 Internal Server Error
- 检查后端日志
- 确认数据库连接正常
- 验证请求数据的有效性

## 📈 测试结果预期

### 成功场景
- 所有认证相关API返回200状态码
- 订单创建返回包含orderId的响应
- 地址管理操作正常执行
- 支付和客服API返回预期数据

### 数据持久化验证
- 注册用户可成功登录
- 创建的订单出现在历史记录中  
- 添加的地址显示在地址列表中
- 数据库中有对应记录

---

## 💡 提示
- 按建议顺序执行测试获得最佳效果
- 每个分组可以独立测试
- 使用Postman Runner可以批量执行测试
- 建议先用单个API测试，确认无误后再批量运行