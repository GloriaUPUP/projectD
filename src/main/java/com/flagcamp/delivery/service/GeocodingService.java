package com.flagcamp.delivery.service;

import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.DirectionsApi;
import com.google.maps.DistanceMatrixApi;
import com.google.maps.errors.ApiException;
import com.google.maps.model.*;
import com.flagcamp.delivery.model.GeoPoint;
import com.flagcamp.delivery.exception.InvalidAddressException;
import com.flagcamp.delivery.exception.GeocodingException;
import com.flagcamp.delivery.exception.OutsideServiceAreaException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeocodingService {
    
    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);
    
    // Extended service area including San Francisco, Daly City, and San Bruno
    private static final double SERVICE_SOUTH_LAT = 37.620;  // Covers San Bruno
    private static final double SERVICE_NORTH_LAT = 37.810;  // Covers SF North
    private static final double SERVICE_WEST_LNG = -122.520; // Covers Daly City West
    private static final double SERVICE_EAST_LNG = -122.357; // Covers SF East
    
    private final GeoApiContext context;
    
    @Autowired
    public GeocodingService(GeoApiContext context) {
        this.context = context;
    }
    
    /**
     * Convert address to geographic coordinates
     * Now enforces extended service area (SF, Daly City, San Bruno)
     */
    public GeoPoint getGeoPoint(String address) {
        try {
            GeocodingResult[] results = GeocodingApi.geocode(context, address).await();
            
            if (results.length == 0) {
                throw new InvalidAddressException("No results found for address: " + address);
            }
            
            GeocodingResult result = results[0];
            
            // Check if it's a partial match (fuzzy match)
            if (result.partialMatch) {
                logger.warn("Partial match detected for address: {} -> {}", address, result.formattedAddress);
                throw new InvalidAddressException("Address is not exact: " + address);
            }
            
            double lat = result.geometry.location.lat;
            double lng = result.geometry.location.lng;
            
            // Enforce extended service area restriction
            if (!isWithinServiceArea(lat, lng)) {
                logger.warn("Address outside service area: {} ({}, {})", address, lat, lng);
                throw new OutsideServiceAreaException("Address must be within service area (San Francisco, Daly City, or San Bruno)");
            }
            
            return new GeoPoint(lat, lng);
        } catch (IOException | ApiException | InterruptedException e) {
            logger.error("Geocoding failed for address: {}", address, e);
            throw new GeocodingException("Failed to geocode address: " + address);
        }
    }
    
    /**
     * Check if coordinates are within extended service area (SF, Daly City, San Bruno)
     */
    private boolean isWithinServiceArea(double lat, double lng) {
        return lat >= SERVICE_SOUTH_LAT && lat <= SERVICE_NORTH_LAT && 
               lng >= SERVICE_WEST_LNG && lng <= SERVICE_EAST_LNG;
    }
    
    /**
     * Get formatted address and coordinates
     */
    public Map<String, Object> getAddressDetails(String address) {
        try {
            GeocodingResult[] results = GeocodingApi.geocode(context, address).await();
            
            if (results.length == 0) {
                throw new InvalidAddressException("No results found for address: " + address);
            }
            
            GeocodingResult result = results[0];
            Map<String, Object> details = new HashMap<>();
            
            details.put("formattedAddress", result.formattedAddress);
            details.put("lat", result.geometry.location.lat);
            details.put("lng", result.geometry.location.lng);
            details.put("placeId", result.placeId);
            
            // Extract address components
            Map<String, String> components = new HashMap<>();
            for (AddressComponent component : result.addressComponents) {
                for (AddressComponentType type : component.types) {
                    if (type == AddressComponentType.STREET_NUMBER) {
                        components.put("streetNumber", component.longName);
                    } else if (type == AddressComponentType.ROUTE) {
                        components.put("street", component.longName);
                    } else if (type == AddressComponentType.LOCALITY) {
                        components.put("city", component.longName);
                    } else if (type == AddressComponentType.ADMINISTRATIVE_AREA_LEVEL_1) {
                        components.put("state", component.shortName);
                    } else if (type == AddressComponentType.POSTAL_CODE) {
                        components.put("zipCode", component.longName);
                    } else if (type == AddressComponentType.COUNTRY) {
                        components.put("country", component.longName);
                    }
                }
            }
            details.put("components", components);
            
            return details;
        } catch (IOException | ApiException | InterruptedException e) {
            logger.error("Failed to get address details for: {}", address, e);
            throw new GeocodingException("Failed to get address details");
        }
    }
    
    /**
     * Calculate route between two points
     */
    public Map<String, Object> calculateRoute(String origin, String destination) {
        try {
            DirectionsResult result = DirectionsApi.newRequest(context)
                .origin(origin)
                .destination(destination)
                .mode(TravelMode.DRIVING)
                .alternatives(true)
                .await();
            
            if (result.routes.length == 0) {
                throw new GeocodingException("No route found");
            }
            
            DirectionsRoute route = result.routes[0];
            Map<String, Object> routeInfo = new HashMap<>();
            
            // Basic route information
            DirectionsLeg leg = route.legs[0];
            routeInfo.put("distance", leg.distance.humanReadable);
            routeInfo.put("distanceValue", leg.distance.inMeters);
            routeInfo.put("duration", leg.duration.humanReadable);
            routeInfo.put("durationValue", leg.duration.inSeconds);
            routeInfo.put("startAddress", leg.startAddress);
            routeInfo.put("endAddress", leg.endAddress);
            
            // Start and end coordinates
            routeInfo.put("startLocation", Map.of(
                "lat", leg.startLocation.lat,
                "lng", leg.startLocation.lng
            ));
            routeInfo.put("endLocation", Map.of(
                "lat", leg.endLocation.lat,
                "lng", leg.endLocation.lng
            ));
            
            // Polyline for drawing the route
            routeInfo.put("polyline", route.overviewPolyline.getEncodedPath());
            
            // Steps for turn-by-turn navigation
            List<Map<String, Object>> steps = new ArrayList<>();
            for (DirectionsStep step : leg.steps) {
                Map<String, Object> stepInfo = new HashMap<>();
                stepInfo.put("instruction", step.htmlInstructions);
                stepInfo.put("distance", step.distance.humanReadable);
                stepInfo.put("duration", step.duration.humanReadable);
                stepInfo.put("startLocation", Map.of(
                    "lat", step.startLocation.lat,
                    "lng", step.startLocation.lng
                ));
                stepInfo.put("endLocation", Map.of(
                    "lat", step.endLocation.lat,
                    "lng", step.endLocation.lng
                ));
                steps.add(stepInfo);
            }
            routeInfo.put("steps", steps);
            
            // Alternative routes
            if (result.routes.length > 1) {
                List<Map<String, Object>> alternatives = new ArrayList<>();
                for (int i = 1; i < Math.min(result.routes.length, 3); i++) {
                    DirectionsRoute altRoute = result.routes[i];
                    Map<String, Object> altInfo = new HashMap<>();
                    altInfo.put("distance", altRoute.legs[0].distance.humanReadable);
                    altInfo.put("duration", altRoute.legs[0].duration.humanReadable);
                    altInfo.put("polyline", altRoute.overviewPolyline.getEncodedPath());
                    alternatives.add(altInfo);
                }
                routeInfo.put("alternatives", alternatives);
            }
            
            return routeInfo;
        } catch (IOException | ApiException | InterruptedException e) {
            logger.error("Failed to calculate route from {} to {}", origin, destination, e);
            throw new GeocodingException("Failed to calculate route");
        }
    }
    
    /**
     * Calculate distance matrix between multiple points
     */
    public Map<String, Object> calculateDistanceMatrix(String[] origins, String[] destinations) {
        try {
            DistanceMatrix matrix = DistanceMatrixApi.newRequest(context)
                .origins(origins)
                .destinations(destinations)
                .mode(TravelMode.DRIVING)
                .await();
            
            Map<String, Object> result = new HashMap<>();
            List<List<Map<String, Object>>> rows = new ArrayList<>();
            
            for (int i = 0; i < matrix.rows.length; i++) {
                List<Map<String, Object>> row = new ArrayList<>();
                for (int j = 0; j < matrix.rows[i].elements.length; j++) {
                    DistanceMatrixElement element = matrix.rows[i].elements[j];
                    Map<String, Object> elementInfo = new HashMap<>();
                    
                    if (element.status == DistanceMatrixElementStatus.OK) {
                        elementInfo.put("distance", element.distance.humanReadable);
                        elementInfo.put("distanceValue", element.distance.inMeters);
                        elementInfo.put("duration", element.duration.humanReadable);
                        elementInfo.put("durationValue", element.duration.inSeconds);
                        elementInfo.put("status", "OK");
                    } else {
                        elementInfo.put("status", element.status.toString());
                    }
                    
                    row.add(elementInfo);
                }
                rows.add(row);
            }
            
            result.put("rows", rows);
            result.put("originAddresses", matrix.originAddresses);
            result.put("destinationAddresses", matrix.destinationAddresses);
            
            return result;
        } catch (IOException | ApiException | InterruptedException e) {
            logger.error("Failed to calculate distance matrix", e);
            throw new GeocodingException("Failed to calculate distance matrix");
        }
    }
    
    /**
     * Validate if an address is within service area (SF, Daly City, San Bruno)
     */
    public boolean isInServiceArea(String address) {
        try {
            // Note: getGeoPoint now enforces extended service area boundaries, so if it succeeds, address is valid
            getGeoPoint(address);
            return true;
        } catch (OutsideServiceAreaException e) {
            logger.info("Address outside service area: {}", address);
            return false;
        } catch (Exception e) {
            logger.error("Failed to check service area for address: {}", address, e);
            return false;
        }
    }
}