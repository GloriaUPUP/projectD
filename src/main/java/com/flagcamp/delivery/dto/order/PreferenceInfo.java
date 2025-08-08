package com.flagcamp.delivery.dto.order;

import java.time.LocalDateTime;

public class PreferenceInfo {
    
    private LocalDateTime pickupTime;
    private String serviceType;
    
    // Default constructor
    public PreferenceInfo() {}
    
    // Constructor
    public PreferenceInfo(LocalDateTime pickupTime, String serviceType) {
        this.pickupTime = pickupTime;
        this.serviceType = serviceType;
    }
    
    // Getters and Setters
    public LocalDateTime getPickupTime() {
        return pickupTime;
    }
    
    public void setPickupTime(LocalDateTime pickupTime) {
        this.pickupTime = pickupTime;
    }
    
    public String getServiceType() {
        return serviceType;
    }
    
    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }
}