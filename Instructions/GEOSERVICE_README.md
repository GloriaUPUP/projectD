# DeliveryApp Geoservice - San Francisco Area Restrictions

## Overview
The enhanced `GeocodingService` now enforces strict San Francisco city boundaries for all delivery addresses. This ensures the delivery service operates only within the supported area.

## Key Changes Made

### 1. San Francisco Boundary Enforcement
- **Strict boundaries**: Lat 37.708-37.810, Lng -122.515 to -122.357
- **New exception**: `OutsideServiceAreaException` thrown for addresses outside SF
- **Enhanced validation**: No partial address matches allowed

### 2. Enhanced getGeoPoint() Method
```java
// Now throws OutsideServiceAreaException for addresses outside SF
public GeoPoint getGeoPoint(String address) {
    // Geocode address
    // Validate exact match (no partialMatch allowed)  
    // Check SF boundaries
    // Throw OutsideServiceAreaException if outside bounds
}
```

### 3. Updated Service Area Validation
```java
// Updated to use SF-only boundaries
public boolean isInServiceArea(String address) {
    // Returns true only for SF addresses
}
```

## Frontend Integration

### Google Maps JavaScript API Setup
```javascript
// San Francisco bounds for map restriction
const SF_BOUNDS = {
  north: 37.810,
  south: 37.708,
  west: -122.515,
  east: -122.357,
};

// Initialize map with SF restriction
const map = new google.maps.Map(document.getElementById("map"), {
  zoom: 12,
  center: { lat: 37.7749, lng: -122.4194 },
  restriction: {
    latLngBounds: SF_BOUNDS,
    strictBounds: false,
  },
});
```

### Address Autocomplete with SF Restriction
```javascript
const autocomplete = new google.maps.places.Autocomplete(input, {
  bounds: SF_BOUNDS,
  strictBounds: true,
  componentRestrictions: { country: "us" },
  types: ['address']
});
```

### Route Display
```javascript
// Use the existing calculateRoute() method from GeocodingService
function displayRoute(origin, destination) {
  // Call your backend endpoint that uses GeocodingService.calculateRoute()
  fetch('/api/geocoding/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination })
  })
  .then(response => response.json())
  .then(data => {
    // data.polyline contains encoded path for Google Maps
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    // Decode and display the polyline
  });
}
```

## API Endpoints Usage

### Address Validation
```java
@PostMapping("/validate-address")
public ResponseEntity<?> validateAddress(@RequestBody AddressRequest request) {
    try {
        GeoPoint point = geocodingService.getGeoPoint(request.getAddress());
        return ResponseEntity.ok(new ApiResponse(true, "Address valid", point));
    } catch (OutsideServiceAreaException e) {
        return ResponseEntity.badRequest()
            .body(new ApiResponse(false, "Address outside San Francisco service area"));
    } catch (InvalidAddressException e) {
        return ResponseEntity.badRequest()
            .body(new ApiResponse(false, "Invalid or ambiguous address"));
    }
}
```

### Route Calculation
```java
@PostMapping("/calculate-route")
public ResponseEntity<?> calculateRoute(@RequestBody RouteRequest request) {
    try {
        Map<String, Object> route = geocodingService.calculateRoute(
            request.getOrigin(), 
            request.getDest ination()
        );
        return ResponseEntity.ok(route);
    } catch (OutsideServiceAreaException e) {
        return ResponseEntity.badRequest()
            .body(new ApiResponse(false, "One or both addresses outside service area"));
    }
}
```

## Error Handling

The service now throws three types of exceptions:

1. **OutsideServiceAreaException**: Address is outside San Francisco bounds
2. **InvalidAddressException**: Address is ambiguous or invalid  
3. **GeocodingException**: Google Maps API failure

## Configuration

Make sure your `application.properties` includes:
```properties
google.maps.api.key=YOUR_API_KEY
```

And your `GoogleMapsConfig` bean is properly configured:
```java
@Bean
public GeoApiContext geoApiContext() {
    return new GeoApiContext.Builder()
        .apiKey(apiKey)
        .build();
}
```

## San Francisco Bounds Reference

The service restricts addresses to these approximate bounds:
- **North**: 37.810° (Richmond District)
- **South**: 37.708° (Visitacion Valley)  
- **West**: -122.515° (Ocean Beach)
- **East**: -122.357° (Treasure Island area)

These bounds cover San Francisco proper, excluding distant areas like the Farallon Islands.

## Existing Features Preserved

All existing functionality remains intact:
- ✅ `getAddressDetails()` - Get formatted address with components
- ✅ `calculateRoute()` - Full route calculation with alternatives
- ✅ `calculateDistanceMatrix()` - Distance matrix for multiple points
- ✅ Comprehensive logging and error handling
- ✅ Turn-by-turn navigation steps
- ✅ Polyline encoding for map display

## Testing

Test with these SF addresses:
- ✅ Valid: "123 Market St, San Francisco, CA"
- ✅ Valid: "Golden Gate Bridge, San Francisco, CA" 
- ❌ Invalid: "123 Main St, Oakland, CA" (outside bounds)
- ❌ Invalid: "Farallon Islands" (outside bounds)