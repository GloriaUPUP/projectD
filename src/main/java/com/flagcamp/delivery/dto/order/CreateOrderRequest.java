package com.flagcamp.delivery.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class CreateOrderRequest {
    
    @NotNull(message = "Pickup information is required")
    @Valid
    private PickupInfo pickupInfo;
    
    @NotNull(message = "Delivery information is required")
    @Valid
    private DeliveryInfo deliveryInfo;
    
    @NotNull(message = "Package information is required")
    @Valid
    private PackageInfo packageInfo;
    
    private PreferenceInfo preferences;
    
    // Default constructor
    public CreateOrderRequest() {}
    
    // Getters and Setters
    public PickupInfo getPickupInfo() {
        return pickupInfo;
    }
    
    public void setPickupInfo(PickupInfo pickupInfo) {
        this.pickupInfo = pickupInfo;
    }
    
    public DeliveryInfo getDeliveryInfo() {
        return deliveryInfo;
    }
    
    public void setDeliveryInfo(DeliveryInfo deliveryInfo) {
        this.deliveryInfo = deliveryInfo;
    }
    
    public PackageInfo getPackageInfo() {
        return packageInfo;
    }
    
    public void setPackageInfo(PackageInfo packageInfo) {
        this.packageInfo = packageInfo;
    }
    
    public PreferenceInfo getPreferences() {
        return preferences;
    }
    
    public void setPreferences(PreferenceInfo preferences) {
        this.preferences = preferences;
    }
}