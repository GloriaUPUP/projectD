package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "station")
public class Station {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Size(max = 50)
    private String name;
    
    @Column(name = "address_id")
    private Long addressId;
    
    @Column(name = "available_robots")
    private Integer availableRobots = 0;
    
    @Column(name = "available_drones")
    private Integer availableDrones = 0;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", insertable = false, updatable = false)
    private NewAddress address;
    
    // Default constructor
    public Station() {}
    
    // Constructor
    public Station(String name, Long addressId, Integer availableRobots, Integer availableDrones) {
        this.name = name;
        this.addressId = addressId;
        this.availableRobots = availableRobots;
        this.availableDrones = availableDrones;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Long getAddressId() {
        return addressId;
    }
    
    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }
    
    public Integer getAvailableRobots() {
        return availableRobots;
    }
    
    public void setAvailableRobots(Integer availableRobots) {
        this.availableRobots = availableRobots;
    }
    
    public Integer getAvailableDrones() {
        return availableDrones;
    }
    
    public void setAvailableDrones(Integer availableDrones) {
        this.availableDrones = availableDrones;
    }
    
    public NewAddress getAddress() {
        return address;
    }
    
    public void setAddress(NewAddress address) {
        this.address = address;
    }
}