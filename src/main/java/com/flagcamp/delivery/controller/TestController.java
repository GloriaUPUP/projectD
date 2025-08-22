package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.service.DeliveryTrackingService;
import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/test")
@CrossOrigin(origins = "*")
public class TestController {
    
    @Autowired
    private DeliveryTrackingService deliveryTrackingService;
    
    /**
     * 创建测试订单并启动配送跟踪
     * POST /api/test/delivery?orderId=xxx&origin=xxx&destination=xxx&vehicleType=robot
     */
    @PostMapping("/delivery")
    public ResponseEntity<ApiResponse<String>> startTestDelivery(
            @RequestParam String orderId,
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "robot") String vehicleType) {
        
        try {
            deliveryTrackingService.startDeliveryTracking(orderId, origin, destination, vehicleType);
            
            return ResponseEntity.ok(
                ApiResponse.success("配送跟踪已启动", "订单 " + orderId + " 的GPS模拟已开始，使用 " + vehicleType + " 配送，时间将根据距离自动计算")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("启动配送跟踪失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 停止配送跟踪
     * DELETE /api/test/delivery/{orderId}
     */
    @DeleteMapping("/delivery/{orderId}")
    public ResponseEntity<ApiResponse<String>> stopDelivery(@PathVariable String orderId) {
        try {
            deliveryTrackingService.stopDeliveryTracking(orderId);
            
            return ResponseEntity.ok(
                ApiResponse.success("配送跟踪已停止", "订单 " + orderId + " 的跟踪已取消")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("停止配送跟踪失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 获取活动配送列表
     * GET /api/test/active-deliveries
     */
    @GetMapping("/active-deliveries")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveDeliveries() {
        try {
            var activeDeliveries = deliveryTrackingService.getActiveDeliveries();
            
            return ResponseEntity.ok(
                ApiResponse.success("获取活动配送列表成功", Map.of(
                    "count", activeDeliveries.size(),
                    "orders", activeDeliveries
                ))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("获取活动配送列表失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * 健康检查
     * GET /api/test/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(
            ApiResponse.success("服务正常", "后端服务运行正常，WebSocket已配置")
        );
    }
}