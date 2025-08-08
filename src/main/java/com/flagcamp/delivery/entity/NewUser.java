package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class NewUser {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Size(max = 100)
    @Column(name = "full_name")
    private String fullName;
    
    @Email
    @Size(max = 100)
    @Column(unique = true)
    private String email;
    
    @Size(max = 20)
    private String phone;
    
    @Column(name = "default_address_id")
    private Long defaultAddressId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_address_id", insertable = false, updatable = false)
    private NewAddress defaultAddress;
    
    // Default constructor
    public NewUser() {}
    
    // Constructor
    public NewUser(String fullName, String email, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public Long getDefaultAddressId() {
        return defaultAddressId;
    }
    
    public void setDefaultAddressId(Long defaultAddressId) {
        this.defaultAddressId = defaultAddressId;
    }
    
    public NewAddress getDefaultAddress() {
        return defaultAddress;
    }
    
    public void setDefaultAddress(NewAddress defaultAddress) {
        this.defaultAddress = defaultAddress;
    }
}