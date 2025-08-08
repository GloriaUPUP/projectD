package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Mock Payment Controller for frontend interaction only
 * No real payment processing - just for UI/UX testing
 */
@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class MockPaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @GetMapping("/methods")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentMethods() {
        try {
            // Mock payment methods for frontend interaction
            Long userId = 1L; // Mock user ID
            Map<String, Object> paymentMethods = paymentService.getPaymentMethods(userId);
            return ResponseEntity.ok(ApiResponse.success(paymentMethods));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取支付方式失败", e.getMessage()));
        }
    }
    
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody Map<String, Object> paymentData) {
        try {
            // Mock payment processing - no real payment involved
            Map<String, Object> result = paymentService.processPayment(paymentData);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "支付处理失败", 
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "支付处理失败",
                "error", e.getMessage()
            ));
        }
    }
}