package com.flagcamp.delivery.service;

import com.flagcamp.delivery.dto.address.AddressRequest;
import com.flagcamp.delivery.entity.Address;
import com.flagcamp.delivery.entity.User;
import com.flagcamp.delivery.repository.AddressRepository;
import com.flagcamp.delivery.repository.UserRepository;
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
    
    public List<Address> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
    }
    
    public Address getAddressById(Long addressId) {
        return addressRepository.findById(addressId).orElse(null);
    }
    
    public Address addAddress(AddressRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
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
        // Mock address validation
        Map<String, Object> result = new HashMap<>();
        result.put("isValid", true);
        result.put("suggestion", null);
        
        Map<String, Object> formatted = new HashMap<>();
        formatted.put("address", addressData.get("address"));
        formatted.put("city", addressData.get("city"));
        formatted.put("postalCode", addressData.get("postalCode"));
        result.put("formatted", formatted);
        
        return result;
    }
    
    public List<Address> searchAddresses(Long userId, String query) {
        return addressRepository.searchAddressesByUser(userId, query);
    }
    
    public List<Map<String, Object>> getAddressSuggestions(String query) {
        // Mock address suggestions
        List<Map<String, Object>> suggestions = new ArrayList<>();
        
        if (query != null && !query.trim().isEmpty()) {
            String[] baseAddresses = {
                "123 Main Street, New York, NY 10001",
                "124 Main Street, New York, NY 10001", 
                "125 Main Street, New York, NY 10001"
            };
            
            for (String baseAddress : baseAddresses) {
                if (baseAddress.toLowerCase().contains(query.toLowerCase())) {
                    Map<String, Object> suggestion = new HashMap<>();
                    suggestion.put("address", baseAddress);
                    suggestion.put("confidence", 0.95 - suggestions.size() * 0.08);
                    suggestions.add(suggestion);
                }
            }
        }
        
        return suggestions;
    }
}