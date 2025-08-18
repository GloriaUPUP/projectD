package com.flagcamp.delivery.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.flagcamp.delivery.service.DeliveryTrackingService.LatLng;

import java.util.*;

@Service
public class RoadsAPIService {
    
    private static final Logger logger = LoggerFactory.getLogger(RoadsAPIService.class);
    
    @Value("${external-apis.google-maps.api-key}")
    private String apiKey;
    
    private final RestTemplate restTemplate;
    
    public RoadsAPIService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    /**
     * 使用 Roads API 将GPS坐标贴合到最近的道路
     * 让轨迹更加平滑和真实
     */
    public LatLng snapToRoads(double lat, double lng) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            // 如果没有API key，直接返回原坐标
            return new LatLng(lat, lng);
        }
        
        try {
            String url = "https://roads.googleapis.com/v1/snapToRoads";
            
            // 构建请求参数
            String path = lat + "," + lng;
            String fullUrl = url + "?path=" + path + "&interpolate=true&key=" + apiKey;
            
            // 发送请求
            ResponseEntity<Map> response = restTemplate.getForEntity(fullUrl, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return processSnapToRoadsResponse(response.getBody(), lat, lng);
            } else {
                logger.warn("Roads API returned non-200 status, using original coordinates");
                return new LatLng(lat, lng);
            }
            
        } catch (Exception e) {
            logger.warn("Roads API failed for coordinates ({}, {}): {}", lat, lng, e.getMessage());
            // 失败时返回原坐标
            return new LatLng(lat, lng);
        }
    }
    
    /**
     * 批量将多个GPS坐标贴合到道路
     * 适用于轨迹平滑处理
     */
    public List<LatLng> snapToRoadsBatch(List<LatLng> coordinates) {
        if (coordinates.isEmpty() || apiKey == null || apiKey.trim().isEmpty()) {
            return coordinates;
        }
        
        try {
            // Roads API 每次最多支持100个点
            if (coordinates.size() > 100) {
                return snapToRoadsInBatches(coordinates);
            }
            
            String url = "https://roads.googleapis.com/v1/snapToRoads";
            
            // 构建路径字符串
            StringBuilder pathBuilder = new StringBuilder();
            for (int i = 0; i < coordinates.size(); i++) {
                if (i > 0) pathBuilder.append("|");
                LatLng coord = coordinates.get(i);
                pathBuilder.append(coord.lat).append(",").append(coord.lng);
            }
            
            String fullUrl = url + "?path=" + pathBuilder.toString() + "&interpolate=true&key=" + apiKey;
            
            ResponseEntity<Map> response = restTemplate.getForEntity(fullUrl, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return processSnapToRoadsBatchResponse(response.getBody(), coordinates);
            } else {
                logger.warn("Roads API batch request failed, using original coordinates");
                return coordinates;
            }
            
        } catch (Exception e) {
            logger.warn("Roads API batch processing failed: {}", e.getMessage());
            return coordinates;
        }
    }
    
    /**
     * 处理单点 Snap to Roads 响应
     */
    @SuppressWarnings("unchecked")
    private LatLng processSnapToRoadsResponse(Map<String, Object> responseBody, double originalLat, double originalLng) {
        try {
            List<Map<String, Object>> snappedPoints = (List<Map<String, Object>>) responseBody.get("snappedPoints");
            
            if (snappedPoints != null && !snappedPoints.isEmpty()) {
                Map<String, Object> firstPoint = snappedPoints.get(0);
                Map<String, Object> location = (Map<String, Object>) firstPoint.get("location");
                
                if (location != null) {
                    Double latitude = (Double) location.get("latitude");
                    Double longitude = (Double) location.get("longitude");
                    
                    if (latitude != null && longitude != null) {
                        // 检查贴合后的坐标是否合理（距离原坐标不能太远）
                        double distance = calculateDistance(originalLat, originalLng, latitude, longitude);
                        if (distance < 500) { // 500米内认为是合理的
                            return new LatLng(latitude, longitude);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error processing snap to roads response: {}", e.getMessage());
        }
        
        // 如果处理失败或结果不合理，返回原坐标
        return new LatLng(originalLat, originalLng);
    }
    
    /**
     * 处理批量 Snap to Roads 响应
     */
    @SuppressWarnings("unchecked")
    private List<LatLng> processSnapToRoadsBatchResponse(Map<String, Object> responseBody, List<LatLng> originalCoordinates) {
        try {
            List<Map<String, Object>> snappedPoints = (List<Map<String, Object>>) responseBody.get("snappedPoints");
            
            if (snappedPoints != null && !snappedPoints.isEmpty()) {
                List<LatLng> result = new ArrayList<>();
                
                for (Map<String, Object> point : snappedPoints) {
                    Map<String, Object> location = (Map<String, Object>) point.get("location");
                    
                    if (location != null) {
                        Double latitude = (Double) location.get("latitude");
                        Double longitude = (Double) location.get("longitude");
                        
                        if (latitude != null && longitude != null) {
                            result.add(new LatLng(latitude, longitude));
                        }
                    }
                }
                
                if (!result.isEmpty()) {
                    return result;
                }
            }
        } catch (Exception e) {
            logger.warn("Error processing batch snap to roads response: {}", e.getMessage());
        }
        
        return originalCoordinates;
    }
    
    /**
     * 分批处理大量坐标
     */
    private List<LatLng> snapToRoadsInBatches(List<LatLng> coordinates) {
        List<LatLng> result = new ArrayList<>();
        int batchSize = 100;
        
        for (int i = 0; i < coordinates.size(); i += batchSize) {
            int end = Math.min(i + batchSize, coordinates.size());
            List<LatLng> batch = coordinates.subList(i, end);
            List<LatLng> snappedBatch = snapToRoadsBatch(batch);
            result.addAll(snappedBatch);
        }
        
        return result;
    }
    
    /**
     * 计算两点间距离（米）
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // 地球半径（公里）
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c * 1000; // 转换为米
    }
    
    /**
     * 检查 Roads API 是否可用
     */
    public boolean isRoadsAPIAvailable() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }
    
    /**
     * 智能轨迹平滑
     * 对GPS轨迹进行插值和道路贴合，生成更平滑的路径
     */
    public List<LatLng> smoothTrajectory(List<LatLng> rawGPSPoints) {
        if (rawGPSPoints.size() < 2) {
            return rawGPSPoints;
        }
        
        try {
            // 1. 首先进行简单的插值，增加点密度
            List<LatLng> interpolated = interpolatePoints(rawGPSPoints);
            
            // 2. 然后使用 Roads API 进行道路贴合
            List<LatLng> snapped = snapToRoadsBatch(interpolated);
            
            // 3. 最后进行轻微的平滑处理
            return smoothPath(snapped);
            
        } catch (Exception e) {
            logger.warn("Trajectory smoothing failed: {}", e.getMessage());
            return rawGPSPoints;
        }
    }
    
    /**
     * 在路径点之间插值
     */
    private List<LatLng> interpolatePoints(List<LatLng> points) {
        List<LatLng> result = new ArrayList<>();
        
        for (int i = 0; i < points.size() - 1; i++) {
            LatLng current = points.get(i);
            LatLng next = points.get(i + 1);
            
            result.add(current);
            
            // 如果两点间距离较大，插入中间点
            double distance = calculateDistance(current.lat, current.lng, next.lat, next.lng);
            if (distance > 100) { // 大于100米时插值
                int interpolationCount = Math.min((int) (distance / 50), 5); // 最多插5个点
                
                for (int j = 1; j <= interpolationCount; j++) {
                    double fraction = (double) j / (interpolationCount + 1);
                    double lat = current.lat + (next.lat - current.lat) * fraction;
                    double lng = current.lng + (next.lng - current.lng) * fraction;
                    result.add(new LatLng(lat, lng));
                }
            }
        }
        
        // 添加最后一个点
        result.add(points.get(points.size() - 1));
        
        return result;
    }
    
    /**
     * 路径平滑处理
     */
    private List<LatLng> smoothPath(List<LatLng> points) {
        if (points.size() < 3) {
            return points;
        }
        
        List<LatLng> smoothed = new ArrayList<>();
        smoothed.add(points.get(0)); // 保持第一个点
        
        // 使用简单的移动平均进行平滑
        for (int i = 1; i < points.size() - 1; i++) {
            LatLng prev = points.get(i - 1);
            LatLng current = points.get(i);
            LatLng next = points.get(i + 1);
            
            // 加权平均：当前点权重0.5，前后点各0.25
            double lat = prev.lat * 0.25 + current.lat * 0.5 + next.lat * 0.25;
            double lng = prev.lng * 0.25 + current.lng * 0.5 + next.lng * 0.25;
            
            smoothed.add(new LatLng(lat, lng));
        }
        
        smoothed.add(points.get(points.size() - 1)); // 保持最后一个点
        
        return smoothed;
    }
}