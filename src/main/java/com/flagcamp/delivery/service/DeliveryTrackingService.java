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
     * 开始配送跟踪 - 启动GPS模拟器
     */
    public void startDeliveryTracking(String orderId, String origin, String destination, int durationMinutes) {
        try {
            // 使用模拟路径数据进行测试
            Map<String, Object> routeInfo = createMockRouteInfo(origin, destination, durationMinutes);
            
            if (routeInfo == null || !routeInfo.containsKey("polyline")) {
                throw new RuntimeException("无法计算路径");
            }
            
            // 创建配送任务
            DeliveryTask task = new DeliveryTask();
            task.orderId = orderId;
            task.origin = origin;
            task.destination = destination;
            task.polyline = (String) routeInfo.get("polyline");
            task.startTime = Instant.now();
            task.durationMinutes = durationMinutes;
            task.totalDistance = (Integer) routeInfo.getOrDefault("distanceValue", 1000);
            
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
            
            logger.info("开始配送跟踪: 订单 {} - {} 分钟", orderId, durationMinutes);
            
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
            } else {
                // 尝试使用Google Maps polyline解码
                List<com.google.maps.model.LatLng> decoded = 
                    com.google.maps.internal.PolylineEncoding.decode(encoded);
                
                for (com.google.maps.model.LatLng point : decoded) {
                    coordinates.add(new LatLng(point.lat, point.lng));
                }
            }
            
            logger.info("Polyline解码成功，获得 {} 个坐标点", coordinates.size());
            
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
    }
    
    /**
     * 创建模拟路径信息用于测试
     */
    private Map<String, Object> createMockRouteInfo(String origin, String destination, int durationMinutes) {
        Map<String, Object> routeInfo = new HashMap<>();
        
        // 模拟一些常见的路径
        List<LatLng> mockCoordinates = new ArrayList<>();
        
        // 根据起点终点创建不同的模拟路径
        if (origin.toLowerCase().contains("mountain view") && destination.toLowerCase().contains("palo alto")) {
            // Mountain View to Palo Alto 路径
            mockCoordinates.add(new LatLng(37.3861, -122.0839)); // Mountain View
            mockCoordinates.add(new LatLng(37.3900, -122.0850));
            mockCoordinates.add(new LatLng(37.3950, -122.0860));
            mockCoordinates.add(new LatLng(37.4000, -122.0870));
            mockCoordinates.add(new LatLng(37.4050, -122.0880));
            mockCoordinates.add(new LatLng(37.4100, -122.0890));
            mockCoordinates.add(new LatLng(37.4150, -122.0900));
            mockCoordinates.add(new LatLng(37.4200, -122.0910));
            mockCoordinates.add(new LatLng(37.4250, -122.0920));
            mockCoordinates.add(new LatLng(37.4419, -122.1430)); // Palo Alto
        } else {
            // 默认模拟路径 (San Francisco area)
            mockCoordinates.add(new LatLng(37.7749, -122.4194)); // 起点
            mockCoordinates.add(new LatLng(37.7849, -122.4094));
            mockCoordinates.add(new LatLng(37.7949, -122.3994));
            mockCoordinates.add(new LatLng(37.8049, -122.3894));
            mockCoordinates.add(new LatLng(37.8149, -122.3794));
            mockCoordinates.add(new LatLng(37.8249, -122.3694)); // 终点
        }
        
        // 编码为模拟polyline（简化版本）
        String mockPolyline = encodeMockPolyline(mockCoordinates);
        
        routeInfo.put("polyline", mockPolyline);
        routeInfo.put("distanceValue", 8000); // 8km
        routeInfo.put("distance", "8.0 km");
        routeInfo.put("duration", durationMinutes + " 分钟");
        routeInfo.put("durationValue", durationMinutes * 60);
        routeInfo.put("mockCoordinates", mockCoordinates); // 保存原始坐标用于解码
        
        logger.info("创建模拟路径数据: {} -> {}, 距离: 8km, 时长: {}分钟", origin, destination, durationMinutes);
        
        return routeInfo;
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