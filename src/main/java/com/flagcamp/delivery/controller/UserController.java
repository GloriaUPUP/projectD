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

import java.util.Map;

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
    public ResponseEntity<ApiResponse<User>> getUserProfile() {
        try {
            // In a real implementation, get current user from security context
            User user = userService.findById(1L); // Mock user ID
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Don't return password in response
            user.setPassword(null);
            return ResponseEntity.ok(ApiResponse.success(user));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取用户信息失败", e.getMessage()));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateUserProfile(@RequestBody Map<String, String> profileData) {
        try {
            // In a real implementation, get current user from security context
            User updatedUser = userService.updateProfile(1L, profileData); // Mock user ID
            updatedUser.setPassword(null); // Don't return password
            
            return ResponseEntity.ok(ApiResponse.success("个人信息已更新", updatedUser));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("更新个人信息失败", e.getMessage()));
        }
    }
}