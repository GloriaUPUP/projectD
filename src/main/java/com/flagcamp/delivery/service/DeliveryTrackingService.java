package com.flagcamp.delivery.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class DeliveryTrackingService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeliveryTrackingService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private GeocodingService geocodingService;
    
    @Autowired
    private RoadsAPIService roadsAPIService;
    
    // 存储活动的配送任务
    private final Map<String, DeliveryTask> activeDeliveries = new ConcurrentHashMap<>();
    
    // 执行GPS模拟的线程池
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    
    /**
     * 开始配送跟踪 - 启动GPS模拟器（基于固定速度计算时间）
     */
    public void startDeliveryTracking(String orderId, String origin, String destination, String vehicleType) {
        try {
            // 使用真实路径计算
            logger.info("开始计算路径: {} -> {}", origin, destination);
            Map<String, Object> routeInfo = calculateRealRoute(origin, destination);
            
            if (routeInfo == null || !routeInfo.containsKey("polyline") || routeInfo.get("polyline") == null || routeInfo.get("polyline").toString().isEmpty()) {
                // 如果真实路径计算失败或polyline为空，使用模拟路径
                logger.info("真实路径计算失败或polyline为空，切换到智能模拟路径");
                routeInfo = createMockRouteInfo(origin, destination);
                logger.info("模拟路径创建完成，polyline: {}", routeInfo.get("polyline"));
            } else {
                logger.info("使用真实路径计算结果");
                logger.info("真实路径数据: distanceValue={}, polyline长度={}", 
                    routeInfo.get("distanceValue"), 
                    routeInfo.get("polyline") != null ? routeInfo.get("polyline").toString().length() : "null");
            }
            
            // 获取距离和速度，计算配送时间
            Object distanceObj = routeInfo.getOrDefault("distanceValue", 8000);
            int distanceMeters;
            if (distanceObj instanceof Long) {
                distanceMeters = ((Long) distanceObj).intValue();
            } else if (distanceObj instanceof Integer) {
                distanceMeters = (Integer) distanceObj;
            } else {
                distanceMeters = 8000; // 默认值
            }
            double speedKmh = getVehicleSpeed(vehicleType);
            int durationMinutes = calculateDeliveryTime(distanceMeters, speedKmh);
            
            // 创建配送任务
            DeliveryTask task = new DeliveryTask();
            task.orderId = orderId;
            task.origin = origin;
            task.destination = destination;
            task.polyline = (String) routeInfo.get("polyline");
            task.startTime = Instant.now();
            task.durationMinutes = durationMinutes;
            task.totalDistance = distanceMeters;
            task.vehicleType = vehicleType;
            task.speedKmh = speedKmh;
            
            // 解码路径坐标
            List<LatLng> rawCoordinates = decodePolyline(task.polyline);
            
            // 使用 Roads API 平滑轨迹
            if (roadsAPIService.isRoadsAPIAvailable()) {
                task.routeCoordinates = roadsAPIService.smoothTrajectory(rawCoordinates);
                logger.info("使用 Roads API 平滑了 {} 个路径点", task.routeCoordinates.size());
            } else {
                task.routeCoordinates = rawCoordinates;
                logger.info("Roads API 不可用，使用原始路径点");
            }
            
            if (task.routeCoordinates.isEmpty()) {
                throw new RuntimeException("路径坐标解码失败");
            }
            
            activeDeliveries.put(orderId, task);
            
            // 发送配送开始事件
            sendTrackingUpdate(orderId, "DELIVERY_STARTED", task.routeCoordinates.get(0), 
                "配送已开始", formatETA(durationMinutes));
            
            // 启动GPS模拟器
            startGPSSimulator(task);
            
            logger.info("开始配送跟踪: 订单 {} - {} km, {} km/h, {} 分钟", 
                orderId, String.format("%.1f", distanceMeters/1000.0), speedKmh, durationMinutes);
            
        } catch (Exception e) {
            logger.error("启动配送跟踪失败: {}", e.getMessage());
            sendTrackingUpdate(orderId, "DELIVERY_FAILED", null, "配送启动失败: " + e.getMessage(), "");
        }
    }
    
    /**
     * GPS模拟器 - 模拟配送员沿路径移动
     */
    private void startGPSSimulator(DeliveryTask task) {
        int totalUpdates = task.durationMinutes * 2; // 每30秒更新一次
        int updateIntervalSeconds = (task.durationMinutes * 60) / totalUpdates;
        
        scheduler.scheduleAtFixedRate(() -> {
            try {
                if (!activeDeliveries.containsKey(task.orderId)) {
                    return; // 任务已取消
                }
                
                long elapsedSeconds = Instant.now().getEpochSecond() - task.startTime.getEpochSecond();
                long totalSeconds = task.durationMinutes * 60L;
                
                if (elapsedSeconds >= totalSeconds) {
                    // 配送完成
                    completeDelivery(task);
                    return;
                }
                
                // 计算当前位置
                double progress = (double) elapsedSeconds / totalSeconds;
                LatLng rawLocation = interpolateLocation(task.routeCoordinates, progress);
                
                // 使用 Roads API 进一步平滑当前位置（可选）
                LatLng currentLocation = roadsAPIService.snapToRoads(rawLocation.lat, rawLocation.lng);
                
                // 计算动态ETA
                String eta = calculateDynamicETA(task, currentLocation, elapsedSeconds, totalSeconds);
                
                // 发送位置更新
                sendTrackingUpdate(task.orderId, "LOCATION_UPDATE", currentLocation, 
                    "配送中", eta);
                
            } catch (Exception e) {
                logger.error("GPS模拟器错误: {}", e.getMessage());
            }
        }, updateIntervalSeconds, updateIntervalSeconds, TimeUnit.SECONDS);
    }
    
    /**
     * 完成配送
     */
    private void completeDelivery(DeliveryTask task) {
        LatLng finalLocation = task.routeCoordinates.get(task.routeCoordinates.size() - 1);
        
        sendTrackingUpdate(task.orderId, "DELIVERY_COMPLETED", finalLocation, 
            "配送已完成", "已送达");
        
        activeDeliveries.remove(task.orderId);
        logger.info("配送完成: 订单 {}", task.orderId);
    }
    
    /**
     * 沿路径插值计算当前位置
     */
    private LatLng interpolateLocation(List<LatLng> coordinates, double progress) {
        if (coordinates.isEmpty()) return new LatLng(0, 0);
        if (progress <= 0) return coordinates.get(0);
        if (progress >= 1) return coordinates.get(coordinates.size() - 1);
        
        double targetIndex = progress * (coordinates.size() - 1);
        int index = (int) targetIndex;
        double fraction = targetIndex - index;
        
        if (index >= coordinates.size() - 1) {
            return coordinates.get(coordinates.size() - 1);
        }
        
        LatLng start = coordinates.get(index);
        LatLng end = coordinates.get(index + 1);
        
        // 线性插值
        double lat = start.lat + (end.lat - start.lat) * fraction;
        double lng = start.lng + (end.lng - start.lng) * fraction;
        
        return new LatLng(lat, lng);
    }
    
    /**
     * 发送跟踪更新到前端
     */
    private void sendTrackingUpdate(String orderId, String status, LatLng location, String message, String eta) {
        Map<String, Object> update = new HashMap<>();
        update.put("orderId", orderId);
        update.put("status", status);
        update.put("message", message);
        update.put("eta", eta);
        update.put("timestamp", Instant.now().toString());
        
        if (location != null) {
            update.put("currentLocation", Map.of(
                "lat", location.lat,
                "lng", location.lng
            ));
        }
        
        // 发送到特定订单频道
        messagingTemplate.convertAndSend("/topic/delivery/" + orderId, update);
        
        // 也发送到通用跟踪频道
        messagingTemplate.convertAndSend("/topic/tracking", update);
        
        logger.debug("发送跟踪更新: {} - {}", orderId, status);
    }
    
    /**
     * 解码polyline（支持模拟格式）
     */
    private List<LatLng> decodePolyline(String encoded) {
        List<LatLng> coordinates = new ArrayList<>();
        
        try {
            logger.info("开始解码polyline，长度: {}, 前20字符: {}", 
                encoded.length(), 
                encoded.length() > 20 ? encoded.substring(0, 20) : encoded);
                
            // 检查是否是模拟格式（包含|分隔符）
            if (encoded.contains("|")) {
                // 解析模拟格式：lat1,lng1|lat2,lng2|...
                String[] points = encoded.split("\\|");
                for (String point : points) {
                    String[] coords = point.split(",");
                    if (coords.length == 2) {
                        double lat = Double.parseDouble(coords[0]);
                        double lng = Double.parseDouble(coords[1]);
                        coordinates.add(new LatLng(lat, lng));
                    }
                }
                logger.info("模拟格式解码成功，获得 {} 个坐标点", coordinates.size());
            } else {
                // 尝试使用Google Maps polyline解码
                try {
                    List<com.google.maps.model.LatLng> decoded = 
                        com.google.maps.internal.PolylineEncoding.decode(encoded);
                    
                    for (com.google.maps.model.LatLng point : decoded) {
                        coordinates.add(new LatLng(point.lat, point.lng));
                    }
                    logger.info("Google Maps polyline解码成功，获得 {} 个坐标点", coordinates.size());
                } catch (Exception e) {
                    logger.error("Google Maps polyline解码失败: {}, 尝试备用解码方案", e.getMessage());
                    
                    // 备用方案：生成SF到Daly City的智能路径
                    logger.info("使用备用路径生成算法");
                    
                    // SF到Daly City的典型路径坐标
                    double startLat = 37.7749; // SF起点
                    double startLng = -122.4194;
                    double endLat = 37.7049;   // Daly City终点  
                    double endLng = -122.4894;
                    
                    // 生成20个中间路径点（足够GPS模拟器使用）
                    int steps = 20;
                    for (int i = 0; i <= steps; i++) {
                        double progress = (double) i / steps;
                        double lat = startLat + (endLat - startLat) * progress;
                        double lng = startLng + (endLng - startLng) * progress;
                        
                        // 添加一些随机偏移来模拟真实道路
                        if (i > 0 && i < steps) {
                            lat += (Math.random() - 0.5) * 0.001;
                            lng += (Math.random() - 0.5) * 0.001;
                        }
                        
                        coordinates.add(new LatLng(lat, lng));
                    }
                    logger.info("使用智能备用路径，获得 {} 个坐标点", coordinates.size());
                }
            }
            
        } catch (Exception e) {
            logger.error("Polyline解码失败: {}", e.getMessage());
            // 使用默认坐标
            coordinates.add(new LatLng(37.7749, -122.4194)); // 起点
            coordinates.add(new LatLng(37.7849, -122.4094)); // 终点
        }
        
        return coordinates;
    }
    
    /**
     * 计算动态ETA - 基于当前位置和实际进度
     */
    private String calculateDynamicETA(DeliveryTask task, LatLng currentLocation, long elapsedSeconds, long totalSeconds) {
        try {
            // 1. 基础时间计算
            long remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
            
            // 2. 计算实际进度
            double actualProgress = calculateActualProgress(task.routeCoordinates, currentLocation);
            
            // 3. 估算剩余距离
            double remainingDistance = (1.0 - actualProgress) * task.totalDistance;
            
            // 4. 基于历史速度调整ETA
            double averageSpeed = calculateAverageSpeed(task, elapsedSeconds);
            
            // 5. 动态调整时间预测
            if (averageSpeed > 0 && remainingDistance > 0) {
                // 根据实际速度重新计算剩余时间
                double estimatedRemainingSeconds = remainingDistance / averageSpeed;
                
                // 与原计划时间进行平滑融合（避免大幅波动）
                double weight = Math.min(elapsedSeconds / 60.0, 0.7); // 最多70%权重给实际速度
                remainingSeconds = (long) ((1 - weight) * remainingSeconds + weight * estimatedRemainingSeconds);
            }
            
            // 6. 添加交通等因素的缓冲时间
            remainingSeconds = addTrafficBuffer(remainingSeconds, actualProgress);
            
            return formatETA((int) Math.max(0, remainingSeconds / 60));
            
        } catch (Exception e) {
            logger.warn("动态ETA计算失败，使用简单计算: {}", e.getMessage());
            long remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
            return formatETA((int) (remainingSeconds / 60));
        }
    }
    
    /**
     * 计算当前位置在路径上的实际进度
     */
    private double calculateActualProgress(List<LatLng> routeCoordinates, LatLng currentLocation) {
        if (routeCoordinates.isEmpty()) return 0.0;
        
        double minDistance = Double.MAX_VALUE;
        int closestIndex = 0;
        
        // 找到最接近当前位置的路径点
        for (int i = 0; i < routeCoordinates.size(); i++) {
            LatLng routePoint = routeCoordinates.get(i);
            double distance = calculateDistance(
                currentLocation.lat, currentLocation.lng,
                routePoint.lat, routePoint.lng
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        
        // 基于最接近点的索引计算进度
        return (double) closestIndex / (routeCoordinates.size() - 1);
    }
    
    /**
     * 计算平均速度（米/秒）
     */
    private double calculateAverageSpeed(DeliveryTask task, long elapsedSeconds) {
        if (elapsedSeconds <= 0) return 0.0;
        
        // 假设在指定时间内完成总距离
        return (double) task.totalDistance / (task.durationMinutes * 60.0);
    }
    
    /**
     * 添加交通缓冲时间
     */
    private long addTrafficBuffer(long remainingSeconds, double progress) {
        // 在路程的不同阶段添加不同的缓冲时间
        double bufferMultiplier = 1.0;
        
        if (progress < 0.3) {
            // 前30%路程：市区交通，添加20%缓冲
            bufferMultiplier = 1.2;
        } else if (progress < 0.7) {
            // 中间40%路程：主干道，添加10%缓冲
            bufferMultiplier = 1.1;
        } else {
            // 最后30%路程：接近目的地，添加15%缓冲
            bufferMultiplier = 1.15;
        }
        
        return (long) (remainingSeconds * bufferMultiplier);
    }
    
    /**
     * 计算两点间距离（米）
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371000; // 地球半径（米）
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * 格式化ETA时间
     */
    private String formatETA(int minutes) {
        if (minutes <= 0) {
            return "即将送达";
        } else if (minutes == 1) {
            return "1 分钟";
        } else if (minutes < 60) {
            return minutes + " 分钟";
        } else {
            int hours = minutes / 60;
            int remainingMinutes = minutes % 60;
            if (remainingMinutes == 0) {
                return hours + " 小时";
            } else {
                return hours + " 小时 " + remainingMinutes + " 分钟";
            }
        }
    }
    
    /**
     * 停止配送跟踪
     */
    public void stopDeliveryTracking(String orderId) {
        DeliveryTask task = activeDeliveries.remove(orderId);
        if (task != null) {
            sendTrackingUpdate(orderId, "DELIVERY_CANCELLED", null, "配送已取消", "");
            logger.info("配送跟踪已停止: 订单 {}", orderId);
        }
    }
    
    /**
     * 获取活动配送列表
     */
    public List<String> getActiveDeliveries() {
        return new ArrayList<>(activeDeliveries.keySet());
    }
    
    /**
     * 获取活跃配送的详细信息（包含当前位置）
     */
    public List<Map<String, Object>> getActiveDeliveriesWithDetails() {
        List<Map<String, Object>> deliveries = new ArrayList<>();
        
        for (Map.Entry<String, DeliveryTask> entry : activeDeliveries.entrySet()) {
            String orderId = entry.getKey();
            DeliveryTask task = entry.getValue();
            
            Map<String, Object> deliveryInfo = new HashMap<>();
            deliveryInfo.put("orderId", orderId);
            deliveryInfo.put("origin", task.origin);
            deliveryInfo.put("destination", task.destination);
            deliveryInfo.put("status", "in_transit");
            
            // 计算当前位置
            long elapsedSeconds = Instant.now().getEpochSecond() - task.startTime.getEpochSecond();
            long totalSeconds = task.durationMinutes * 60L;
            
            if (elapsedSeconds < totalSeconds && !task.routeCoordinates.isEmpty()) {
                double progress = Math.min(1.0, (double) elapsedSeconds / totalSeconds);
                LatLng currentLocation = interpolateLocation(task.routeCoordinates, progress);
                
                Map<String, Object> location = new HashMap<>();
                location.put("latitude", currentLocation.lat);
                location.put("longitude", currentLocation.lng);
                deliveryInfo.put("currentLocation", location);
                
                // 添加路径信息
                List<Map<String, Object>> routePoints = new ArrayList<>();
                for (LatLng coord : task.routeCoordinates) {
                    Map<String, Object> point = new HashMap<>();
                    point.put("latitude", coord.lat);
                    point.put("longitude", coord.lng);
                    routePoints.add(point);
                }
                deliveryInfo.put("route", routePoints);
                
                // 计算ETA
                String eta = calculateDynamicETA(task, currentLocation, elapsedSeconds, totalSeconds);
                deliveryInfo.put("eta", eta);
                deliveryInfo.put("progress", Math.round(progress * 100));
            }
            
            deliveries.add(deliveryInfo);
        }
        
        return deliveries;
    }
    
    /**
     * 配送任务数据结构
     */
    private static class DeliveryTask {
        String orderId;
        String origin;
        String destination;
        String polyline;
        List<LatLng> routeCoordinates;
        Instant startTime;
        int durationMinutes;
        int totalDistance;
        String vehicleType;
        double speedKmh;
    }
    
    /**
     * 使用真实路径计算服务
     */
    private Map<String, Object> calculateRealRoute(String origin, String destination) {
        try {
            // 尝试使用 ModernRouteService 或 GeocodingService
            if (geocodingService != null) {
                return geocodingService.calculateRoute(origin, destination);
            }
        } catch (Exception e) {
            logger.warn("真实路径计算失败: {}", e.getMessage());
        }
        return null;
    }
    
    /**
     * 获取车辆速度 (km/h) - 统一使用50km/h
     */
    private double getVehicleSpeed(String vehicleType) {
        // 用户要求：统一使用50km/h作为小车移动速度
        return 50.0; // 统一速度 50 km/h
        
        /* 原来的不同速度设置：
        switch (vehicleType.toLowerCase()) {
            case "robot":
                return 15.0; // 机器人速度 15 km/h
            case "drone":
                return 45.0; // 无人机速度 45 km/h
            default:
                return 20.0; // 默认速度
        }
        */
    }
    
    /**
     * 基于距离和速度计算配送时间
     */
    private int calculateDeliveryTime(int distanceMeters, double speedKmh) {
        // 距离转换为公里
        double distanceKm = distanceMeters / 1000.0;
        
        // 计算基础行驶时间（小时）
        double baseTimeHours = distanceKm / speedKmh;
        
        // 转换为分钟
        int baseTimeMinutes = (int) Math.ceil(baseTimeHours * 60);
        
        // 添加准备和配送时间缓冲（5-10分钟）
        int bufferMinutes = Math.max(5, Math.min(10, baseTimeMinutes / 10));
        
        // 最少15分钟，最多120分钟
        int totalMinutes = baseTimeMinutes + bufferMinutes;
        return Math.max(15, Math.min(120, totalMinutes));
    }
    
    /**
     * 创建模拟路径信息用于测试 - 根据地址智能计算距离
     */
    private Map<String, Object> createMockRouteInfo(String origin, String destination) {
        Map<String, Object> routeInfo = new HashMap<>();
        
        // 尝试从地址中提取地理信息来估算距离
        int estimatedDistance = estimateDistanceFromAddresses(origin, destination);
        
        // 根据估算距离生成模拟坐标路径
        List<LatLng> mockCoordinates = generateMockRoute(origin, destination, estimatedDistance);
        
        // 编码为模拟polyline
        String mockPolyline = encodeMockPolyline(mockCoordinates);
        
        routeInfo.put("polyline", mockPolyline);
        routeInfo.put("distanceValue", estimatedDistance);
        routeInfo.put("distance", formatDistance(estimatedDistance));
        routeInfo.put("mockCoordinates", mockCoordinates);
        
        logger.info("创建智能模拟路径: {} -> {}, 估算距离: {}m", 
            origin, destination, estimatedDistance);
        
        return routeInfo;
    }
    
    /**
     * 根据地址字符串智能估算距离
     */
    private int estimateDistanceFromAddresses(String origin, String destination) {
        // 基础距离（最小）
        int baseDistance = 2000; // 2km
        int maxDistance = 50000; // 50km
        
        // 地址模式匹配来估算距离
        String originLower = origin.toLowerCase();
        String destLower = destination.toLowerCase();
        
        // 计算相似性分数
        int similarityBonus = calculateAddressSimilarity(originLower, destLower);
        
        // 街道级别配送
        if (isSameStreet(originLower, destLower)) {
            return Math.max(500, baseDistance - similarityBonus); // 500m - 2km
        }
        
        // 同一区域
        if (isSameArea(originLower, destLower)) {
            return Math.max(2000, baseDistance + 1000 - similarityBonus); // 2-3km
        }
        
        // 同一城市
        if (isSameCity(originLower, destLower)) {
            return Math.max(3000, baseDistance + 3000 - similarityBonus); // 3-5km
        }
        
        // 不同城市但同一地区
        if (isSameRegion(originLower, destLower)) {
            return Math.max(8000, baseDistance + 8000 - similarityBonus); // 8-12km
        }
        
        // 计算地址字符串的差异度
        int addressDifference = Math.abs(origin.length() - destination.length());
        int estimatedDistance = baseDistance + (addressDifference * 100) + (int)(Math.random() * 5000);
        
        // 限制在合理范围内
        return Math.min(maxDistance, Math.max(baseDistance, estimatedDistance));
    }
    
    /**
     * 计算地址相似性（返回减少的距离）
     */
    private int calculateAddressSimilarity(String addr1, String addr2) {
        String[] words1 = addr1.split("\\s+");
        String[] words2 = addr2.split("\\s+");
        
        int commonWords = 0;
        for (String word1 : words1) {
            for (String word2 : words2) {
                if (word1.equals(word2) && word1.length() > 2) {
                    commonWords++;
                }
            }
        }
        
        return commonWords * 500; // 每个相同词减少500m
    }
    
    /**
     * 判断是否同一街道
     */
    private boolean isSameStreet(String addr1, String addr2) {
        // 提取街道名称进行比较
        return extractStreetName(addr1).equals(extractStreetName(addr2));
    }
    
    /**
     * 判断是否同一区域
     */
    private boolean isSameArea(String addr1, String addr2) {
        return addr1.contains("san francisco") && addr2.contains("san francisco") ||
               addr1.contains("palo alto") && addr2.contains("palo alto") ||
               addr1.contains("mountain view") && addr2.contains("mountain view") ||
               addr1.contains("sunnyvale") && addr2.contains("sunnyvale");
    }
    
    /**
     * 判断是否同一城市
     */
    private boolean isSameCity(String addr1, String addr2) {
        String[] cities = {"san francisco", "palo alto", "mountain view", "sunnyvale", 
                          "san jose", "redwood city", "menlo park"};
        
        for (String city : cities) {
            if (addr1.contains(city) && addr2.contains(city)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 判断是否同一地区（湾区）
     */
    private boolean isSameRegion(String addr1, String addr2) {
        String[] bayAreaIndicators = {"san francisco", "palo alto", "mountain view", 
                                     "sunnyvale", "san jose", "ca", "california"};
        
        boolean addr1InBayArea = false;
        boolean addr2InBayArea = false;
        
        for (String indicator : bayAreaIndicators) {
            if (addr1.contains(indicator)) addr1InBayArea = true;
            if (addr2.contains(indicator)) addr2InBayArea = true;
        }
        
        return addr1InBayArea && addr2InBayArea;
    }
    
    /**
     * 提取街道名称
     */
    private String extractStreetName(String address) {
        String[] parts = address.split(",")[0].trim().split("\\s+");
        if (parts.length > 1) {
            // 移除门牌号，保留街道名
            return String.join(" ", Arrays.copyOfRange(parts, 1, parts.length));
        }
        return address;
    }
    
    /**
     * 根据距离生成模拟路径
     */
    private List<LatLng> generateMockRoute(String origin, String destination, int distanceMeters) {
        List<LatLng> coordinates = new ArrayList<>();
        
        // 基础坐标（SF湾区）
        double startLat = 37.7749;
        double startLng = -122.4194;
        
        // 根据距离计算终点
        double distanceKm = distanceMeters / 1000.0;
        double latOffset = (distanceKm / 111.0) * (Math.random() * 0.8 + 0.6); // 111km per degree
        double lngOffset = (distanceKm / (111.0 * Math.cos(Math.toRadians(startLat)))) * (Math.random() * 0.8 + 0.6);
        
        // 随机方向
        if (Math.random() > 0.5) latOffset = -latOffset;
        if (Math.random() > 0.5) lngOffset = -lngOffset;
        
        double endLat = startLat + latOffset;
        double endLng = startLng + lngOffset;
        
        // 生成中间点（模拟真实路径的弯曲）
        int waypoints = Math.max(3, distanceMeters / 2000); // 每2km一个点
        
        for (int i = 0; i <= waypoints; i++) {
            double progress = (double) i / waypoints;
            
            // 线性插值 + 随机偏移（模拟真实道路）
            double lat = startLat + (endLat - startLat) * progress;
            double lng = startLng + (endLng - startLng) * progress;
            
            // 添加随机偏移（模拟道路弯曲）
            if (i > 0 && i < waypoints) {
                lat += (Math.random() - 0.5) * 0.002; // 最大200m偏移
                lng += (Math.random() - 0.5) * 0.002;
            }
            
            coordinates.add(new LatLng(lat, lng));
        }
        
        return coordinates;
    }
    
    /**
     * 格式化距离显示
     */
    private String formatDistance(int meters) {
        if (meters < 1000) {
            return meters + " m";
        } else {
            double km = meters / 1000.0;
            return String.format("%.1f km", km);
        }
    }
    
    /**
     * 简单的polyline编码（模拟版本）
     */
    private String encodeMockPolyline(List<LatLng> coordinates) {
        // 简化：直接返回坐标字符串，在decodePolyline中解析
        StringBuilder encoded = new StringBuilder();
        for (LatLng coord : coordinates) {
            if (encoded.length() > 0) encoded.append("|");
            encoded.append(coord.lat).append(",").append(coord.lng);
        }
        return encoded.toString();
    }
    
    /**
     * 经纬度坐标
     */
    public static class LatLng {
        public final double lat;
        public final double lng;
        
        public LatLng(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }
    }
}