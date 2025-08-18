package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.model.GeoPoint;
import com.flagcamp.delivery.service.GeocodingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/geocoding")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006", "http://localhost:8081"})
public class GeocodingController {
    
    @Autowired
    private GeocodingService geocodingService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> geocodeAddress(
            @RequestParam String address) {
        try {
            GeoPoint point = geocodingService.getGeoPoint(address);
            Map<String, Object> addressDetails = geocodingService.getAddressDetails(address);
            
            Map<String, Object> result = new HashMap<>();
            result.put("lat", point.lat());
            result.put("lng", point.lng());
            result.put("formattedAddress", addressDetails.get("formattedAddress"));
            result.put("placeId", addressDetails.get("placeId"));
            result.put("streetNumber", addressDetails.get("streetNumber"));
            result.put("street", addressDetails.get("street"));
            result.put("city", addressDetails.get("city"));
            result.put("state", addressDetails.get("state"));
            result.put("zipCode", addressDetails.get("zipCode"));
            result.put("inServiceArea", geocodingService.isInServiceArea(address));
            
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to geocode address", e.getMessage()));
        }
    }
    
    @PostMapping("/route")
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
            String[] origins = (String[]) request.get("origins");
            String[] destinations = (String[]) request.get("destinations");
            
            if (origins == null || destinations == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Origins and destinations are required", null));
            }
            
            Map<String, Object> matrix = geocodingService.calculateDistanceMatrix(origins, destinations);
            return ResponseEntity.ok(ApiResponse.success(matrix));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to calculate distance matrix", e.getMessage()));
        }
    }
    
    @GetMapping("/validate-service-area")
    public ResponseEntity<ApiResponse<Boolean>> validateServiceArea(
            @RequestParam double lat,
            @RequestParam double lng) {
        try {
            // Extended service area including San Francisco, Daly City, and San Bruno (same as in GeocodingService)
            double SERVICE_SOUTH_LAT = 37.620;  // Covers San Bruno
            double SERVICE_NORTH_LAT = 37.810;  // Covers SF North
            double SERVICE_WEST_LNG = -122.520; // Covers Daly City West
            double SERVICE_EAST_LNG = -122.357; // Covers SF East
            
            boolean inServiceArea = lat >= SERVICE_SOUTH_LAT && lat <= SERVICE_NORTH_LAT &&
                                   lng >= SERVICE_WEST_LNG && lng <= SERVICE_EAST_LNG;
            return ResponseEntity.ok(ApiResponse.success(inServiceArea));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to validate service area", e.getMessage()));
        }
    }
}