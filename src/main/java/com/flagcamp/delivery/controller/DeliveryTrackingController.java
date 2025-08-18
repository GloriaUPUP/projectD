package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.service.DeliveryTrackingService;
import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/tracking")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class DeliveryTrackingController {
    
    @Autowired
    private DeliveryTrackingService trackingService;
    
    /**
     * REST API: 开始配送跟踪
     * POST /api/tracking/start
     */
    @PostMapping("/start")
    @ResponseBody
    public ResponseEntity<ApiResponse<String>> startDeliveryTracking(@RequestBody Map<String, Object> request) {
        try {
            String orderId = (String) request.get("orderId");
            String origin = (String) request.get("origin");
            String destination = (String) request.get("destination");
            Integer durationMinutes = (Integer) request.getOrDefault("durationMinutes", 3); // 默认3分钟
            
            if (orderId == null || origin == null || destination == null) {
                return ResponseEntity.badRequest().body(
                    ApiResponse.error("缺少必要参数: orderId, origin, destination")
                );
            }
            
            trackingService.startDeliveryTracking(orderId, origin, destination, durationMinutes);
            
            return ResponseEntity.ok(
                ApiResponse.success("配送跟踪已开始", "订单 " + orderId + " 将在 " + durationMinutes + " 分钟内完成配送")
            );
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("启动配送跟踪失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * REST API: 停止配送跟踪
     * POST /api/tracking/stop/{orderId}
     */
    @PostMapping("/stop/{orderId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<String>> stopDeliveryTracking(@PathVariable String orderId) {
        try {
            trackingService.stopDeliveryTracking(orderId);
            return ResponseEntity.ok(
                ApiResponse.success("配送跟踪已停止", "订单 " + orderId)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("停止配送跟踪失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * REST API: 获取活动配送列表
     * GET /api/tracking/active
     */
    @GetMapping("/active")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<String>>> getActiveDeliveries() {
        try {
            List<String> activeDeliveries = trackingService.getActiveDeliveries();
            return ResponseEntity.ok(
                ApiResponse.success("获取活动配送列表成功", activeDeliveries)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                ApiResponse.error("获取活动配送列表失败: " + e.getMessage())
            );
        }
    }
    
    /**
     * WebSocket: 手动更新位置（用于测试）
     * 客户端发送到: /app/updateLocation/orderId
     */
    @MessageMapping("/updateLocation/{orderId}")
    @SendTo("/topic/delivery/{orderId}")
    public Map<String, Object> updateLocationManually(
            @DestinationVariable String orderId,
            @Payload Map<String, Object> locationData) {
        
        // 这里可以处理手动位置更新逻辑
        // 主要用于测试和调试
        
        return Map.of(
            "orderId", orderId,
            "status", "MANUAL_UPDATE",
            "message", "位置已手动更新",
            "timestamp", java.time.Instant.now().toString(),
            "currentLocation", locationData
        );
    }
    
    /**
     * WebSocket: 客户端连接事件
     */
    @MessageMapping("/connect")
    @SendTo("/topic/tracking")
    public Map<String, Object> handleConnect(@Payload Map<String, Object> connectData) {
        return Map.of(
            "status", "CONNECTED",
            "message", "WebSocket连接成功",
            "timestamp", java.time.Instant.now().toString(),
            "activeDeliveries", trackingService.getActiveDeliveries()
        );
    }
}