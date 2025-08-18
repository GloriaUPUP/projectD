package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/delivery")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class DeliveryOptionsController {
    
    @PostMapping("/options")
    public ResponseEntity<Map<String, Object>> getDeliveryOptions(
            @RequestBody Map<String, Object> orderData) {
        
        List<Map<String, Object>> options = new ArrayList<>();
        
        // Robot delivery option
        Map<String, Object> robotOption = new HashMap<>();
        robotOption.put("id", "robot-1");
        robotOption.put("type", "robot");
        robotOption.put("name", "Ground Robot");
        robotOption.put("price", 8.99);
        robotOption.put("estimatedTime", "60-90 min");
        robotOption.put("available", 5);
        robotOption.put("description", "Autonomous ground robot delivery");
        options.add(robotOption);
        
        // Drone delivery option
        Map<String, Object> droneOption = new HashMap<>();
        droneOption.put("id", "drone-1");
        droneOption.put("type", "drone");
        droneOption.put("name", "Express Drone");
        droneOption.put("price", 15.99);
        droneOption.put("estimatedTime", "30-45 min");
        droneOption.put("available", 3);
        droneOption.put("weatherDependent", true);
        droneOption.put("description", "Fast aerial drone delivery");
        options.add(droneOption);
        
        // Standard delivery option
        Map<String, Object> standardOption = new HashMap<>();
        standardOption.put("id", "standard-1");
        standardOption.put("type", "standard");
        standardOption.put("name", "Standard Delivery");
        standardOption.put("price", 5.99);
        standardOption.put("estimatedTime", "2-3 hours");
        standardOption.put("available", 10);
        standardOption.put("description", "Traditional delivery service");
        options.add(standardOption);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", Map.of("options", options));
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations(
            @RequestBody Map<String, Object> orderData) {
        
        Map<String, Object> recommendations = new HashMap<>();
        
        // Analyze order data to provide recommendations
        Object packageInfo = orderData.get("packageInfo");
        boolean isFragile = false;
        boolean isUrgent = false;
        double weight = 5.0; // default weight
        
        if (packageInfo instanceof Map) {
            Map<String, Object> pkg = (Map<String, Object>) packageInfo;
            isFragile = "fragile".equals(pkg.get("type")) || "electronics".equals(pkg.get("type"));
            isUrgent = Boolean.TRUE.equals(pkg.get("urgent"));
            if (pkg.get("weight") != null) {
                weight = Double.parseDouble(pkg.get("weight").toString());
            }
        }
        
        // Generate recommendations based on package info
        List<Map<String, Object>> recommendedOptions = new ArrayList<>();
        
        if (isUrgent) {
            Map<String, Object> droneRec = new HashMap<>();
            droneRec.put("optionId", "drone-1");
            droneRec.put("type", "drone");
            droneRec.put("name", "Express Drone - Recommended for urgent delivery");
            droneRec.put("price", 15.99);
            droneRec.put("estimatedTime", "30-45 min");
            droneRec.put("reason", "Fastest delivery option for urgent packages");
            droneRec.put("score", 95);
            recommendedOptions.add(droneRec);
        }
        
        if (weight < 10 && !isFragile) {
            Map<String, Object> robotRec = new HashMap<>();
            robotRec.put("optionId", "robot-1");
            robotRec.put("type", "robot");
            robotRec.put("name", "Ground Robot - Best value");
            robotRec.put("price", 8.99);
            robotRec.put("estimatedTime", "60-90 min");
            robotRec.put("reason", "Cost-effective and reliable for standard packages");
            robotRec.put("score", 85);
            recommendedOptions.add(robotRec);
        }
        
        // Always include standard as fallback
        Map<String, Object> standardRec = new HashMap<>();
        standardRec.put("optionId", "standard-1");
        standardRec.put("type", "standard");
        standardRec.put("name", "Standard Delivery");
        standardRec.put("price", 5.99);
        standardRec.put("estimatedTime", "2-3 hours");
        standardRec.put("reason", "Most economical option");
        standardRec.put("score", 70);
        recommendedOptions.add(standardRec);
        
        recommendations.put("recommendations", recommendedOptions);
        recommendations.put("bestOption", recommendedOptions.isEmpty() ? "standard-1" : recommendedOptions.get(0).get("optionId"));
        recommendations.put("factors", Arrays.asList(
            "Package weight: " + weight + " kg",
            isFragile ? "Fragile handling required" : "Standard handling",
            isUrgent ? "Urgent delivery requested" : "Standard delivery timeframe"
        ));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendations);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateDeliveryOptions(
            @RequestBody Map<String, Object> orderData) {
        
        // Extract pickup and delivery addresses
        Map<String, Object> pickup = (Map<String, Object>) orderData.get("pickupInfo");
        Map<String, Object> delivery = (Map<String, Object>) orderData.get("deliveryInfo");
        Map<String, Object> packageInfo = (Map<String, Object>) orderData.get("packageInfo");
        
        // Calculate distance (mock calculation)
        double distance = 5.5; // km, mock value
        
        List<Map<String, Object>> calculatedOptions = new ArrayList<>();
        
        // Calculate robot option
        Map<String, Object> robotCalc = new HashMap<>();
        robotCalc.put("optionId", "robot-standard");
        robotCalc.put("type", "robot");
        robotCalc.put("name", "机器人配送");
        robotCalc.put("basePrice", 12.50);
        robotCalc.put("distanceFee", distance * 0.5);
        robotCalc.put("totalPrice", 12.50 + (distance * 0.5));
        robotCalc.put("estimatedTime", Math.round(distance * 4) + " 分钟");
        robotCalc.put("availableCount", 3);
        calculatedOptions.add(robotCalc);
        
        // Calculate drone option
        Map<String, Object> droneCalc = new HashMap<>();
        droneCalc.put("optionId", "drone-express");
        droneCalc.put("type", "drone");
        droneCalc.put("name", "无人机配送");
        droneCalc.put("basePrice", 18.00);
        droneCalc.put("distanceFee", distance * 0.8);
        droneCalc.put("totalPrice", 18.00 + (distance * 0.8));
        droneCalc.put("estimatedTime", Math.round(distance * 1.5) + " 分钟");
        droneCalc.put("availableCount", 2);
        droneCalc.put("weatherDependent", true);
        calculatedOptions.add(droneCalc);
        
        Map<String, Object> result = new HashMap<>();
        result.put("distance", distance);
        result.put("unit", "km");
        result.put("options", calculatedOptions);
        result.put("priceBreakdown", Map.of(
            "baseFee", "Based on service type",
            "distanceFee", "Calculated per km",
            "urgencyFee", "Applied for express delivery",
            "handlingFee", "Applied for fragile items"
        ));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result);
        
        return ResponseEntity.ok(response);
    }
}