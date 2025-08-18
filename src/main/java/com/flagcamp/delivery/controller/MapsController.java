package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.model.GeoPoint;
import com.flagcamp.delivery.service.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/maps")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006", "http://localhost:8081"})
public class MapsController {
    
    @Autowired
    private GeocodingService geocodingService;
    
    @GetMapping("/geocode")
    public ResponseEntity<ApiResponse<Map<String, Object>>> geocodeAddress(
            @RequestParam String address) {
        try {
            Map<String, Object> details = geocodingService.getAddressDetails(address);
            return ResponseEntity.ok(ApiResponse.success(details));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to geocode address", e.getMessage()));
        }
    }
    
    @GetMapping("/validate-address")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateAddress(
            @RequestParam String address) {
        try {
            Map<String, Object> details = geocodingService.getAddressDetails(address);
            boolean inServiceArea = geocodingService.isInServiceArea(address);
            
            details.put("inServiceArea", inServiceArea);
            if (!inServiceArea) {
                details.put("message", "Address is outside our service area (San Francisco Bay Area)");
            }
            
            return ResponseEntity.ok(ApiResponse.success(details));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid address", e.getMessage()));
        }
    }
    
    @PostMapping("/calculate-route")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateRoute(
            @RequestBody Map<String, String> request) {
        try {
            String origin = request.get("origin");
            String destination = request.get("destination");
            
            if (origin == null || destination == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Origin and destination are required", null));
            }
            
            Map<String, Object> route = geocodingService.calculateRoute(origin, destination);
            return ResponseEntity.ok(ApiResponse.success(route));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate route", e.getMessage()));
        }
    }
    
    @PostMapping("/distance-matrix")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateDistanceMatrix(
            @RequestBody Map<String, Object> request) {
        try {
            String[] origins = ((java.util.List<String>) request.get("origins")).toArray(new String[0]);
            String[] destinations = ((java.util.List<String>) request.get("destinations")).toArray(new String[0]);
            
            Map<String, Object> matrix = geocodingService.calculateDistanceMatrix(origins, destinations);
            return ResponseEntity.ok(ApiResponse.success(matrix));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate distance matrix", e.getMessage()));
        }
    }
}