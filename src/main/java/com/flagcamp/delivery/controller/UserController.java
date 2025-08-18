package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.dto.auth.AuthResponse;
import com.flagcamp.delivery.dto.auth.LoginRequest;
import com.flagcamp.delivery.dto.auth.RegisterRequest;
import com.flagcamp.delivery.entity.User;
import com.flagcamp.delivery.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.Date;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User existingUser = userService.findByEmail(request.getEmail());
            if (existingUser != null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("邮箱已被注册", "EMAIL_ALREADY_EXISTS"));
            }
            
            AuthResponse response = userService.register(request);
            return ResponseEntity.ok(ApiResponse.success("注册成功", response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("注册失败", e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = userService.login(request);
            return ResponseEntity.ok(ApiResponse.success("登录成功", response));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("用户名或密码错误", "INVALID_CREDENTIALS"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("登录失败", e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        // In a real implementation, you might invalidate the JWT token
        // For now, we'll just return a success response
        return ResponseEntity.ok(ApiResponse.success("注销成功", "Logged out successfully"));
    }
    
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserSettings() {
        try {
            // For now, return mock user settings
            // In a real implementation, get current user from security context
            Map<String, Object> settings = userService.getUserSettings(1L); // Mock user ID
            return ResponseEntity.ok(ApiResponse.success(settings));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取用户设置失败", e.getMessage()));
        }
    }
    
    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserSettings(
            @RequestBody Map<String, Object> settingsData) {
        try {
            // In a real implementation, get current user from security context
            Map<String, Object> result = userService.updateUserSettings(1L, settingsData); // Mock user ID
            return ResponseEntity.ok(ApiResponse.success("设置已更新", result));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("更新设置失败", e.getMessage()));
        }
    }
    
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserProfile() {
        try {
            // Create mock user data for testing
            Map<String, Object> mockUser = new HashMap<>();
            mockUser.put("id", 1L);
            mockUser.put("userId", "user_001");
            mockUser.put("email", "demo@test.com");
            mockUser.put("firstName", "Demo");
            mockUser.put("lastName", "User");
            mockUser.put("phone", "+1234567890");
            mockUser.put("address", "123 Main St, San Francisco, CA");
            mockUser.put("createdAt", new Date());
            
            return ResponseEntity.ok(ApiResponse.success(mockUser));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取用户信息失败", e.getMessage()));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserProfile(@RequestBody Map<String, String> profileData) {
        try {
            // Create updated mock user data
            Map<String, Object> updatedUser = new HashMap<>();
            updatedUser.put("id", 1L);
            updatedUser.put("userId", "user_001");
            updatedUser.put("email", profileData.getOrDefault("email", "demo@test.com"));
            updatedUser.put("firstName", profileData.getOrDefault("firstName", "Demo"));
            updatedUser.put("lastName", profileData.getOrDefault("lastName", "User"));
            updatedUser.put("phone", profileData.getOrDefault("phone", "+1234567890"));
            updatedUser.put("address", profileData.getOrDefault("address", "123 Main St, San Francisco, CA"));
            updatedUser.put("updatedAt", new Date());
            
            return ResponseEntity.ok(ApiResponse.success("个人信息已更新", updatedUser));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("更新个人信息失败", e.getMessage()));
        }
    }
}