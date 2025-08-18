package com.flagcamp.delivery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class ModernRouteService {
    
    private static final Logger logger = LoggerFactory.getLogger(ModernRouteService.class);
    
    @Value("${external-apis.google-maps.api-key}")
    private String apiKey;
    
    private final RestTemplate restTemplate;
    private final GeocodingService fallbackService; // 备用Legacy服务
    
    public ModernRouteService(RestTemplate restTemplate, GeocodingService fallbackService) {
        this.restTemplate = restTemplate;
        this.fallbackService = fallbackService;
    }
    
    /**
     * 使用新的 Routes API (ComputeRoutes) 计算路径
     * 支持多条备选路径和交通信息
     */
    public Map<String, Object> calculateRouteWithModernAPI(String origin, String destination) {
        String url = "https://routes.googleapis.com/directions/v2:computeRoutes";
        
        try {
            // 构建 Routes API 请求体
            Map<String, Object> requestBody = buildRoutesAPIRequest(origin, destination);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Goog-Api-Key", apiKey);
            headers.set("X-Goog-FieldMask", 
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline," +
                "routes.legs.duration,routes.legs.distanceMeters,routes.legs.startLocation," +
                "routes.legs.endLocation,routes.description");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return processRoutesAPIResponse(response.getBody());
            } else {
                logger.warn("Routes API returned non-200 status, falling back to legacy");
                return fallbackService.calculateRoute(origin, destination);
            }
            
        } catch (Exception e) {
            logger.error("Routes API failed, falling back to legacy: {}", e.getMessage());
            return fallbackService.calculateRoute(origin, destination);
        }
    }
    
    private Map<String, Object> buildRoutesAPIRequest(String origin, String destination) {
        return Map.of(
            "origin", Map.of("address", origin),
            "destination", Map.of("address", destination),
            "travelMode", "DRIVE",
            "routingPreference", "TRAFFIC_AWARE",
            "computeAlternativeRoutes", true,
            "routeModifiers", Map.of(
                "avoidTolls", false,
                "avoidHighways", false,
                "avoidFerries", false
            ),
            "polylineQuality", "HIGH_QUALITY",
            "polylineEncoding", "ENCODED_POLYLINE",
            "units", "METRIC"
        );
    }
    
    @SuppressWarnings("unchecked")
    private Map<String, Object> processRoutesAPIResponse(Map<String, Object> responseBody) {
        Map<String, Object> result = new HashMap<>();
        
        List<Map<String, Object>> routes = (List<Map<String, Object>>) responseBody.get("routes");
        if (routes == null || routes.isEmpty()) {
            throw new RuntimeException("No routes found in response");
        }
        
        // 处理主路径
        Map<String, Object> mainRoute = routes.get(0);
        processMainRoute(result, mainRoute);
        
        // 处理备选路径
        if (routes.size() > 1) {
            List<Map<String, Object>> alternatives = new ArrayList<>();
            for (int i = 1; i < routes.size(); i++) {
                alternatives.add(processAlternativeRoute(routes.get(i)));
            }
            result.put("alternatives", alternatives);
        }
        
        result.put("routeCount", routes.size());
        result.put("apiVersion", "Routes_API_v2");
        
        return result;
    }
    
    @SuppressWarnings("unchecked")
    private void processMainRoute(Map<String, Object> result, Map<String, Object> route) {
        // 获取距离和时间
        Object distanceObj = route.get("distanceMeters");
        Object durationObj = route.get("duration");
        
        if (distanceObj != null) {
            int distanceMeters = (Integer) distanceObj;
            result.put("distanceValue", distanceMeters);
            result.put("distance", formatDistance(distanceMeters));
        }
        
        if (durationObj != null) {
            String duration = (String) durationObj;
            result.put("duration", formatDuration(duration));
            result.put("durationValue", parseDurationSeconds(duration));
        }
        
        // 获取polyline
        Map<String, Object> polylineInfo = (Map<String, Object>) route.get("polyline");
        if (polylineInfo != null) {
            String encodedPolyline = (String) polylineInfo.get("encodedPolyline");
            result.put("polyline", encodedPolyline);
        }
        
        // 获取起点终点坐标
        List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");
        if (legs != null && !legs.isEmpty()) {
            Map<String, Object> firstLeg = legs.get(0);
            Map<String, Object> startLocation = (Map<String, Object>) firstLeg.get("startLocation");
            Map<String, Object> endLocation = (Map<String, Object>) firstLeg.get("endLocation");
            
            if (startLocation != null) {
                result.put("startLocation", Map.of(
                    "lat", startLocation.get("latitude"),
                    "lng", startLocation.get("longitude")
                ));
            }
            
            if (endLocation != null) {
                result.put("endLocation", Map.of(
                    "lat", endLocation.get("latitude"),
                    "lng", endLocation.get("longitude")
                ));
            }
        }
        
        // 路径描述
        String description = (String) route.get("description");
        if (description != null) {
            result.put("summary", description);
        }
    }
    
    @SuppressWarnings("unchecked")
    private Map<String, Object> processAlternativeRoute(Map<String, Object> route) {
        Map<String, Object> alternative = new HashMap<>();
        
        // 处理备选路径的基本信息
        Object distanceObj = route.get("distanceMeters");
        Object durationObj = route.get("duration");
        Map<String, Object> polylineInfo = (Map<String, Object>) route.get("polyline");
        
        if (distanceObj != null) {
            int distanceMeters = (Integer) distanceObj;
            alternative.put("distance", formatDistance(distanceMeters));
            alternative.put("distanceValue", distanceMeters);
        }
        
        if (durationObj != null) {
            String duration = (String) durationObj;
            alternative.put("duration", formatDuration(duration));
            alternative.put("durationValue", parseDurationSeconds(duration));
        }
        
        if (polylineInfo != null) {
            alternative.put("polyline", polylineInfo.get("encodedPolyline"));
        }
        
        String description = (String) route.get("description");
        if (description != null) {
            alternative.put("summary", description);
        }
        
        return alternative;
    }
    
    private String formatDistance(int meters) {
        if (meters < 1000) {
            return meters + " m";
        } else {
            double km = meters / 1000.0;
            return String.format("%.1f km", km);
        }
    }
    
    private String formatDuration(String duration) {
        // duration 格式: "123s" 或 "123.456s"
        int seconds = parseDurationSeconds(duration);
        
        if (seconds < 60) {
            return seconds + " 秒";
        } else if (seconds < 3600) {
            int minutes = seconds / 60;
            return minutes + " 分钟";
        } else {
            int hours = seconds / 3600;
            int minutes = (seconds % 3600) / 60;
            return hours + " 小时 " + minutes + " 分钟";
        }
    }
    
    private int parseDurationSeconds(String duration) {
        // 解析 "123s" 或 "123.456s" 格式
        if (duration.endsWith("s")) {
            String numberPart = duration.substring(0, duration.length() - 1);
            return (int) Math.round(Double.parseDouble(numberPart));
        }
        return 0;
    }
    
    /**
     * 检查 Routes API 是否可用
     */
    public boolean isRoutesAPIAvailable() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }
}