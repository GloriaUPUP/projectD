package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/support")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class SupportController {
    
    @PostMapping("/tickets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitSupportRequest(@RequestBody Map<String, Object> requestData) {
        try {
            // Mock support ticket creation
            String ticketId = "TICKET_" + System.currentTimeMillis();
            
            Map<String, Object> ticket = new HashMap<>();
            ticket.put("ticketId", ticketId);
            ticket.put("status", "submitted");
            ticket.put("message", "Support request has been submitted successfully");
            
            return ResponseEntity.ok(ApiResponse.success("支持请求已提交", ticket));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("提交支持请求失败", e.getMessage()));
        }
    }
    
    @GetMapping("/faq")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFAQ() {
        try {
            List<Map<String, Object>> faqs = new ArrayList<>();
            
            Map<String, Object> faq1 = new HashMap<>();
            faq1.put("id", 1);
            faq1.put("question", "如何跟踪我的订单？");
            faq1.put("answer", "您可以使用订单号在跟踪页面查看实时配送状态。");
            faqs.add(faq1);
            
            Map<String, Object> faq2 = new HashMap<>();
            faq2.put("id", 2);
            faq2.put("question", "配送时间是多久？");
            faq2.put("answer", "机器人配送通常需要45分钟，无人机配送需要20分钟。");
            faqs.add(faq2);
            
            Map<String, Object> faq3 = new HashMap<>();
            faq3.put("id", 3);
            faq3.put("question", "如何修改配送地址？");
            faq3.put("answer", "您可以在个人资料页面管理您的地址信息。");
            faqs.add(faq3);
            
            return ResponseEntity.ok(ApiResponse.success(faqs));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取FAQ失败", e.getMessage()));
        }
    }
}