package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.service.DeliveryLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/locations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006", "http://localhost:8081"})
public class LocationController {
    
    @Autowired
    private DeliveryLocationService locationService;
    
    @GetMapping("/stations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllStations() {
        try {
            List<Map<String, Object>> stations = locationService.getAllStationsWithLocations();
            return ResponseEntity.ok(ApiResponse.success(stations));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get stations", e.getMessage()));
        }
    }
    
    @GetMapping("/vehicles/nearby")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNearbyVehicles(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius) {
        try {
            List<Map<String, Object>> vehicles = locationService.getAvailableVehiclesNearLocation(lat, lng, radius);
            return ResponseEntity.ok(ApiResponse.success(vehicles));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get nearby vehicles", e.getMessage()));
        }
    }
    
    @GetMapping("/stations/nearest")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNearestStation(
            @RequestParam double lat,
            @RequestParam double lng) {
        try {
            Map<String, Object> station = locationService.getNearestStation(lat, lng);
            if (station == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(ApiResponse.success(station));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get nearest station", e.getMessage()));
        }
    }
    
    @PostMapping("/delivery-options")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> calculateDeliveryOptions(
            @RequestBody Map<String, String> request) {
        try {
            String pickup = request.get("pickupAddress");
            String delivery = request.get("deliveryAddress");
            
            if (pickup == null || delivery == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Pickup and delivery addresses are required", null));
            }
            
            List<Map<String, Object>> options = locationService.calculateDeliveryOptions(pickup, delivery);
            return ResponseEntity.ok(ApiResponse.success(options));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate delivery options", e.getMessage()));
        }
    }
}