package com.flagcamp.delivery.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PickupInfo {
    
    @NotBlank(message = "Pickup address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;
    
    @NotBlank(message = "Contact name is required")
    @Size(max = 100, message = "Contact name cannot exceed 100 characters")
    private String contactName;
    
    @NotBlank(message = "Contact phone is required")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String contactPhone;
    
    @Size(max = 500, message = "Instructions cannot exceed 500 characters")
    private String instructions;
    
    // Default constructor
    public PickupInfo() {}
    
    // Constructor
    public PickupInfo(String address, String contactName, String contactPhone, String instructions) {
        this.address = address;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
        this.instructions = instructions;
    }
    
    // Getters and Setters
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public String getInstructions() {
        return instructions;
    }
    
    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
}