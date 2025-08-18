package com.flagcamp.delivery.service;

import com.flagcamp.delivery.entity.Station;
import com.flagcamp.delivery.entity.Vehicle;
import com.flagcamp.delivery.entity.VehicleType;
import com.flagcamp.delivery.entity.VehicleStatus;
import com.flagcamp.delivery.entity.NewAddress;
import com.flagcamp.delivery.model.GeoPoint;
import com.flagcamp.delivery.repository.StationRepository;
import com.flagcamp.delivery.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DeliveryLocationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeliveryLocationService.class);
    
    @Autowired
    private StationRepository stationRepository;
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @Autowired
    private GeocodingService geocodingService;
    
    /**
     * Get all available stations with their locations
     */
    public List<Map<String, Object>> getAllStationsWithLocations() {
        List<Station> stations = stationRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        
        // If no stations exist, create mock data
        if (stations.isEmpty()) {
            result.add(createMockStation("Mission Bay Station", 
                "600 16th St, San Francisco, CA", 37.7677, -122.3958, 5, 3));
            result.add(createMockStation("Financial District Station", 
                "101 California St, San Francisco, CA", 37.7930, -122.3978, 8, 4));
            result.add(createMockStation("SOMA Station", 
                "350 2nd St, San Francisco, CA", 37.7855, -122.3967, 6, 2));
            return result;
        }
        
        // Convert real stations to response format
        for (Station station : stations) {
            Map<String, Object> stationInfo = new HashMap<>();
            stationInfo.put("id", station.getId());
            stationInfo.put("name", station.getName());
            stationInfo.put("availableRobots", station.getAvailableRobots());
            stationInfo.put("availableDrones", station.getAvailableDrones());
            
            // Get location from address if available
            if (station.getAddress() != null) {
                stationInfo.put("address", station.getAddress().getFormattedAddress());
                // Use stored lat/lng if available
                if (station.getAddress().getLatitude() != null && station.getAddress().getLongitude() != null) {
                    stationInfo.put("lat", station.getAddress().getLatitude().doubleValue());
                    stationInfo.put("lng", station.getAddress().getLongitude().doubleValue());
                } else {
                    // Fallback to geocoding
                    try {
                        GeoPoint point = geocodingService.getGeoPoint(station.getAddress().getFormattedAddress());
                        stationInfo.put("lat", point.lat());
                        stationInfo.put("lng", point.lng());
                    } catch (Exception e) {
                        logger.error("Failed to geocode station address", e);
                    }
                }
            }
            
            result.add(stationInfo);
        }
        
        return result;
    }
    
    /**
     * Get available vehicles near a location
     */
    public List<Map<String, Object>> getAvailableVehiclesNearLocation(double lat, double lng, double radiusKm) {
        List<Map<String, Object>> availableVehicles = new ArrayList<>();
        GeoPoint userLocation = new GeoPoint(lat, lng);
        
        // Get all idle vehicles
        List<Vehicle> vehicles = vehicleRepository.findByStatus(VehicleStatus.IDLE);
        
        // If no vehicles exist, create mock data
        if (vehicles.isEmpty()) {
            // Mock vehicles at different locations
            availableVehicles.add(createMockVehicle("ROBOT_001", VehicleType.ROBOT, 
                37.7677, -122.3958, VehicleStatus.IDLE));
            availableVehicles.add(createMockVehicle("DRONE_001", VehicleType.DRONE, 
                37.7930, -122.3978, VehicleStatus.IDLE));
            availableVehicles.add(createMockVehicle("ROBOT_002", VehicleType.ROBOT, 
                37.7855, -122.3967, VehicleStatus.IDLE));
            return availableVehicles;
        }
        
        // Filter vehicles by distance
        for (Vehicle vehicle : vehicles) {
            if (vehicle.getStation() != null && vehicle.getStation().getAddress() != null) {
                try {
                    GeoPoint vehicleLocation;
                    NewAddress address = vehicle.getStation().getAddress();
                    if (address.getLatitude() != null && address.getLongitude() != null) {
                        vehicleLocation = new GeoPoint(
                            address.getLatitude().doubleValue(),
                            address.getLongitude().doubleValue()
                        );
                    } else {
                        vehicleLocation = geocodingService.getGeoPoint(address.getFormattedAddress());
                    }
                    double distance = userLocation.distanceTo(vehicleLocation) / 1000; // Convert to km
                    
                    if (distance <= radiusKm) {
                        Map<String, Object> vehicleInfo = new HashMap<>();
                        vehicleInfo.put("id", vehicle.getId());
                        vehicleInfo.put("type", vehicle.getVehicleType());
                        vehicleInfo.put("status", vehicle.getStatus());
                        vehicleInfo.put("lat", vehicleLocation.lat());
                        vehicleInfo.put("lng", vehicleLocation.lng());
                        vehicleInfo.put("distance", distance);
                        vehicleInfo.put("stationId", vehicle.getStationId());
                        availableVehicles.add(vehicleInfo);
                    }
                } catch (Exception e) {
                    logger.error("Failed to process vehicle location", e);
                }
            }
        }
        
        // Sort by distance
        availableVehicles.sort((a, b) -> 
            Double.compare((Double) a.get("distance"), (Double) b.get("distance")));
        
        return availableVehicles;
    }
    
    /**
     * Get nearest station to a location
     */
    public Map<String, Object> getNearestStation(double lat, double lng) {
        List<Map<String, Object>> stations = getAllStationsWithLocations();
        GeoPoint userLocation = new GeoPoint(lat, lng);
        
        Map<String, Object> nearest = null;
        double minDistance = Double.MAX_VALUE;
        
        for (Map<String, Object> station : stations) {
            if (station.get("lat") != null && station.get("lng") != null) {
                GeoPoint stationLocation = new GeoPoint(
                    (Double) station.get("lat"),
                    (Double) station.get("lng")
                );
                double distance = userLocation.distanceTo(stationLocation);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = station;
                    nearest.put("distance", distance / 1000); // Convert to km
                }
            }
        }
        
        return nearest;
    }
    
    /**
     * Calculate delivery options based on pickup and delivery locations
     */
    public List<Map<String, Object>> calculateDeliveryOptions(String pickupAddress, String deliveryAddress) {
        List<Map<String, Object>> options = new ArrayList<>();
        
        try {
            // Get coordinates for both addresses
            GeoPoint pickupPoint = geocodingService.getGeoPoint(pickupAddress);
            GeoPoint deliveryPoint = geocodingService.getGeoPoint(deliveryAddress);
            
            // Calculate route
            Map<String, Object> route = geocodingService.calculateRoute(pickupAddress, deliveryAddress);
            double distanceMeters = ((Number) route.get("distanceValue")).doubleValue();
            double durationSeconds = ((Number) route.get("durationValue")).doubleValue();
            
            // Find nearest station to pickup
            Map<String, Object> nearestStation = getNearestStation(pickupPoint.lat(), pickupPoint.lng());
            
            // Calculate options for each vehicle type
            if (nearestStation != null) {
                // Robot option
                if ((Integer) nearestStation.get("availableRobots") > 0) {
                    Map<String, Object> robotOption = new HashMap<>();
                    robotOption.put("type", "ROBOT");
                    robotOption.put("name", "Ground Robot Delivery");
                    robotOption.put("estimatedTime", formatDuration(durationSeconds * 1.5)); // Robots are slower
                    robotOption.put("price", calculatePrice(distanceMeters, VehicleType.ROBOT));
                    robotOption.put("available", nearestStation.get("availableRobots"));
                    robotOption.put("stationName", nearestStation.get("name"));
                    robotOption.put("co2Saved", distanceMeters * 0.12); // grams of CO2 saved
                    options.add(robotOption);
                }
                
                // Drone option (if weather permits and distance is suitable)
                if ((Integer) nearestStation.get("availableDrones") > 0 && distanceMeters < 10000) {
                    Map<String, Object> droneOption = new HashMap<>();
                    droneOption.put("type", "DRONE");
                    droneOption.put("name", "Express Drone Delivery");
                    droneOption.put("estimatedTime", formatDuration(durationSeconds * 0.5)); // Drones are faster
                    droneOption.put("price", calculatePrice(distanceMeters, VehicleType.DRONE));
                    droneOption.put("available", nearestStation.get("availableDrones"));
                    droneOption.put("stationName", nearestStation.get("name"));
                    droneOption.put("weatherDependent", true);
                    droneOption.put("maxWeight", 2.5); // kg
                    droneOption.put("co2Saved", distanceMeters * 0.15);
                    options.add(droneOption);
                }
            }
            
            // Add route info to all options
            for (Map<String, Object> option : options) {
                option.put("distance", route.get("distance"));
                option.put("distanceValue", distanceMeters);
                option.put("polyline", route.get("polyline"));
            }
            
        } catch (Exception e) {
            logger.error("Failed to calculate delivery options", e);
            // Return default options on error
            options.add(createDefaultOption(VehicleType.ROBOT));
            options.add(createDefaultOption(VehicleType.DRONE));
        }
        
        return options;
    }
    
    private Map<String, Object> createMockStation(String name, String address, 
                                                   double lat, double lng, 
                                                   int robots, int drones) {
        Map<String, Object> station = new HashMap<>();
        station.put("id", UUID.randomUUID().toString());
        station.put("name", name);
        station.put("address", address);
        station.put("lat", lat);
        station.put("lng", lng);
        station.put("availableRobots", robots);
        station.put("availableDrones", drones);
        station.put("type", "station");
        return station;
    }
    
    private Map<String, Object> createMockVehicle(String id, VehicleType type, 
                                                   double lat, double lng, 
                                                   VehicleStatus status) {
        Map<String, Object> vehicle = new HashMap<>();
        vehicle.put("id", id);
        vehicle.put("type", type);
        vehicle.put("lat", lat);
        vehicle.put("lng", lng);
        vehicle.put("status", status);
        vehicle.put("batteryLevel", 75 + new Random().nextInt(25));
        vehicle.put("distance", 0.0);
        return vehicle;
    }
    
    private Map<String, Object> createDefaultOption(VehicleType type) {
        Map<String, Object> option = new HashMap<>();
        option.put("type", type.toString());
        option.put("name", type == VehicleType.ROBOT ? "Ground Robot" : "Express Drone");
        option.put("estimatedTime", type == VehicleType.ROBOT ? "45-60 min" : "20-30 min");
        option.put("price", type == VehicleType.ROBOT ? 12.50 : 18.00);
        option.put("available", 3);
        return option;
    }
    
    private double calculatePrice(double distanceMeters, VehicleType type) {
        double basePrice = type == VehicleType.ROBOT ? 8.0 : 12.0;
        double perKmPrice = type == VehicleType.ROBOT ? 2.0 : 3.0;
        double distanceKm = distanceMeters / 1000;
        return Math.round((basePrice + (distanceKm * perKmPrice)) * 100.0) / 100.0;
    }
    
    private String formatDuration(double seconds) {
        int minutes = (int) (seconds / 60);
        if (minutes < 60) {
            return minutes + " min";
        } else {
            int hours = minutes / 60;
            int remainingMinutes = minutes % 60;
            return hours + "h " + remainingMinutes + "min";
        }
    }
}