package com.flagcamp.delivery.service;

import com.flagcamp.delivery.dto.auth.AuthResponse;
import com.flagcamp.delivery.dto.auth.LoginRequest;
import com.flagcamp.delivery.dto.auth.RegisterRequest;
import com.flagcamp.delivery.entity.Address;
import com.flagcamp.delivery.entity.User;
import com.flagcamp.delivery.repository.AddressRepository;
import com.flagcamp.delivery.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AddressRepository addressRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenService jwtTokenService;
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }
    
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        
        user = userRepository.save(user);
        
        // Create default address if provided
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            Address defaultAddress = new Address();
            defaultAddress.setLabel("Home");
            defaultAddress.setAddress(request.getAddress());
            defaultAddress.setCity("Default City"); // You might want to parse this from address
            defaultAddress.setPhone(request.getPhone());
            defaultAddress.setDefault(true);
            defaultAddress.setUser(user);
            addressRepository.save(defaultAddress);
        }
        
        // Generate JWT token
        String token = jwtTokenService.generateToken(user.getEmail());
        
        return new AuthResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            token
        );
    }
    
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        
        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account is disabled");
        }
        
        // Generate JWT token
        String token = jwtTokenService.generateToken(user.getEmail());
        
        return new AuthResponse(
            user.getId().toString(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            token
        );
    }
    
    public Map<String, Object> getUserSettings(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        
        Map<String, Object> settings = new HashMap<>();
        
        // Profile information
        Map<String, Object> profile = new HashMap<>();
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        settings.put("profile", profile);
        
        // Addresses
        List<Map<String, Object>> addressList = addresses.stream().map(addr -> {
            Map<String, Object> addressMap = new HashMap<>();
            addressMap.put("addressId", "addr_" + addr.getId().toString());
            addressMap.put("label", addr.getLabel());
            addressMap.put("address", addr.getFullAddress());
            addressMap.put("isDefault", addr.isDefault());
            return addressMap;
        }).collect(Collectors.toList());
        settings.put("addresses", addressList);
        
        // Preferences (mock data for now)
        Map<String, Object> preferences = new HashMap<>();
        preferences.put("language", "en");
        
        Map<String, Object> notifications = new HashMap<>();
        notifications.put("email", true);
        notifications.put("sms", true);
        notifications.put("push", true);
        preferences.put("notifications", notifications);
        
        preferences.put("defaultDeliveryMethod", "robot");
        settings.put("preferences", preferences);
        
        return settings;
    }
    
    public Map<String, Object> updateUserSettings(Long userId, Map<String, Object> settingsData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<String> updatedFields = new ArrayList<>();
        
        // Update profile if provided
        if (settingsData.containsKey("profile")) {
            Map<String, Object> profileData = (Map<String, Object>) settingsData.get("profile");
            
            if (profileData.containsKey("firstName")) {
                user.setFirstName((String) profileData.get("firstName"));
                updatedFields.add("profile.firstName");
            }
            
            if (profileData.containsKey("lastName")) {
                user.setLastName((String) profileData.get("lastName"));
                updatedFields.add("profile.lastName");
            }
            
            if (profileData.containsKey("phone")) {
                user.setPhone((String) profileData.get("phone"));
                updatedFields.add("profile.phone");
            }
            
            userRepository.save(user);
        }
        
        // Handle preferences update (mock implementation)
        if (settingsData.containsKey("preferences")) {
            updatedFields.add("preferences");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("updatedFields", updatedFields);
        
        return result;
    }
    
    public User updateProfile(Long userId, Map<String, String> profileData) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (profileData.containsKey("firstName")) {
            user.setFirstName(profileData.get("firstName"));
        }
        
        if (profileData.containsKey("lastName")) {
            user.setLastName(profileData.get("lastName"));
        }
        
        if (profileData.containsKey("phone")) {
            user.setPhone(profileData.get("phone"));
        }
        
        return userRepository.save(user);
    }
}