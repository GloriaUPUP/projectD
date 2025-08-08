package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "vehicle")
public class Vehicle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false)
    private VehicleType vehicleType;
    
    @Column(name = "max_payload_kg", precision = 4, scale = 1)
    private BigDecimal maxPayloadKg;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status = VehicleStatus.IDLE;
    
    @Column(name = "station_id")
    private Long stationId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", insertable = false, updatable = false)
    private Station station;
    
    // Default constructor
    public Vehicle() {}
    
    // Constructor
    public Vehicle(VehicleType vehicleType, BigDecimal maxPayloadKg, VehicleStatus status, Long stationId) {
        this.vehicleType = vehicleType;
        this.maxPayloadKg = maxPayloadKg;
        this.status = status;
        this.stationId = stationId;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public VehicleType getVehicleType() {
        return vehicleType;
    }
    
    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }
    
    public BigDecimal getMaxPayloadKg() {
        return maxPayloadKg;
    }
    
    public void setMaxPayloadKg(BigDecimal maxPayloadKg) {
        this.maxPayloadKg = maxPayloadKg;
    }
    
    public VehicleStatus getStatus() {
        return status;
    }
    
    public void setStatus(VehicleStatus status) {
        this.status = status;
    }
    
    public Long getStationId() {
        return stationId;
    }
    
    public void setStationId(Long stationId) {
        this.stationId = stationId;
    }
    
    public Station getStation() {
        return station;
    }
    
    public void setStation(Station station) {
        this.station = station;
    }
}