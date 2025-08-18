package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.service.GeocodingService;
import com.flagcamp.delivery.service.ModernRouteService;
import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/routes")
@CrossOrigin(origins = "*")
public class RouteController {
    
    private final GeocodingService geocodingService;
    private final ModernRouteService modernRouteService;
    
    @Autowired
    public RouteController(GeocodingService geocodingService, ModernRouteService modernRouteService) {
        this.geocodingService = geocodingService;
        this.modernRouteService = modernRouteService;
    }
    
    /**
     * 计算两点间路径
     * GET /api/routes/calculate?origin=地址1&destination=地址2
     */
    @GetMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateRoute(
            @RequestParam String origin,
            @RequestParam String destination) {
        
        try {
            // 优先使用新的 Routes API，失败时自动回退到 Legacy API
            Map<String, Object> routeInfo;
            
            if (modernRouteService.isRoutesAPIAvailable()) {
                routeInfo = modernRouteService.calculateRouteWithModernAPI(origin, destination);
            } else {
                routeInfo = geocodingService.calculateRoute(origin, destination);
            }
            
            return ResponseEntity.ok(
                ApiResponse.success("路径计算成功", routeInfo)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("路径计算失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 计算多点距离矩阵
     * POST /api/routes/distance-matrix
     */
    @PostMapping("/distance-matrix")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateDistanceMatrix(
            @RequestBody DistanceMatrixRequest request) {
        
        try {
            Map<String, Object> matrix = geocodingService.calculateDistanceMatrix(
                request.getOrigins(), 
                request.getDestinations()
            );
            
            return ResponseEntity.ok(
                ApiResponse.success("距离矩阵计算成功", matrix)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("距离矩阵计算失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 地址地理编码
     * GET /api/routes/geocode?address=地址
     */
    @GetMapping("/geocode")
    public ResponseEntity<ApiResponse<Map<String, Object>>> geocodeAddress(
            @RequestParam String address) {
        
        try {
            Map<String, Object> addressDetails = geocodingService.getAddressDetails(address);
            
            return ResponseEntity.ok(
                ApiResponse.success("地理编码成功", addressDetails)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("地理编码失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 验证地址是否在服务区域内
     * GET /api/routes/validate?address=地址
     */
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateAddress(
            @RequestParam String address) {
        
        try {
            boolean isValid = geocodingService.isInServiceArea(address);
            
            return ResponseEntity.ok(
                ApiResponse.success(
                    isValid ? "地址在服务区域内" : "地址不在服务区域内", 
                    isValid
                )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("地址验证失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 距离矩阵请求DTO
     */
    public static class DistanceMatrixRequest {
        private String[] origins;
        private String[] destinations;
        
        public String[] getOrigins() {
            return origins;
        }
        
        public void setOrigins(String[] origins) {
            this.origins = origins;
        }
        
        public String[] getDestinations() {
            return destinations;
        }
        
        public void setDestinations(String[] destinations) {
            this.destinations = destinations;
        }
    }
}