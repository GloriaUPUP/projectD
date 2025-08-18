package com.flagcamp.delivery.service;

import com.flagcamp.delivery.dto.address.AddressRequest;
import com.flagcamp.delivery.entity.Address;
import com.flagcamp.delivery.entity.User;
import com.flagcamp.delivery.repository.AddressRepository;
import com.flagcamp.delivery.repository.UserRepository;
import com.flagcamp.delivery.service.GeocodingService;
import com.flagcamp.delivery.model.GeoPoint;
import com.flagcamp.delivery.exception.OutsideServiceAreaException;
import com.flagcamp.delivery.exception.InvalidAddressException;
import com.google.maps.GeoApiContext;
import com.google.maps.PlacesApi;
import com.google.maps.model.AutocompletePrediction;
import com.google.maps.model.LatLng;
import com.google.maps.model.PlaceAutocompleteType;
import com.google.maps.errors.ApiException;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AddressService {
    
    @Autowired
    private AddressRepository addressRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GeocodingService geocodingService;
    
    @Autowired
    private GeoApiContext geoApiContext;
    
    public List<Address> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
    }
    
    public Address getAddressById(Long addressId) {
        return addressRepository.findById(addressId).orElse(null);
    }
    
    public Address addAddress(AddressRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        // Validate address is within San Francisco using GeocodingService
        String fullAddress = buildFullAddress(request);
        try {
            geocodingService.getGeoPoint(fullAddress); // This will throw exception if outside SF
        } catch (OutsideServiceAreaException e) {
            throw new IllegalArgumentException("Address must be within San Francisco city limits");
        } catch (InvalidAddressException e) {
            throw new IllegalArgumentException("Invalid or ambiguous address provided");
        }
        
        Address address = new Address();
        address.setLabel(request.getLabel());
        address.setAddress(request.getAddress());
        address.setCity(request.getCity());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry() != null ? request.getCountry() : "United States");
        address.setPhone(request.getPhone());
        address.setUser(user);
        
        // If this is the user's first address, make it default
        List<Address> existingAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        if (existingAddresses.isEmpty() || request.isDefault()) {
            // If setting as default, unset other default addresses
            if (request.isDefault()) {
                existingAddresses.stream()
                    .filter(Address::isDefault)
                    .forEach(addr -> {
                        addr.setDefault(false);
                        addressRepository.save(addr);
                    });
            }
            address.setDefault(existingAddresses.isEmpty() || request.isDefault());
        }
        
        return addressRepository.save(address);
    }
    
    public Address updateAddress(Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        
        // Validate updated address is within San Francisco using GeocodingService
        String fullAddress = buildFullAddress(request);
        try {
            geocodingService.getGeoPoint(fullAddress); // This will throw exception if outside SF
        } catch (OutsideServiceAreaException e) {
            throw new IllegalArgumentException("Address must be within San Francisco city limits");
        } catch (InvalidAddressException e) {
            throw new IllegalArgumentException("Invalid or ambiguous address provided");
        }
        
        address.setLabel(request.getLabel());
        address.setAddress(request.getAddress());
        address.setCity(request.getCity());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry() != null ? request.getCountry() : address.getCountry());
        address.setPhone(request.getPhone());
        
        // Handle default address change
        if (request.isDefault() && !address.isDefault()) {
            // Unset other default addresses for this user
            List<Address> userAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(address.getUser().getId());
            userAddresses.stream()
                .filter(Address::isDefault)
                .forEach(addr -> {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                });
            
            address.setDefault(true);
        }
        
        return addressRepository.save(address);
    }
    
    public boolean deleteAddress(Long addressId) {
        Address address = addressRepository.findById(addressId).orElse(null);
        if (address == null) {
            return false;
        }
        
        // If deleting the default address, set another one as default
        if (address.isDefault()) {
            List<Address> userAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(address.getUser().getId());
            userAddresses.stream()
                .filter(addr -> !addr.getId().equals(addressId))
                .findFirst()
                .ifPresent(addr -> {
                    addr.setDefault(true);
                    addressRepository.save(addr);
                });
        }
        
        addressRepository.delete(address);
        return true;
    }
    
    public Address setDefaultAddress(Long addressId, Long userId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        
        // Unset other default addresses for this user
        List<Address> userAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        userAddresses.stream()
            .filter(Address::isDefault)
            .forEach(addr -> {
                addr.setDefault(false);
                addressRepository.save(addr);
            });
        
        // Set this address as default
        address.setDefault(true);
        return addressRepository.save(address);
    }
    
    public Map<String, Object> validateAddress(Map<String, String> addressData) {
        try {
            // Use actual geocoding service to validate the address
            String fullAddress = buildFullAddressFromMap(addressData);
            GeoPoint geoPoint = geocodingService.getGeoPoint(fullAddress);
            
            Map<String, Object> result = new HashMap<>();
            result.put("isValid", true);
            result.put("lat", geoPoint.lat());
            result.put("lng", geoPoint.lng());
            result.put("suggestion", null);
            
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("address", addressData.get("address"));
            formatted.put("city", addressData.get("city"));
            formatted.put("postalCode", addressData.get("postalCode"));
            result.put("formatted", formatted);
            
            return result;
        } catch (OutsideServiceAreaException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("isValid", false);
            result.put("error", "Address must be within San Francisco city limits");
            return result;
        } catch (InvalidAddressException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("isValid", false);
            result.put("error", "Invalid or ambiguous address provided");
            return result;
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("isValid", false);
            result.put("error", "Address validation failed: " + e.getMessage());
            return result;
        }
    }
    
    private String buildFullAddress(AddressRequest request) {
        StringBuilder fullAddress = new StringBuilder();
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            fullAddress.append(request.getAddress().trim());
        }
        if (request.getCity() != null && !request.getCity().trim().isEmpty()) {
            if (fullAddress.length() > 0) fullAddress.append(", ");
            fullAddress.append(request.getCity().trim());
        }
        if (request.getPostalCode() != null && !request.getPostalCode().trim().isEmpty()) {
            if (fullAddress.length() > 0) fullAddress.append(", ");
            fullAddress.append(request.getPostalCode().trim());
        }
        return fullAddress.toString();
    }
    
    private String buildFullAddressFromMap(Map<String, String> addressData) {
        StringBuilder fullAddress = new StringBuilder();
        String address = addressData.get("address");
        String city = addressData.get("city");
        String postalCode = addressData.get("postalCode");
        
        if (address != null && !address.trim().isEmpty()) {
            fullAddress.append(address.trim());
        }
        if (city != null && !city.trim().isEmpty()) {
            if (fullAddress.length() > 0) fullAddress.append(", ");
            fullAddress.append(city.trim());
        }
        if (postalCode != null && !postalCode.trim().isEmpty()) {
            if (fullAddress.length() > 0) fullAddress.append(", ");
            fullAddress.append(postalCode.trim());
        }
        return fullAddress.toString();
    }
    
    public List<Address> searchAddresses(Long userId, String query) {
        return addressRepository.searchAddressesByUser(userId, query);
    }
    
    public List<Map<String, Object>> getAddressSuggestions(String query) {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        
        if (query == null || query.trim().isEmpty() || query.length() < 3) {
            return suggestions;
        }
        
        // First try Google Places API
        try {
            LatLng sanFrancisco = new LatLng(37.7749, -122.4194);
            
            AutocompletePrediction[] predictions = PlacesApi.placeAutocomplete(geoApiContext, query, null)
                .location(sanFrancisco)
                .radius(50000)
                .types(PlaceAutocompleteType.ADDRESS)
                .await();
            
            for (AutocompletePrediction prediction : predictions) {
                String description = prediction.description;
                
                if (description.toLowerCase().contains("ca") && 
                    (description.toLowerCase().contains("san francisco") ||
                     description.toLowerCase().contains("daly city") ||
                     description.toLowerCase().contains("san bruno"))) {
                    
                    Map<String, Object> suggestion = new HashMap<>();
                    suggestion.put("address", description);
                    suggestion.put("confidence", 0.95);
                    suggestions.add(suggestion);
                    
                    if (suggestions.size() >= 5) break;
                }
            }
            
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Google Places API failed: " + e.getMessage());
            e.printStackTrace();
        }
        
        // If Google API failed or returned no results, use local suggestions
        if (suggestions.isEmpty()) {
            String[] localAddresses = {
                "1 Market Street, San Francisco, CA 94105",
                "100 Market Street, San Francisco, CA 94105", 
                "88 Hillside Boulevard, Daly City, CA 94014",
                "123 Mission Street, San Francisco, CA 94103",
                "456 Valencia Street, San Francisco, CA 94110",
                "600 El Camino Real, San Bruno, CA 94066",
                "777 Geary Street, San Francisco, CA 94109",
                "888 Post Street, San Francisco, CA 94109"
            };
            
            String lowerQuery = query.toLowerCase();
            for (String address : localAddresses) {
                if (address.toLowerCase().contains(lowerQuery)) {
                    Map<String, Object> suggestion = new HashMap<>();
                    suggestion.put("address", address);
                    suggestion.put("confidence", 0.85);
                    suggestions.add(suggestion);
                    
                    if (suggestions.size() >= 5) break;
                }
            }
        }
        
        return suggestions;
    }
}