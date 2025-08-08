package com.flagcamp.delivery.dto.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class PackageInfo {
    
    @NotNull(message = "Package weight is required")
    @Positive(message = "Package weight must be positive")
    private Double weight;
    
    @Size(max = 50, message = "Package type cannot exceed 50 characters")
    private String type;
    
    @NotNull(message = "Package value is required")
    @Positive(message = "Package value must be positive")
    private BigDecimal value;
    
    @Size(max = 500, message = "Package description cannot exceed 500 characters")
    private String description;
    
    // Default constructor
    public PackageInfo() {}
    
    // Constructor
    public PackageInfo(Double weight, String type, BigDecimal value, String description) {
        this.weight = weight;
        this.type = type;
        this.value = value;
        this.description = description;
    }
    
    // Getters and Setters
    public Double getWeight() {
        return weight;
    }
    
    public void setWeight(Double weight) {
        this.weight = weight;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public BigDecimal getValue() {
        return value;
    }
    
    public void setValue(BigDecimal value) {
        this.value = value;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}