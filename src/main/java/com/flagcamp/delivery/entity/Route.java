package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "route")
public class Route {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false)
    private VehicleType vehicleType;
    
    @NotNull
    @Column(name = "distance_m", nullable = false)
    private Integer distanceM;
    
    @NotNull
    @Column(name = "duration_s", nullable = false)
    private Integer durationS;
    
    @NotNull
    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private DeliveryOrder deliveryOrder;
    
    // Default constructor
    public Route() {}
    
    // Constructor
    public Route(Long orderId, VehicleType vehicleType, Integer distanceM, Integer durationS, Integer priceCents) {
        this.orderId = orderId;
        this.vehicleType = vehicleType;
        this.distanceM = distanceM;
        this.durationS = durationS;
        this.priceCents = priceCents;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getOrderId() {
        return orderId;
    }
    
    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
    
    public VehicleType getVehicleType() {
        return vehicleType;
    }
    
    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }
    
    public Integer getDistanceM() {
        return distanceM;
    }
    
    public void setDistanceM(Integer distanceM) {
        this.distanceM = distanceM;
    }
    
    public Integer getDurationS() {
        return durationS;
    }
    
    public void setDurationS(Integer durationS) {
        this.durationS = durationS;
    }
    
    public Integer getPriceCents() {
        return priceCents;
    }
    
    public void setPriceCents(Integer priceCents) {
        this.priceCents = priceCents;
    }
    
    public DeliveryOrder getDeliveryOrder() {
        return deliveryOrder;
    }
    
    public void setDeliveryOrder(DeliveryOrder deliveryOrder) {
        this.deliveryOrder = deliveryOrder;
    }
}