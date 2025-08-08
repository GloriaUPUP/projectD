package com.flagcamp.delivery.service;

import com.flagcamp.delivery.entity.*;
import com.flagcamp.delivery.repository.OrderRepository;
import com.flagcamp.delivery.repository.OrderStatusHistoryRepository;
import com.flagcamp.delivery.repository.PaymentMethodRepository;
import com.flagcamp.delivery.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PaymentService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private PaymentMethodRepository paymentMethodRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderStatusHistoryRepository statusHistoryRepository;
    
    public Map<String, Object> getPaymentMethods(Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        List<PaymentMethod> paymentMethods = paymentMethodRepository.findByUserIdAndIsActiveTrue(userId);
        
        List<Map<String, Object>> savedCards = new ArrayList<>();
        for (PaymentMethod method : paymentMethods) {
            if ("credit_card".equals(method.getType())) {
                Map<String, Object> card = new HashMap<>();
                card.put("methodId", "card_" + method.getId());
                card.put("last4", method.getLast4());
                card.put("brand", method.getBrand());
                card.put("isDefault", method.isDefault());
                savedCards.add(card);
            }
        }
        
        result.put("savedCards", savedCards);
        result.put("availableMethods", List.of("credit_card", "paypal", "apple_pay"));
        
        return result;
    }
    
    public Map<String, Object> processPayment(Map<String, Object> paymentData) {
        String orderNumber = (String) paymentData.get("orderId");
        String paymentMethod = (String) paymentData.get("paymentMethod");
        Map<String, Object> paymentInfo = (Map<String, Object>) paymentData.get("paymentInfo");
        Double amount = ((Number) paymentData.get("amount")).doubleValue();
        
        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (!order.getStatus().equals(OrderStatus.AWAITING_PAYMENT)) {
            throw new IllegalArgumentException("Order is not awaiting payment");
        }
        
        // Simulate payment processing with mock card decline
        if (paymentInfo != null && "4000000000000002".equals(paymentInfo.get("cardNumber"))) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "支付失败");
            errorResult.put("error", "CARD_DECLINED");
            errorResult.put("details", Map.of("reason", "insufficient_funds"));
            return errorResult;
        }
        
        // Create payment record
        Payment payment = new Payment();
        payment.setAmount(BigDecimal.valueOf(amount));
        payment.setPaymentMethod(PaymentMethodType.CREDIT_CARD);
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setProcessedAt(LocalDateTime.now());
        payment.setOrder(order);
        payment.setTransactionId("txn_" + System.currentTimeMillis());
        payment.setPaymentGateway("stripe");
        
        payment = paymentRepository.save(payment);
        
        // Update order status
        order.setStatus(OrderStatus.CONFIRMED);
        order.setAssignedDeviceId(order.getDeliveryType().toString().toLowerCase() + "_r001");
        order = orderRepository.save(order);
        
        // Create status history
        OrderStatusHistory statusHistory = new OrderStatusHistory(
            OrderStatus.CONFIRMED,
            "支付成功，订单已确认",
            order
        );
        statusHistoryRepository.save(statusHistory);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "支付成功");
        
        Map<String, Object> data = new HashMap<>();
        data.put("paymentId", payment.getPaymentId());
        data.put("orderId", orderNumber);
        data.put("amount", amount);
        data.put("status", "completed");
        data.put("transactionId", payment.getTransactionId());
        result.put("data", data);
        
        return result;
    }
    
    public Payment findByPaymentId(String paymentId) {
        return paymentRepository.findByPaymentId(paymentId).orElse(null);
    }
    
    public Payment findByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId).orElse(null);
    }
}