package com.flagcamp.delivery.service;

import com.flagcamp.delivery.dto.order.CreateOrderRequest;
import com.flagcamp.delivery.entity.*;
import com.flagcamp.delivery.repository.OrderRepository;
import com.flagcamp.delivery.repository.OrderStatusHistoryRepository;
import com.flagcamp.delivery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderStatusHistoryRepository statusHistoryRepository;
    
    public Order createOrder(CreateOrderRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Order order = new Order();
        
        // Set pickup information
        order.setPickupAddress(request.getPickupInfo().getAddress());
        order.setPickupContactName(request.getPickupInfo().getContactName());
        order.setPickupContactPhone(request.getPickupInfo().getContactPhone());
        order.setPickupInstructions(request.getPickupInfo().getInstructions());
        
        // Set delivery information
        order.setDeliveryAddress(request.getDeliveryInfo().getAddress());
        order.setDeliveryContactName(request.getDeliveryInfo().getContactName());
        order.setDeliveryContactPhone(request.getDeliveryInfo().getContactPhone());
        order.setDeliveryInstructions(request.getDeliveryInfo().getInstructions());
        
        // Set package information
        order.setPackageWeight(request.getPackageInfo().getWeight());
        order.setPackageType(request.getPackageInfo().getType());
        order.setPackageValue(request.getPackageInfo().getValue());
        order.setPackageDescription(request.getPackageInfo().getDescription());
        
        // Set preferences
        if (request.getPreferences() != null) {
            order.setRequestedPickupTime(request.getPreferences().getPickupTime());
        }
        
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING_OPTIONS);
        
        order = orderRepository.save(order);
        
        // Create initial status history
        OrderStatusHistory statusHistory = new OrderStatusHistory(
            OrderStatus.PENDING_OPTIONS,
            "订单已创建",
            order
        );
        statusHistoryRepository.save(statusHistory);
        
        return order;
    }
    
    public Page<Order> getOrdersHistory(Long userId, String status, Pageable pageable) {
        OrderStatus orderStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                orderStatus = OrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        return orderRepository.findOrdersByUserAndStatus(userId, orderStatus, pageable);
    }
    
    public Order findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber).orElse(null);
    }
    
    public List<Map<String, Object>> convertToOrderSummaryList(List<Order> orders) {
        List<Map<String, Object>> summaryList = new ArrayList<>();
        
        for (Order order : orders) {
            Map<String, Object> summary = new HashMap<>();
            summary.put("orderId", order.getOrderNumber());
            summary.put("createdAt", order.getCreatedAt());
            summary.put("status", order.getStatus().toString().toLowerCase());
            
            Map<String, Object> pickup = new HashMap<>();
            pickup.put("address", order.getPickupAddress());
            pickup.put("time", order.getActualPickupTime() != null ? order.getActualPickupTime() : order.getCreatedAt());
            summary.put("pickup", pickup);
            
            Map<String, Object> delivery = new HashMap<>();
            delivery.put("address", order.getDeliveryAddress());
            delivery.put("time", order.getActualDeliveryTime() != null ? order.getActualDeliveryTime() : order.getCreatedAt());
            summary.put("delivery", delivery);
            
            summary.put("cost", order.getTotalCost() != null ? order.getTotalCost() : BigDecimal.ZERO);
            summary.put("deliveryMethod", order.getDeliveryType() != null ? order.getDeliveryType().toString().toLowerCase() : "pending");
            
            summaryList.add(summary);
        }
        
        return summaryList;
    }
    
    public Map<String, Object> convertToOrderDetails(Order order) {
        Map<String, Object> details = new HashMap<>();
        
        details.put("orderId", order.getOrderNumber());
        details.put("status", order.getStatus().toString().toLowerCase());
        details.put("createdAt", order.getCreatedAt());
        details.put("completedAt", order.getActualDeliveryTime());
        
        Map<String, Object> pickup = new HashMap<>();
        pickup.put("address", order.getPickupAddress());
        pickup.put("contactName", order.getPickupContactName());
        pickup.put("actualTime", order.getActualPickupTime());
        details.put("pickup", pickup);
        
        Map<String, Object> delivery = new HashMap<>();
        delivery.put("address", order.getDeliveryAddress());
        delivery.put("contactName", order.getDeliveryContactName());
        delivery.put("actualTime", order.getActualDeliveryTime());
        details.put("delivery", delivery);
        
        Map<String, Object> packageInfo = new HashMap<>();
        packageInfo.put("weight", order.getPackageWeight());
        packageInfo.put("type", order.getPackageType());
        packageInfo.put("value", order.getPackageValue());
        details.put("package", packageInfo);
        
        details.put("cost", order.getTotalCost());
        details.put("deliveryMethod", order.getDeliveryType() != null ? order.getDeliveryType().toString().toLowerCase() : null);
        
        if (order.getAssignedDeviceId() != null) {
            Map<String, Object> deviceUsed = new HashMap<>();
            deviceUsed.put("deviceId", order.getAssignedDeviceId());
            deviceUsed.put("name", "配送" + (order.getDeliveryType() == DeliveryType.ROBOT ? "机器人" : "无人机") + "#1");
            details.put("deviceUsed", deviceUsed);
        }
        
        return details;
    }
    
    public List<Map<String, Object>> getAvailableDeliveryOptions(Order order) {
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
    
    public Order selectDeliveryOption(String orderNumber, String selectedOptionId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        if (!order.getStatus().equals(OrderStatus.PENDING_OPTIONS)) {
            throw new IllegalArgumentException("Order is not in pending options state");
        }
        
        // Set delivery type and pricing based on selected option
        switch (selectedOptionId) {
            case "robot_standard":
                order.setDeliveryType(DeliveryType.ROBOT);
                order.setTotalCost(BigDecimal.valueOf(12.50));
                break;
            case "drone_express":
                order.setDeliveryType(DeliveryType.DRONE);
                order.setTotalCost(BigDecimal.valueOf(18.00));
                break;
            default:
                throw new IllegalArgumentException("Invalid delivery option");
        }
        
        order.setStatus(OrderStatus.AWAITING_PAYMENT);
        order = orderRepository.save(order);
        
        // Create status history
        OrderStatusHistory statusHistory = new OrderStatusHistory(
            OrderStatus.AWAITING_PAYMENT,
            "配送方案已选择，等待支付",
            order
        );
        statusHistoryRepository.save(statusHistory);
        
        return order;
    }
    
    public Map<String, Object> getOrderStatusInfo(Order order) {
        Map<String, Object> statusInfo = new HashMap<>();
        
        statusInfo.put("orderId", order.getOrderNumber());
        statusInfo.put("currentStatus", order.getStatus().toString().toLowerCase());
        
        // Get status history
        List<OrderStatusHistory> history = statusHistoryRepository.findByOrderIdOrderByTimestampAsc(order.getId());
        List<Map<String, Object>> statusHistory = new ArrayList<>();
        
        for (OrderStatusHistory historyItem : history) {
            Map<String, Object> historyMap = new HashMap<>();
            historyMap.put("status", historyItem.getStatus().toString().toLowerCase());
            historyMap.put("timestamp", historyItem.getTimestamp());
            historyMap.put("description", historyItem.getDescription());
            statusHistory.add(historyMap);
        }
        statusInfo.put("statusHistory", statusHistory);
        
        // Mock current location if in transit
        if (order.getStatus().equals(OrderStatus.IN_TRANSIT)) {
            Map<String, Object> currentLocation = new HashMap<>();
            currentLocation.put("lat", 37.7749);
            currentLocation.put("lng", -122.4194);
            currentLocation.put("address", "Market St & 5th St");
            statusInfo.put("currentLocation", currentLocation);
        }
        
        statusInfo.put("estimatedDelivery", order.getEstimatedDeliveryTime() != null ? 
            order.getEstimatedDeliveryTime() : LocalDateTime.now().plusHours(1));
        
        if (order.getAssignedDeviceId() != null) {
            Map<String, Object> assignedDevice = new HashMap<>();
            assignedDevice.put("deviceId", order.getAssignedDeviceId());
            assignedDevice.put("type", order.getDeliveryType().toString().toLowerCase());
            assignedDevice.put("name", "配送" + (order.getDeliveryType() == DeliveryType.ROBOT ? "机器人" : "无人机") + "#1");
            statusInfo.put("assignedDevice", assignedDevice);
        }
        
        return statusInfo;
    }
    
    public List<Map<String, Object>> getDeliveryRecommendations(Map<String, Object> orderData) {
        // Mock recommendations based on order data
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
        Map<String, Object> recommendation1 = new HashMap<>();
        recommendation1.put("type", "robot");
        recommendation1.put("reason", "最佳性价比选择");
        recommendation1.put("confidence", 0.9);
        recommendations.add(recommendation1);
        
        return recommendations;
    }
    
    public Map<String, Object> getTrackingInfo(Order order) {
        return getOrderStatusInfo(order); // For now, tracking info is same as status info
    }
}