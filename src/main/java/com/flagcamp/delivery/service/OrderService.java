package com.flagcamp.delivery.service;

import com.flagcamp.delivery.dto.order.CreateOrderRequest;
import com.flagcamp.delivery.entity.*;
import com.flagcamp.delivery.repository.DeliveryOrderRepository;
import com.flagcamp.delivery.repository.UserRepository;
import com.flagcamp.delivery.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class OrderService {
    
    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AddressRepository addressRepository;
    
    public DeliveryOrder createOrder(CreateOrderRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Find or create pickup address
        Long pickupAddressId = findOrCreateAddress(
            request.getPickupInfo().getAddress(),
            request.getPickupInfo().getContactName(),
            userId
        );
        
        // Find or create delivery address  
        Long deliveryAddressId = findOrCreateAddress(
            request.getDeliveryInfo().getAddress(),
            request.getDeliveryInfo().getContactName(),
            userId
        );
        
        DeliveryOrder order = new DeliveryOrder();
        order.setUserId(userId);
        order.setPickupAddressId(pickupAddressId);
        order.setDropoffAddressId(deliveryAddressId);
        order.setItemDescription(request.getPackageInfo().getDescription());
        order.setItemWeightKg(BigDecimal.valueOf(request.getPackageInfo().getWeight()));
        order.setStatus(DeliveryOrderStatus.PENDING_PAYMENT);
        
        return deliveryOrderRepository.save(order);
    }
    
    private Long findOrCreateAddress(String addressText, String contactName, Long userId) {
        // Try to find existing address
        List<Address> existingAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        for (Address addr : existingAddresses) {
            if (addr.getAddress().contains(addressText.split(",")[0])) {
                return addr.getId();
            }
        }
        
        // Create new address if not found
        Address newAddress = new Address();
        newAddress.setLabel(contactName + "'s Address");
        newAddress.setAddress(addressText);
        newAddress.setCity("Default City");
        newAddress.setPostalCode("00000");
        newAddress.setPhone("0000000000");
        newAddress.setUser(userRepository.findById(userId).orElse(null));
        newAddress.setDefault(false);
        
        Address saved = addressRepository.save(newAddress);
        return saved.getId();
    }
    
    public Page<DeliveryOrder> getOrdersHistory(Long userId, String status, Pageable pageable) {
        DeliveryOrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                orderStatus = DeliveryOrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        if (orderStatus != null) {
            return deliveryOrderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, orderStatus, pageable);
        } else {
            return deliveryOrderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
    }
    
    public DeliveryOrder findByOrderNumber(String orderNumber) {
        // For DeliveryOrder, we'll use ID as order number
        try {
            Long orderId = Long.parseLong(orderNumber.replace("ORD", ""));
            return deliveryOrderRepository.findById(orderId).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public List<Map<String, Object>> convertToOrderSummaryList(List<DeliveryOrder> orders) {
        List<Map<String, Object>> summaryList = new ArrayList<>();
        
        for (DeliveryOrder order : orders) {
            Map<String, Object> summary = new HashMap<>();
            summary.put("orderId", "ORD" + order.getId());
            summary.put("createdAt", order.getCreatedAt());
            summary.put("status", order.getStatus().toString().toLowerCase());
            
            // Get pickup address
            Address pickupAddr = addressRepository.findById(order.getPickupAddressId()).orElse(null);
            Map<String, Object> pickup = new HashMap<>();
            pickup.put("address", pickupAddr != null ? pickupAddr.getAddress() : "Unknown");
            pickup.put("time", order.getCreatedAt());
            summary.put("pickup", pickup);
            
            // Get delivery address
            Address deliveryAddr = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
            Map<String, Object> delivery = new HashMap<>();
            delivery.put("address", deliveryAddr != null ? deliveryAddr.getAddress() : "Unknown");
            delivery.put("time", order.getCreatedAt());
            summary.put("delivery", delivery);
            
            summary.put("cost", BigDecimal.valueOf(12.50)); // Default cost
            summary.put("deliveryMethod", "robot"); // Default method
            
            summaryList.add(summary);
        }
        
        return summaryList;
    }
    
    public Map<String, Object> convertToOrderDetails(DeliveryOrder order) {
        Map<String, Object> details = new HashMap<>();
        
        details.put("orderId", "ORD" + order.getId());
        details.put("status", order.getStatus().toString().toLowerCase());
        details.put("createdAt", order.getCreatedAt());
        details.put("completedAt", null);
        
        // Get pickup address
        Address pickupAddr = addressRepository.findById(order.getPickupAddressId()).orElse(null);
        Map<String, Object> pickup = new HashMap<>();
        pickup.put("address", pickupAddr != null ? pickupAddr.getAddress() : "Unknown");
        pickup.put("contactName", pickupAddr != null ? pickupAddr.getLabel() : "Unknown");
        pickup.put("actualTime", null);
        details.put("pickup", pickup);
        
        // Get delivery address
        Address deliveryAddr = addressRepository.findById(order.getDropoffAddressId()).orElse(null);
        Map<String, Object> delivery = new HashMap<>();
        delivery.put("address", deliveryAddr != null ? deliveryAddr.getAddress() : "Unknown");
        delivery.put("contactName", deliveryAddr != null ? deliveryAddr.getLabel() : "Unknown");
        delivery.put("actualTime", null);
        details.put("delivery", delivery);
        
        Map<String, Object> packageInfo = new HashMap<>();
        packageInfo.put("weight", order.getItemWeightKg());
        packageInfo.put("type", "general");
        packageInfo.put("value", BigDecimal.valueOf(100));
        packageInfo.put("description", order.getItemDescription());
        details.put("package", packageInfo);
        
        details.put("cost", BigDecimal.valueOf(12.50));
        details.put("deliveryMethod", "robot");
        
        return details;
    }
    
    public List<Map<String, Object>> getAvailableDeliveryOptions(DeliveryOrder order) {
        return getStandardDeliveryOptions();
    }
    
    public List<Map<String, Object>> getStandardDeliveryOptions() {
        List<Map<String, Object>> options = new ArrayList<>();
        
        Map<String, Object> robotOption = new HashMap<>();
        robotOption.put("optionId", "robot_standard");
        robotOption.put("type", "robot");
        robotOption.put("name", "机器人配送");
        robotOption.put("price", 12.50);
        robotOption.put("estimatedTime", "45分钟");
        robotOption.put("description", "地面机器人配送，适合大部分物件");
        robotOption.put("availableCount", 3);
        options.add(robotOption);
        
        Map<String, Object> droneOption = new HashMap<>();
        droneOption.put("optionId", "drone_express");
        droneOption.put("type", "drone");
        droneOption.put("name", "无人机配送");
        droneOption.put("price", 18.00);
        droneOption.put("estimatedTime", "20分钟");
        droneOption.put("description", "空中无人机配送，快速直达");
        droneOption.put("availableCount", 2);
        droneOption.put("weatherDependent", true);
        options.add(droneOption);
        
        return options;
    }
    
    public DeliveryOrder selectDeliveryOption(String orderNumber, String selectedOptionId) {
        DeliveryOrder order = findByOrderNumber(orderNumber);
        if (order == null) {
            throw new IllegalArgumentException("Order not found");
        }
        
        if (!order.getStatus().equals(DeliveryOrderStatus.PENDING_PAYMENT)) {
            throw new IllegalArgumentException("Order is not in pending payment state");
        }
        
        // Update status to PAID (next step after selecting option)
        order.setStatus(DeliveryOrderStatus.PAID);
        return deliveryOrderRepository.save(order);
    }
    
    public Map<String, Object> getOrderStatusInfo(DeliveryOrder order) {
        Map<String, Object> statusInfo = new HashMap<>();
        
        statusInfo.put("orderId", "ORD" + order.getId());
        statusInfo.put("currentStatus", order.getStatus().toString().toLowerCase());
        
        // Mock status history
        List<Map<String, Object>> statusHistory = new ArrayList<>();
        Map<String, Object> historyItem = new HashMap<>();
        historyItem.put("status", "created");
        historyItem.put("timestamp", order.getCreatedAt());
        historyItem.put("description", "订单已创建");
        statusHistory.add(historyItem);
        statusInfo.put("statusHistory", statusHistory);
        
        statusInfo.put("estimatedDelivery", order.getCreatedAt().plusHours(1));
        
        return statusInfo;
    }
    
    public List<Map<String, Object>> getDeliveryRecommendations(Map<String, Object> orderData) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        Map<String, Object> recommendation = new HashMap<>();
        recommendation.put("type", "robot");
        recommendation.put("reason", "最佳性价比选择");
        recommendation.put("confidence", 0.9);
        recommendations.add(recommendation);
        
        return recommendations;
    }
    
    public Map<String, Object> getTrackingInfo(DeliveryOrder order) {
        return getOrderStatusInfo(order);
    }
}