package com.flagcamp.delivery.controller;

import com.flagcamp.delivery.dto.ApiResponse;
import com.flagcamp.delivery.dto.address.AddressRequest;
import com.flagcamp.delivery.entity.Address;
import com.flagcamp.delivery.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/addresses")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:19006"})
public class AddressController {
    
    @Autowired
    private AddressService addressService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Address>>> getAddresses() {
        try {
            // In a real implementation, get current user from security context
            Long userId = 2L; // Mock user ID (using existing user)
            
            List<Address> addresses = addressService.getAddressesByUserId(userId);
            return ResponseEntity.ok(ApiResponse.success(addresses));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取地址列表失败", e.getMessage()));
        }
    }
    
    @GetMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Address>> getAddressById(@PathVariable Long addressId) {
        try {
            // In a real implementation, verify user ownership
            Address address = addressService.getAddressById(addressId);
            if (address == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(ApiResponse.success(address));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取地址失败", e.getMessage()));
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<Address>> addAddress(@Valid @RequestBody AddressRequest request) {
        try {
            // In a real implementation, get current user from security context
            Long userId = 2L; // Mock user ID (using existing user)
            
            Address address = addressService.addAddress(request, userId);
            return ResponseEntity.ok(ApiResponse.success("地址添加成功", address));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("添加地址失败", e.getMessage()));
        }
    }
    
    @PutMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Address>> updateAddress(
            @PathVariable Long addressId, 
            @Valid @RequestBody AddressRequest request) {
        try {
            // In a real implementation, verify user ownership
            Address updatedAddress = addressService.updateAddress(addressId, request);
            if (updatedAddress == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(ApiResponse.success("地址更新成功", updatedAddress));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("更新地址失败", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{addressId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteAddress(@PathVariable Long addressId) {
        try {
            // In a real implementation, verify user ownership
            boolean deleted = addressService.deleteAddress(addressId);
            if (!deleted) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "地址删除成功");
            
            return ResponseEntity.ok(ApiResponse.success("地址删除成功", response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("删除地址失败", e.getMessage()));
        }
    }
    
    @PatchMapping("/{addressId}/default")
    public ResponseEntity<ApiResponse<Address>> setDefaultAddress(@PathVariable Long addressId) {
        try {
            // In a real implementation, get current user from security context and verify ownership
            Long userId = 2L; // Mock user ID (using existing user)
            
            Address address = addressService.setDefaultAddress(addressId, userId);
            if (address == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(ApiResponse.success("默认地址设置成功", address));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("设置默认地址失败", e.getMessage()));
        }
    }
    
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateAddress(@RequestBody Map<String, String> addressData) {
        try {
            Map<String, Object> validationResult = addressService.validateAddress(addressData);
            return ResponseEntity.ok(ApiResponse.success(validationResult));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("地址验证失败", e.getMessage()));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Address>>> searchAddresses(@RequestParam String q) {
        try {
            // In a real implementation, get current user from security context
            Long userId = 2L; // Mock user ID (using existing user)
            
            List<Address> addresses = addressService.searchAddresses(userId, q);
            return ResponseEntity.ok(ApiResponse.success(addresses));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("搜索地址失败", e.getMessage()));
        }
    }
    
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<Map<String, List<Map<String, Object>>>>> getAddressSuggestions(@RequestParam String q) {
        try {
            List<Map<String, Object>> suggestions = addressService.getAddressSuggestions(q);
            
            Map<String, List<Map<String, Object>>> response = new HashMap<>();
            response.put("suggestions", suggestions);
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("获取地址建议失败", e.getMessage()));
        }
    }
}