package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/tracking")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class TrackingController {
    
    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getTrackingInfo(
            @PathVariable String orderId) {
        
        Map<String, Object> tracking = new HashMap<>();
        tracking.put("orderId", orderId);
        tracking.put("status", "in_transit");
        
        // Current location (mock data for San Francisco area)
        Map<String, Object> currentLocation = new HashMap<>();
        currentLocation.put("lat", 37.7749 + (Math.random() * 0.01 - 0.005)); // Small random variation
        currentLocation.put("lng", -122.4194 + (Math.random() * 0.01 - 0.005));
        currentLocation.put("address", "Market St & 5th St, San Francisco, CA");
        currentLocation.put("heading", 45.0); // Direction in degrees
        currentLocation.put("speed", 15.5); // km/h
        tracking.put("currentLocation", currentLocation);
        
        // Pickup location
        Map<String, Object> pickupLocation = new HashMap<>();
        pickupLocation.put("lat", 37.7849);
        pickupLocation.put("lng", -122.4094);
        pickupLocation.put("address", "123 Pickup St, San Francisco, CA");
        tracking.put("pickupLocation", pickupLocation);
        
        // Delivery location
        Map<String, Object> deliveryLocation = new HashMap<>();
        deliveryLocation.put("lat", 37.7649);
        deliveryLocation.put("lng", -122.4294);
        deliveryLocation.put("address", "456 Delivery Ave, San Francisco, CA");
        tracking.put("deliveryLocation", deliveryLocation);
        
        // Route points (simplified path)
        List<Map<String, Object>> routePoints = new ArrayList<>();
        for (int i = 0; i <= 10; i++) {
            Map<String, Object> point = new HashMap<>();
            double progress = i / 10.0;
            point.put("lat", 37.7849 - (0.02 * progress));
            point.put("lng", -122.4094 - (0.02 * progress));
            routePoints.add(point);
        }
        tracking.put("routePoints", routePoints);
        
        // Calculate progress and ETA
        int progressPercent = 65; // Mock progress
        tracking.put("progress", progressPercent);
        tracking.put("estimatedArrival", new Date(System.currentTimeMillis() + 30 * 60 * 1000)); // 30 minutes from now
        tracking.put("remainingTime", "30 minutes");
        tracking.put("distanceRemaining", "2.3 km");
        
        // Delivery device info
        Map<String, Object> device = new HashMap<>();
        device.put("deviceId", "robot_r001");
        device.put("type", "robot");
        device.put("name", "Delivery Robot #001");
        device.put("batteryLevel", 78);
        device.put("status", "active");
        device.put("temperature", 23.5);
        tracking.put("device", device);
        
        // Status history
        List<Map<String, Object>> history = new ArrayList<>();
        
        Map<String, Object> status1 = new HashMap<>();
        status1.put("status", "created");
        status1.put("timestamp", new Date(System.currentTimeMillis() - 90 * 60 * 1000));
        status1.put("description", "Order created");
        status1.put("location", "System");
        history.add(status1);
        
        Map<String, Object> status2 = new HashMap<>();
        status2.put("status", "confirmed");
        status2.put("timestamp", new Date(System.currentTimeMillis() - 80 * 60 * 1000));
        status2.put("description", "Order confirmed and robot assigned");
        status2.put("location", "Distribution Center");
        history.add(status2);
        
        Map<String, Object> status3 = new HashMap<>();
        status3.put("status", "preparing");
        status3.put("timestamp", new Date(System.currentTimeMillis() - 70 * 60 * 1000));
        status3.put("description", "Package being prepared");
        status3.put("location", "123 Pickup St");
        history.add(status3);
        
        Map<String, Object> status4 = new HashMap<>();
        status4.put("status", "picked_up");
        status4.put("timestamp", new Date(System.currentTimeMillis() - 45 * 60 * 1000));
        status4.put("description", "Package picked up by robot");
        status4.put("location", "123 Pickup St");
        history.add(status4);
        
        Map<String, Object> status5 = new HashMap<>();
        status5.put("status", "in_transit");
        status5.put("timestamp", new Date(System.currentTimeMillis() - 30 * 60 * 1000));
        status5.put("description", "Package in transit to destination");
        status5.put("location", "En route");
        history.add(status5);
        
        tracking.put("statusHistory", history);
        
        // Package details
        Map<String, Object> packageInfo = new HashMap<>();
        packageInfo.put("packageId", "pkg_" + orderId);
        packageInfo.put("weight", 2.5);
        packageInfo.put("dimensions", "30x20x15 cm");
        packageInfo.put("type", "electronics");
        packageInfo.put("value", 150.00);
        packageInfo.put("description", "Electronic device");
        packageInfo.put("photo", null); // URL to package photo if available
        tracking.put("package", packageInfo);
        
        // Contact information
        Map<String, Object> contacts = new HashMap<>();
        contacts.put("sender", Map.of(
            "name", "John Sender",
            "phone", "+1234567890",
            "verified", true
        ));
        contacts.put("receiver", Map.of(
            "name", "Jane Receiver",
            "phone", "+0987654321",
            "verified", true
        ));
        tracking.put("contacts", contacts);
        
        // Live updates configuration
        Map<String, Object> liveUpdates = new HashMap<>();
        liveUpdates.put("enabled", true);
        liveUpdates.put("updateInterval", 10); // seconds
        liveUpdates.put("websocketUrl", "ws://localhost:8086/tracking/live/" + orderId);
        tracking.put("liveUpdates", liveUpdates);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tracking);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> getOrderStatus(
            @PathVariable String orderId) {
        
        Map<String, Object> status = new HashMap<>();
        status.put("orderId", orderId);
        status.put("currentStatus", "in_transit");
        status.put("statusCode", "IT");
        status.put("statusDescription", "Your package is on the way");
        status.put("lastUpdated", new Date());
        
        // Next expected status
        status.put("nextStatus", "out_for_delivery");
        status.put("nextStatusTime", new Date(System.currentTimeMillis() + 20 * 60 * 1000));
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", status);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{orderId}/update-location")
    public ResponseEntity<Map<String, Object>> updateLocation(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> locationData) {
        
        // This would typically update the location in database
        // For now, just acknowledge the update
        
        Map<String, Object> result = new HashMap<>();
        result.put("orderId", orderId);
        result.put("locationUpdated", true);
        result.put("timestamp", new Date());
        result.put("newLocation", locationData);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Location updated successfully");
        response.put("data", result);
        
        return ResponseEntity.ok(response);
    }
}