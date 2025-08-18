package com.flagcamp.delivery.model;

public record GeoPoint(
    double lat,
    double lng
) {
    // Validate coordinates
    public GeoPoint {
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Invalid latitude: " + lat);
        }
        if (lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Invalid longitude: " + lng);
        }
    }
    
    // Calculate distance between two points using Haversine formula (in meters)
    public double distanceTo(GeoPoint other) {
        double earthRadius = 6371000; // meters
        double dLat = Math.toRadians(other.lat - this.lat);
        double dLng = Math.toRadians(other.lng - this.lng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(this.lat)) * Math.cos(Math.toRadians(other.lat)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
}