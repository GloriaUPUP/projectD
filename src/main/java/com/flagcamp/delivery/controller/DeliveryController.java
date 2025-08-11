package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.dto.order.CreateOrderRequest;
import com.flagcamp.delivery.entity.DeliveryOrder;
import com.flagcamp.delivery.service.OrderService;
import com.flagcamp.delivery.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class DeliveryController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            // In a real implementation, get current user from security context
            Long userId = 2L; // Mock user ID (using existing user)
            
            DeliveryOrder order = orderService.createOrder(request, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", "ORD" + order.getId());
            response.put("status", order.getStatus().toString().toLowerCase());
            response.put("createdAt", order.getCreatedAt());
            
            return ResponseEntity.ok(ApiResponse.success("订单创建成功", response));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("地址超出服务范围", "ADDRESS_OUT_OF_RANGE", 
                    Map.of("invalidAddress", "delivery")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("订单创建失败", e.getMessage()));
        }
    }
    
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrdersHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status) {
        try {
            // In a real implementation, get current user from security context
            Long userId = 2L; // Mock user ID (using existing user)
            
            Pageable pageable = PageRequest.of(page - 1, limit);
            Page<DeliveryOrder> ordersPage = orderService.getOrdersHistory(userId, status, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orders", orderService.convertToOrderSummaryList(ordersPage.getContent()));
            
            Map<String, Object> pagination = new HashMap<>();
            pagination.put("currentPage", page);
            pagination.put("totalPages", ordersPage.getTotalPages());
            pagination.put("totalItems", ordersPage.getTotalElements());
            pagination.put("limit", limit);
            response.put("pagination", pagination);
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取订单历史失败", e.getMessage()));
        }
    }
    
    @GetMapping("/{orderNumber}/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderDetails(@PathVariable String orderNumber) {
        try {
            DeliveryOrder order = orderService.findByOrderNumber(orderNumber);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> orderDetails = orderService.convertToOrderDetails(order);
            return ResponseEntity.ok(ApiResponse.success(orderDetails));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取订单详情失败", e.getMessage()));
        }
    }
    
    @GetMapping("/{orderNumber}/delivery-options")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeliveryOptions(@PathVariable String orderNumber) {
        try {
            DeliveryOrder order = orderService.findByOrderNumber(orderNumber);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            
            List<Map<String, Object>> availableOptions = orderService.getAvailableDeliveryOptions(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderNumber);
            response.put("availableOptions", availableOptions);
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取配送选项失败", e.getMessage()));
        }
    }
    
    @PutMapping("/{orderNumber}/select-option")
    public ResponseEntity<ApiResponse<Map<String, Object>>> selectDeliveryOption(
            @PathVariable String orderNumber, 
            @RequestBody Map<String, String> request) {
        try {
            String selectedOptionId = request.get("selectedOptionId");
            if (selectedOptionId == null || selectedOptionId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("配送选项ID不能为空", "MISSING_OPTION_ID"));
            }
            
            DeliveryOrder order = orderService.selectDeliveryOption(orderNumber, selectedOptionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", orderNumber);
            response.put("selectedOption", selectedOptionId);
            response.put("totalCost", 12.50); // Default cost for now
            response.put("status", order.getStatus().toString().toLowerCase());
            
            return ResponseEntity.ok(ApiResponse.success("配送方案已选择", response));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("无效的配送选项", "INVALID_OPTION"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("选择配送方案失败", e.getMessage()));
        }
    }
    
    @GetMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStatus(@PathVariable String orderNumber) {
        try {
            DeliveryOrder order = orderService.findByOrderNumber(orderNumber);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> statusInfo = orderService.getOrderStatusInfo(order);
            return ResponseEntity.ok(ApiResponse.success(statusInfo));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取订单状态失败", e.getMessage()));
        }
    }
    
    // Legacy endpoint for backward compatibility
    @PostMapping("/delivery/options")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLegacyDeliveryOptions(@RequestBody Map<String, Object> orderData) {
        try {
            List<Map<String, Object>> availableOptions = orderService.getStandardDeliveryOptions();
            
            Map<String, Object> response = new HashMap<>();
            response.put("options", availableOptions);
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取配送选项失败", e.getMessage()));
        }
    }
    
    @PostMapping("/delivery/recommendations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRecommendations(@RequestBody Map<String, Object> orderData) {
        try {
            List<Map<String, Object>> recommendations = orderService.getDeliveryRecommendations(orderData);
            return ResponseEntity.ok(ApiResponse.success(recommendations));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取推荐失败", e.getMessage()));
        }
    }
    
    @GetMapping("/tracking/{orderNumber}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrackingInfo(@PathVariable String orderNumber) {
        try {
            DeliveryOrder order = orderService.findByOrderNumber(orderNumber);
            if (order == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> trackingInfo = orderService.getTrackingInfo(order);
            return ResponseEntity.ok(ApiResponse.success(trackingInfo));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取跟踪信息失败", e.getMessage()));
        }
    }
}