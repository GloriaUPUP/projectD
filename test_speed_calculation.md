# 测试速度计算功能

这个文档说明了如何测试新的基于速度的配送时间计算功能。

## 后端修改

### 主要变更
1. `DeliveryTrackingService.startDeliveryTracking()` 方法参数从 `durationMinutes` 改为 `vehicleType`
2. 添加了基于距离和车辆速度的时间计算
3. 支持机器人 (15 km/h) 和无人机 (45 km/h) 的固定速度

### 速度配置
- 机器人: 15 km/h
- 无人机: 45 km/h

### 时间计算公式
```
基础时间 = 距离(km) / 速度(km/h) * 60 (转换为分钟)
缓冲时间 = max(5, min(10, 基础时间/10)) 分钟
总时间 = max(15, min(120, 基础时间 + 缓冲时间)) 分钟
```

## 前端修改

### 主要变更
1. `DeliverySimulator` 添加了速度配置和基于速度的时间计算
2. `PricingEngine` 更新为与后端一致的速度设置
3. 添加了 `createSpeedBasedSimulation()` 方法

## 测试案例

### 1. 近距离配送（1公里）
- 机器人: 1km ÷ 15km/h = 4分钟 + 5分钟缓冲 = 15分钟（最小值）
- 无人机: 1km ÷ 45km/h = 1.3分钟 + 5分钟缓冲 = 15分钟（最小值）

### 2. 中距离配送（10公里）
- 机器人: 10km ÷ 15km/h = 40分钟 + 5分钟缓冲 = 45分钟
- 无人机: 10km ÷ 45km/h = 13.3分钟 + 5分钟缓冲 = 19分钟

### 3. 长距离配送（50公里）
- 机器人: 50km ÷ 15km/h = 200分钟 + 10分钟缓冲 = 120分钟（最大值）
- 无人机: 50km ÷ 45km/h = 66.7分钟 + 7分钟缓冲 = 74分钟

## API 测试

### 后端 API
```bash
# 启动机器人配送
curl -X POST http://localhost:8086/api/tracking/start \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test123",
    "origin": "Mountain View, CA",
    "destination": "Palo Alto, CA",
    "vehicleType": "robot"
  }'

# 启动无人机配送
curl -X POST http://localhost:8086/api/tracking/start \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test456",
    "origin": "San Francisco, CA",
    "destination": "Berkeley, CA",
    "vehicleType": "drone"
  }'
```

### 前端配送模拟
```javascript
// 创建基于速度的配送模拟
await deliverySimulator.createSpeedBasedSimulation(
  'order123',
  'Union Square, San Francisco, CA',
  'Mission Bay, San Francisco, CA',
  'robot'
);

await deliverySimulator.createSpeedBasedSimulation(
  'order456',
  'Pier 39, San Francisco, CA',
  'Golden Gate Park, San Francisco, CA',
  'drone'
);
```

## 验证要点

1. **时间计算**: 确认计算出的时间符合上述公式
2. **日志输出**: 检查后端日志是否显示正确的距离、速度和计算时间
3. **前端显示**: 确认前端显示的预估时间与后端计算一致
4. **模拟动画**: 确认配送动画按照计算出的时间进行，而不是固定3分钟

## 旧 vs 新系统对比

### 旧系统
- 固定3分钟配送时间，不考虑实际距离
- 所有配送类型使用相同时间

### 新系统  
- 基于实际路径距离和车辆速度计算
- 机器人和无人机有不同的配送时间
- 更真实的配送体验