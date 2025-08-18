# Google Maps API 路径计算与显示完整指南

## 概述
本指南详细介绍如何使用Google Maps API在前端JavaScript和后端Java中计算两点间的路径，并在地图上显示路线。

## 目录
1. [后端实现 (Java Spring Boot)](#后端实现)
2. [前端实现 (JavaScript)](#前端实现)
3. [完整示例](#完整示例)
4. [API 端点](#api-端点)
5. [错误处理](#错误处理)
6. [最佳实践](#最佳实践)

---

## 后端实现

### 1. 依赖配置

确保 `build.gradle` 包含：
```gradle
dependencies {
    // Google Maps Services
    implementation 'com.google.maps:google-maps-services:2.2.0'
}
```

### 2. GeocodingService 路径计算

你的项目已经包含完整的路径计算功能：

```java
@Service
public class GeocodingService {
    
    /**
     * 计算两点之间的驾车路径
     */
    public Map<String, Object> calculateRoute(String origin, String destination) {
        try {
            DirectionsResult result = DirectionsApi.newRequest(context)
                .origin(origin)
                .destination(destination)
                .mode(TravelMode.DRIVING)
                .alternatives(true) // 获取备选路线
                .await();
            
            if (result.routes.length == 0) {
                throw new GeocodingException("No route found");
            }
            
            DirectionsRoute route = result.routes[0];
            Map<String, Object> routeInfo = new HashMap<>();
            
            // 基本路线信息
            DirectionsLeg leg = route.legs[0];
            routeInfo.put("distance", leg.distance.humanReadable);
            routeInfo.put("distanceValue", leg.distance.inMeters);
            routeInfo.put("duration", leg.duration.humanReadable);
            routeInfo.put("durationValue", leg.duration.inSeconds);
            routeInfo.put("startAddress", leg.startAddress);
            routeInfo.put("endAddress", leg.endAddress);
            
            // 起止点坐标
            routeInfo.put("startLocation", Map.of(
                "lat", leg.startLocation.lat,
                "lng", leg.startLocation.lng
            ));
            routeInfo.put("endLocation", Map.of(
                "lat", leg.endLocation.lat,
                "lng", leg.endLocation.lng
            ));
            
            // 用于前端绘制的编码折线
            routeInfo.put("polyline", route.overviewPolyline.getEncodedPath());
            
            // 逐步导航指示
            List<Map<String, Object>> steps = new ArrayList<>();
            for (DirectionsStep step : leg.steps) {
                Map<String, Object> stepInfo = new HashMap<>();
                stepInfo.put("instruction", step.htmlInstructions);
                stepInfo.put("distance", step.distance.humanReadable);
                stepInfo.put("duration", step.duration.humanReadable);
                stepInfo.put("startLocation", Map.of(
                    "lat", step.startLocation.lat,
                    "lng", step.startLocation.lng
                ));
                stepInfo.put("endLocation", Map.of(
                    "lat", step.endLocation.lat,
                    "lng", step.endLocation.lng
                ));
                steps.add(stepInfo);
            }
            routeInfo.put("steps", steps);
            
            // 备选路线
            if (result.routes.length > 1) {
                List<Map<String, Object>> alternatives = new ArrayList<>();
                for (int i = 1; i < Math.min(result.routes.length, 3); i++) {
                    DirectionsRoute altRoute = result.routes[i];
                    Map<String, Object> altInfo = new HashMap<>();
                    altInfo.put("distance", altRoute.legs[0].distance.humanReadable);
                    altInfo.put("duration", altRoute.legs[0].duration.humanReadable);
                    altInfo.put("polyline", altRoute.overviewPolyline.getEncodedPath());
                    alternatives.add(altInfo);
                }
                routeInfo.put("alternatives", alternatives);
            }
            
            return routeInfo;
        } catch (IOException | ApiException | InterruptedException e) {
            logger.error("Failed to calculate route from {} to {}", origin, destination, e);
            throw new GeocodingException("Failed to calculate route");
        }
    }
}
```

### 3. REST API 控制器

```java
@RestController
@RequestMapping("/geocoding")
public class GeocodingController {
    
    @PostMapping("/route")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateRoute(
            @RequestBody Map<String, String> request) {
        try {
            String origin = request.get("origin");
            String destination = request.get("destination");
            
            if (origin == null || destination == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Origin and destination are required", null));
            }
            
            Map<String, Object> route = geocodingService.calculateRoute(origin, destination);
            return ResponseEntity.ok(ApiResponse.success(route));
        } catch (OutsideServiceAreaException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Address outside San Francisco service area", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate route", e.getMessage()));
        }
    }
}
```

---

## 前端实现

### 1. HTML 结构

```html
<!DOCTYPE html>
<html>
<head>
    <title>Route Calculation</title>
    <style>
        #map { height: 500px; width: 100%; }
        #controls { margin: 20px 0; }
        .control-group { margin: 10px 0; }
    </style>
</head>
<body>
    <div id="controls">
        <div class="control-group">
            <label>起点:</label>
            <input type="text" id="start" placeholder="输入起始地址" />
        </div>
        <div class="control-group">
            <label>终点:</label>
            <input type="text" id="end" placeholder="输入目标地址" />
        </div>
        <div class="control-group">
            <button onclick="calculateRoute()">计算路径</button>
            <button onclick="clearRoute()">清除路径</button>
        </div>
        <div id="route-info"></div>
    </div>
    <div id="map"></div>
    
    <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=places"></script>
    <script src="route-calculator.js"></script>
</body>
</html>
```

### 2. JavaScript 实现

```javascript
// route-calculator.js
let map;
let directionsService;
let directionsRenderer;

// 旧金山边界限制
const SF_BOUNDS = {
    north: 37.810,
    south: 37.708,
    west: -122.515,
    east: -122.357,
};

function initMap() {
    // 初始化地图（限制在旧金山）
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: { lat: 37.7749, lng: -122.4194 }, // 旧金山中心
        restriction: {
            latLngBounds: SF_BOUNDS,
            strictBounds: false,
        },
    });

    // 初始化方向服务
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true, // 允许拖拽调整路线
        panel: document.getElementById("route-info"), // 显示文字导航
    });
    directionsRenderer.setMap(map);

    // 设置地址自动补全（限制在旧金山）
    setupAutocomplete();
    
    // 监听路线拖拽事件
    directionsRenderer.addListener("directions_changed", function() {
        const directions = directionsRenderer.getDirections();
        displayRouteInfo(directions);
    });
}

function setupAutocomplete() {
    const startInput = document.getElementById("start");
    const endInput = document.getElementById("end");
    
    const startAutocomplete = new google.maps.places.Autocomplete(startInput, {
        bounds: SF_BOUNDS,
        strictBounds: true,
        componentRestrictions: { country: "us" },
        types: ['address']
    });
    
    const endAutocomplete = new google.maps.places.Autocomplete(endInput, {
        bounds: SF_BOUNDS,
        strictBounds: true,
        componentRestrictions: { country: "us" },
        types: ['address']
    });
}

// 方法1: 使用前端 DirectionsService
function calculateRoute() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    
    if (!start || !end) {
        alert("请输入起点和终点地址");
        return;
    }
    
    const request = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    };
    
    directionsService.route(request, function(result, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(result);
            displayRouteInfo(result);
        } else {
            alert("路径计算失败: " + status);
        }
    });
}

// 方法2: 使用后端API计算路径
async function calculateRouteViaBackend() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    
    if (!start || !end) {
        alert("请输入起点和终点地址");
        return;
    }
    
    try {
        const response = await fetch('/api/geocoding/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: start,
                destination: end
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const routeData = data.data;
            
            // 解码并显示路线
            displayEncodedRoute(routeData.polyline);
            
            // 显示路线信息
            displayBackendRouteInfo(routeData);
        } else {
            alert("路径计算失败: " + data.message);
        }
    } catch (error) {
        console.error("API调用失败:", error);
        alert("网络错误，请稍后重试");
    }
}

// 显示编码的路线
function displayEncodedRoute(encodedPolyline) {
    // 清除之前的路线
    directionsRenderer.setDirections({routes: []});
    
    // 解码polyline并显示
    const decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);
    
    const routePolyline = new google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 4
    });
    
    routePolyline.setMap(map);
    
    // 调整地图视图以显示整条路线
    const bounds = new google.maps.LatLngBounds();
    decodedPath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
}

// 显示路线信息（前端计算）
function displayRouteInfo(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    const infoDiv = document.getElementById("route-info");
    infoDiv.innerHTML = `
        <div class="route-summary">
            <h3>路线信息</h3>
            <p><strong>距离:</strong> ${leg.distance.text}</p>
            <p><strong>预计时间:</strong> ${leg.duration.text}</p>
            <p><strong>起点:</strong> ${leg.start_address}</p>
            <p><strong>终点:</strong> ${leg.end_address}</p>
        </div>
        <div class="route-steps">
            <h4>导航步骤</h4>
            <ol>
                ${leg.steps.map(step => 
                    `<li>${step.instructions} (${step.distance.text})</li>`
                ).join('')}
            </ol>
        </div>
    `;
}

// 显示路线信息（后端计算）
function displayBackendRouteInfo(routeData) {
    const infoDiv = document.getElementById("route-info");
    infoDiv.innerHTML = `
        <div class="route-summary">
            <h3>路线信息</h3>
            <p><strong>距离:</strong> ${routeData.distance}</p>
            <p><strong>预计时间:</strong> ${routeData.duration}</p>
            <p><strong>起点:</strong> ${routeData.startAddress}</p>
            <p><strong>终点:</strong> ${routeData.endAddress}</p>
        </div>
        <div class="route-steps">
            <h4>导航步骤</h4>
            <ol>
                ${routeData.steps.map(step => 
                    `<li>${step.instruction} (${step.distance})</li>`
                ).join('')}
            </ol>
        </div>
        ${routeData.alternatives ? `
            <div class="alternatives">
                <h4>备选路线</h4>
                ${routeData.alternatives.map((alt, index) => 
                    `<p>路线 ${index + 2}: ${alt.distance}, ${alt.duration}</p>`
                ).join('')}
            </div>
        ` : ''}
    `;
}

// 清除路线
function clearRoute() {
    directionsRenderer.setDirections({routes: []});
    document.getElementById("route-info").innerHTML = '';
    document.getElementById("start").value = '';
    document.getElementById("end").value = '';
}

// 监听输入框回车事件
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("start").addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
    
    document.getElementById("end").addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
});
```

---

## 完整示例

### React 组件示例

```jsx
import React, { useState, useEffect, useRef } from 'react';

const RouteCalculator = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [directionsService, setDirectionsService] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // 旧金山边界
    const SF_BOUNDS = {
        north: 37.810,
        south: 37.708,
        west: -122.515,
        east: -122.357,
    };

    useEffect(() => {
        // 初始化地图
        if (window.google && mapRef.current) {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                zoom: 12,
                center: { lat: 37.7749, lng: -122.4194 },
                restriction: {
                    latLngBounds: SF_BOUNDS,
                    strictBounds: false,
                },
            });

            const directionsServiceInstance = new window.google.maps.DirectionsService();
            const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
                draggable: true,
            });
            
            directionsRendererInstance.setMap(mapInstance);
            
            setMap(mapInstance);
            setDirectionsService(directionsServiceInstance);
            setDirectionsRenderer(directionsRendererInstance);
        }
    }, []);

    const calculateRoute = async () => {
        if (!origin || !destination) {
            alert('请输入起点和终点');
            return;
        }

        setLoading(true);
        
        try {
            // 使用后端API
            const response = await fetch('/api/geocoding/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin: origin,
                    destination: destination
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setRouteInfo(data.data);
                displayRoute(data.data);
            } else {
                alert('路径计算失败: ' + data.message);
            }
        } catch (error) {
            console.error('API调用失败:', error);
            alert('网络错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const displayRoute = (routeData) => {
        // 使用前端DirectionsService显示路线
        if (directionsService && directionsRenderer) {
            const request = {
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result);
                }
            });
        }
    };

    return (
        <div className="route-calculator">
            <div className="controls">
                <div>
                    <input
                        type="text"
                        placeholder="起始地址"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="目标地址"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                </div>
                <button 
                    onClick={calculateRoute} 
                    disabled={loading}
                >
                    {loading ? '计算中...' : '计算路径'}
                </button>
            </div>
            
            <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
            
            {routeInfo && (
                <div className="route-info">
                    <h3>路线信息</h3>
                    <p>距离: {routeInfo.distance}</p>
                    <p>预计时间: {routeInfo.duration}</p>
                    <p>起点: {routeInfo.startAddress}</p>
                    <p>终点: {routeInfo.endAddress}</p>
                </div>
            )}
        </div>
    );
};

export default RouteCalculator;
```

---

## API 端点

### 计算路径
**POST** `/api/geocoding/route`

**请求体:**
```json
{
    "origin": "123 Market St, San Francisco, CA",
    "destination": "Golden Gate Bridge, San Francisco, CA"
}
```

**响应:**
```json
{
    "success": true,
    "message": "Route calculated successfully",
    "data": {
        "distance": "5.2 km",
        "distanceValue": 5200,
        "duration": "12 mins",
        "durationValue": 720,
        "startAddress": "123 Market St, San Francisco, CA 94103, USA",
        "endAddress": "Golden Gate Bridge, San Francisco, CA, USA",
        "startLocation": {"lat": 37.7893, "lng": -122.4008},
        "endLocation": {"lat": 37.8199, "lng": -122.4783},
        "polyline": "encoded_polyline_string_here",
        "steps": [
            {
                "instruction": "Head northwest on Market St",
                "distance": "500 m",
                "duration": "2 mins",
                "startLocation": {"lat": 37.7893, "lng": -122.4008},
                "endLocation": {"lat": 37.7920, "lng": -122.4060}
            }
        ],
        "alternatives": [
            {
                "distance": "6.1 km",
                "duration": "15 mins",
                "polyline": "alternative_encoded_polyline_string"
            }
        ]
    }
}
```

---

## 错误处理

### 常见错误类型

1. **地址超出服务范围**
```json
{
    "success": false,
    "message": "Address outside San Francisco service area",
    "errorCode": "OUTSIDE_SERVICE_AREA"
}
```

2. **无效地址**
```json
{
    "success": false,
    "message": "Invalid or ambiguous address provided",
    "errorCode": "INVALID_ADDRESS"
}
```

3. **无法找到路线**
```json
{
    "success": false,
    "message": "No route found between the specified locations",
    "errorCode": "NO_ROUTE_FOUND"
}
```

### 前端错误处理

```javascript
async function handleRouteCalculation() {
    try {
        const response = await calculateRouteViaBackend();
        // 处理成功响应
    } catch (error) {
        switch (error.errorCode) {
            case 'OUTSIDE_SERVICE_AREA':
                alert('地址必须在旧金山市区范围内');
                break;
            case 'INVALID_ADDRESS':
                alert('请输入有效的地址');
                break;
            case 'NO_ROUTE_FOUND':
                alert('无法找到两点间的路线');
                break;
            default:
                alert('路径计算失败，请稍后重试');
        }
    }
}
```

---

## 最佳实践

### 1. 性能优化
- 使用防抖减少API调用频率
- 缓存常用路线结果
- 优化polyline解码性能

```javascript
// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖的地址输入
const debouncedCalculate = debounce(calculateRoute, 1000);
```

### 2. 用户体验
- 显示加载状态
- 提供路线预览
- 支持拖拽调整路线
- 显示备选路线

### 3. 安全性
- API密钥限制域名
- 后端验证地址范围
- 限制请求频率

### 4. 移动端适配
```css
@media (max-width: 768px) {
    #map {
        height: 300px;
    }
    
    .controls input {
        width: 100%;
        margin: 5px 0;
    }
}
```

---

## 配置说明

### Google Maps API配置
1. 启用APIs: Maps JavaScript API, Directions API, Places API
2. 设置API密钥限制
3. 配置计费账户

### 应用配置
```properties
# application.properties
google.maps.api.key=YOUR_API_KEY_HERE
```

---

## 总结

本指南提供了完整的Google Maps路径计算和显示解决方案，包括：

✅ **后端Java实现** - 使用Google Maps Java客户端  
✅ **前端JavaScript实现** - 使用Maps JavaScript API  
✅ **React组件示例** - 现代前端框架集成  
✅ **旧金山区域限制** - 符合业务需求  
✅ **完整错误处理** - 用户友好的错误提示  
✅ **性能优化建议** - 生产环境最佳实践  

你现有的后端已经具备了完整的路径计算功能，只需要按照前端实现部分添加地图显示功能即可。