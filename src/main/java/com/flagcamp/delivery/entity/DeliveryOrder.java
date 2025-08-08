package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_order")
@EntityListeners(AuditingEntityListener.class)
public class DeliveryOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "pickup_address_id")
    private Long pickupAddressId;
    
    @Column(name = "dropoff_address_id")
    private Long dropoffAddressId;
    
    @Column(name = "station_id")
    private Long stationId;
    
    @Column(name = "vehicle_id")
    private Long vehicleId;
    
    // Item fields
    @Column(name = "item_description", columnDefinition = "TEXT")
    private String itemDescription;
    
    @Column(name = "item_weight_kg", precision = 4, scale = 2)
    private BigDecimal itemWeightKg;
    
    @Column(name = "item_length_cm", precision = 5, scale = 1)
    private BigDecimal itemLengthCm;
    
    @Column(name = "item_width_cm", precision = 5, scale = 1)
    private BigDecimal itemWidthCm;
    
    @Column(name = "item_height_cm", precision = 5, scale = 1)
    private BigDecimal itemHeightCm;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryOrderStatus status = DeliveryOrderStatus.PENDING_PAYMENT;
    
    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private NewUser user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_address_id", insertable = false, updatable = false)
    private NewAddress pickupAddress;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dropoff_address_id", insertable = false, updatable = false)
    private NewAddress dropoffAddress;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", insertable = false, updatable = false)
    private Station station;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;
    
    // Default constructor
    public DeliveryOrder() {}
    
    // Constructor
    public DeliveryOrder(Long userId, Long pickupAddressId, Long dropoffAddressId,
                        String itemDescription, BigDecimal itemWeightKg) {
        this.userId = userId;
        this.pickupAddressId = pickupAddressId;
        this.dropoffAddressId = dropoffAddressId;
        this.itemDescription = itemDescription;
        this.itemWeightKg = itemWeightKg;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getPickupAddressId() {
        return pickupAddressId;
    }
    
    public void setPickupAddressId(Long pickupAddressId) {
        this.pickupAddressId = pickupAddressId;
    }
    
    public Long getDropoffAddressId() {
        return dropoffAddressId;
    }
    
    public void setDropoffAddressId(Long dropoffAddressId) {
        this.dropoffAddressId = dropoffAddressId;
    }
    
    public Long getStationId() {
        return stationId;
    }
    
    public void setStationId(Long stationId) {
        this.stationId = stationId;
    }
    
    public Long getVehicleId() {
        return vehicleId;
    }
    
    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }
    
    public String getItemDescription() {
        return itemDescription;
    }
    
    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }
    
    public BigDecimal getItemWeightKg() {
        return itemWeightKg;
    }
    
    public void setItemWeightKg(BigDecimal itemWeightKg) {
        this.itemWeightKg = itemWeightKg;
    }
    
    public BigDecimal getItemLengthCm() {
        return itemLengthCm;
    }
    
    public void setItemLengthCm(BigDecimal itemLengthCm) {
        this.itemLengthCm = itemLengthCm;
    }
    
    public BigDecimal getItemWidthCm() {
        return itemWidthCm;
    }
    
    public void setItemWidthCm(BigDecimal itemWidthCm) {
        this.itemWidthCm = itemWidthCm;
    }
    
    public BigDecimal getItemHeightCm() {
        return itemHeightCm;
    }
    
    public void setItemHeightCm(BigDecimal itemHeightCm) {
        this.itemHeightCm = itemHeightCm;
    }
    
    public DeliveryOrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(DeliveryOrderStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public NewUser getUser() {
        return user;
    }
    
    public void setUser(NewUser user) {
        this.user = user;
    }
    
    public NewAddress getPickupAddress() {
        return pickupAddress;
    }
    
    public void setPickupAddress(NewAddress pickupAddress) {
        this.pickupAddress = pickupAddress;
    }
    
    public NewAddress getDropoffAddress() {
        return dropoffAddress;
    }
    
    public void setDropoffAddress(NewAddress dropoffAddress) {
        this.dropoffAddress = dropoffAddress;
    }
    
    public Station getStation() {
        return station;
    }
    
    public void setStation(Station station) {
        this.station = station;
    }
    
    public Vehicle getVehicle() {
        return vehicle;
    }
    
    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }
}