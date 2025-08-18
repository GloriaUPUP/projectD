# Google Maps API 设置指南

## 一、需要启用的 APIs

### 1. 核心 APIs（必需）
- **Geocoding API** - 地址转换为经纬度坐标
- **Directions API** - 计算配送路线、距离和时间
- **Distance Matrix API** - 批量计算多个点之间的距离和时间
- **Maps JavaScript API** - 前端地图显示

### 2. 增强功能 APIs（推荐）
- **Places API** - 地址自动完成和搜索
- **Roads API** - 将 GPS 轨迹贴合到道路上
- **Geolocation API** - 获取用户位置

## 二、获取 API Key

### 步骤 1: 创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击 "Select a project" → "New Project"
3. 输入项目名称: "DeliveryApp"
4. 点击 "Create"

### 步骤 2: 启用计费
1. 在左侧菜单选择 "Billing"
2. 添加信用卡信息（Google 提供 $300 免费额度）
3. 注意：设置预算警报避免超支

### 步骤 3: 启用 APIs
1. 访问 [API Library](https://console.cloud.google.com/apis/library)
2. 搜索并启用以下 APIs：
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Maps JavaScript API
   - Places API

### 步骤 4: 创建 API Key
1. 访问 [Credentials](https://console.cloud.google.com/apis/credentials)
2. 点击 "+ CREATE CREDENTIALS" → "API key"
3. 复制生成的 API key

### 步骤 5: 限制 API Key（重要！）
1. 点击刚创建的 API key
2. 在 "Application restrictions" 选择：
   - 对于后端: "IP addresses" 并添加服务器 IP
   - 对于前端: "HTTP referrers" 并添加域名
3. 在 "API restrictions" 选择 "Restrict key" 并选择需要的 APIs
4. 点击 "Save"

## 三、费用估算

### 免费额度（每月）
- Geocoding: 40,000 次请求
- Directions: 40,000 次请求
- Distance Matrix: 40,000 个元素
- Maps JavaScript: 28,000 次加载

### 定价（超出免费额度后）
- Geocoding: $5 / 1000 次请求
- Directions: $5 / 1000 次请求
- Distance Matrix: $5 / 1000 个元素
- Maps JavaScript: $7 / 1000 次加载

### 成本优化建议
1. 缓存地理编码结果
2. 批量处理 Distance Matrix 请求
3. 使用 Session tokens 优化 Places API
4. 实施请求限流

## 四、后端集成（Spring Boot）

### 1. 添加依赖
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.google.maps</groupId>
    <artifactId>google-maps-services</artifactId>
    <version>2.2.0</version>
</dependency>
```

或 Gradle:
```gradle
implementation 'com.google.maps:google-maps-services:2.2.0'
```

### 2. 配置文件
```yaml
# application.yml
google:
  maps:
    api-key: ${GOOGLE_MAPS_API_KEY:your-api-key-here}
    
# 建议使用环境变量存储 API key
```

### 3. 创建配置类
```java
@Configuration
public class GoogleMapsConfig {
    
    @Value("${google.maps.api-key}")
    private String apiKey;
    
    @Bean
    public GeoApiContext geoApiContext() {
        return new GeoApiContext.Builder()
            .apiKey(apiKey)
            .build();
    }
}
```

## 五、前端集成（React Native/Expo）

### 1. 安装依赖
```bash
npm install react-native-maps react-native-google-places-autocomplete
# 或
expo install react-native-maps
```

### 2. 配置
```javascript
// app.config.js
export default {
  expo: {
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  }
};
```

## 六、API 使用示例

### 1. 地址转坐标（Geocoding）
```java
@Service
public class GeocodingService {
    @Autowired
    private GeoApiContext context;
    
    public LatLng geocodeAddress(String address) {
        try {
            GeocodingResult[] results = GeocodingApi.geocode(context, address).await();
            if (results.length > 0) {
                return results[0].geometry.location;
            }
        } catch (Exception e) {
            log.error("Geocoding failed", e);
        }
        return null;
    }
}
```

### 2. 计算路线（Directions）
```java
public DirectionsResult calculateRoute(String origin, String destination) {
    try {
        return DirectionsApi.newRequest(context)
            .origin(origin)
            .destination(destination)
            .mode(TravelMode.DRIVING)
            .alternatives(true)
            .await();
    } catch (Exception e) {
        log.error("Route calculation failed", e);
    }
    return null;
}
```

### 3. 距离矩阵（Distance Matrix）
```java
public DistanceMatrix calculateDistances(String[] origins, String[] destinations) {
    try {
        return DistanceMatrixApi.newRequest(context)
            .origins(origins)
            .destinations(destinations)
            .mode(TravelMode.DRIVING)
            .await();
    } catch (Exception e) {
        log.error("Distance calculation failed", e);
    }
    return null;
}
```

## 七、数据库更新建议

### 1. 更新 address 表
```sql
ALTER TABLE address ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE address ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE address ADD COLUMN IF NOT EXISTS formatted_address TEXT;
ALTER TABLE address ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);
```

### 2. 更新 route 表
```sql
ALTER TABLE route ADD COLUMN IF NOT EXISTS polyline TEXT; -- 编码的路线
ALTER TABLE route ADD COLUMN IF NOT EXISTS waypoints JSONB; -- 路线点
ALTER TABLE route ADD COLUMN IF NOT EXISTS actual_distance_m INTEGER;
ALTER TABLE route ADD COLUMN IF NOT EXISTS actual_duration_s INTEGER;
```

## 八、安全最佳实践

1. **永远不要在代码中硬编码 API key**
2. **使用环境变量存储敏感信息**
3. **为不同环境使用不同的 API keys**
4. **实施请求限流避免超额费用**
5. **监控 API 使用量**
6. **定期轮换 API keys**

## 九、测试建议

### 开发环境
- 使用 Mock 数据减少 API 调用
- 实施缓存机制

### 生产环境
- 设置日志记录 API 使用
- 配置错误处理和降级方案
- 设置费用警报

## 十、替代方案

如果 Google Maps 太贵，可以考虑：

### 1. Mapbox
- 更便宜的定价
- 良好的开发者体验
- 每月 50,000 免费请求

### 2. OpenStreetMap + GraphHopper
- 完全免费
- 自托管选项
- 需要更多配置

### 3. HERE Maps
- 企业级解决方案
- 每月 250,000 免费事务

## 十一、实施步骤

1. **第一阶段**：基础集成
   - 获取 API key
   - 集成 Geocoding API
   - 实现地址验证

2. **第二阶段**：路线计算
   - 集成 Directions API
   - 计算真实配送路线
   - 更新数据库存储路线信息

3. **第三阶段**：实时追踪
   - 实现车辆位置更新
   - 集成 Roads API 优化轨迹
   - 前端地图显示

4. **第四阶段**：优化
   - 实施缓存策略
   - 批量处理请求
   - 成本优化