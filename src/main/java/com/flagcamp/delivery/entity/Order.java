package com.flagcamp.delivery.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@EntityListeners(AuditingEntityListener.class)
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String orderNumber;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING_OPTIONS;
    
    // Pickup Information
    @NotNull
    @Size(max = 500)
    private String pickupAddress;
    
    @NotNull
    @Size(max = 100)
    private String pickupContactName;
    
    @NotNull
    @Size(max = 20)
    private String pickupContactPhone;
    
    @Size(max = 500)
    private String pickupInstructions;
    
    private LocalDateTime requestedPickupTime;
    
    private LocalDateTime actualPickupTime;
    
    // Delivery Information
    @NotNull
    @Size(max = 500)
    private String deliveryAddress;
    
    @NotNull
    @Size(max = 100)
    private String deliveryContactName;
    
    @NotNull
    @Size(max = 20)
    private String deliveryContactPhone;
    
    @Size(max = 500)
    private String deliveryInstructions;
    
    private LocalDateTime estimatedDeliveryTime;
    
    private LocalDateTime actualDeliveryTime;
    
    // Package Information
    @Positive
    private Double packageWeight;
    
    @Size(max = 50)
    private String packageType;
    
    @Positive
    private BigDecimal packageValue;
    
    @Size(max = 500)
    private String packageDescription;
    
    // Pricing
    private BigDecimal totalCost;
    
    private BigDecimal baseCost;
    
    private BigDecimal deliveryCost;
    
    // Delivery
    @Enumerated(EnumType.STRING)
    private DeliveryType deliveryType;
    
    private String assignedDeviceId;
    
    private String trackingNumber;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderStatusHistory> statusHistory;
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;
    
    // Default constructor
    public Order() {
        this.orderNumber = generateOrderNumber();
        this.trackingNumber = generateTrackingNumber();
    }
    
    // Constructor
    public Order(String pickupAddress, String pickupContactName, String pickupContactPhone,
                 String deliveryAddress, String deliveryContactName, String deliveryContactPhone,
                 Double packageWeight, String packageType, BigDecimal packageValue,
                 String packageDescription, User user) {
        this();
        this.pickupAddress = pickupAddress;
        this.pickupContactName = pickupContactName;
        this.pickupContactPhone = pickupContactPhone;
        this.deliveryAddress = deliveryAddress;
        this.deliveryContactName = deliveryContactName;
        this.deliveryContactPhone = deliveryContactPhone;
        this.packageWeight = packageWeight;
        this.packageType = packageType;
        this.packageValue = packageValue;
        this.packageDescription = packageDescription;
        this.user = user;
    }
    
    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }
    
    private String generateTrackingNumber() {
        return "TRK" + System.currentTimeMillis();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getOrderNumber() {
        return orderNumber;
    }
    
    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
    
    public String getPickupAddress() {
        return pickupAddress;
    }
    
    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }
    
    public String getPickupContactName() {
        return pickupContactName;
    }
    
    public void setPickupContactName(String pickupContactName) {
        this.pickupContactName = pickupContactName;
    }
    
    public String getPickupContactPhone() {
        return pickupContactPhone;
    }
    
    public void setPickupContactPhone(String pickupContactPhone) {
        this.pickupContactPhone = pickupContactPhone;
    }
    
    public String getPickupInstructions() {
        return pickupInstructions;
    }
    
    public void setPickupInstructions(String pickupInstructions) {
        this.pickupInstructions = pickupInstructions;
    }
    
    public LocalDateTime getRequestedPickupTime() {
        return requestedPickupTime;
    }
    
    public void setRequestedPickupTime(LocalDateTime requestedPickupTime) {
        this.requestedPickupTime = requestedPickupTime;
    }
    
    public LocalDateTime getActualPickupTime() {
        return actualPickupTime;
    }
    
    public void setActualPickupTime(LocalDateTime actualPickupTime) {
        this.actualPickupTime = actualPickupTime;
    }
    
    public String getDeliveryAddress() {
        return deliveryAddress;
    }
    
    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }
    
    public String getDeliveryContactName() {
        return deliveryContactName;
    }
    
    public void setDeliveryContactName(String deliveryContactName) {
        this.deliveryContactName = deliveryContactName;
    }
    
    public String getDeliveryContactPhone() {
        return deliveryContactPhone;
    }
    
    public void setDeliveryContactPhone(String deliveryContactPhone) {
        this.deliveryContactPhone = deliveryContactPhone;
    }
    
    public String getDeliveryInstructions() {
        return deliveryInstructions;
    }
    
    public void setDeliveryInstructions(String deliveryInstructions) {
        this.deliveryInstructions = deliveryInstructions;
    }
    
    public LocalDateTime getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }
    
    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }
    
    public LocalDateTime getActualDeliveryTime() {
        return actualDeliveryTime;
    }
    
    public void setActualDeliveryTime(LocalDateTime actualDeliveryTime) {
        this.actualDeliveryTime = actualDeliveryTime;
    }
    
    public Double getPackageWeight() {
        return packageWeight;
    }
    
    public void setPackageWeight(Double packageWeight) {
        this.packageWeight = packageWeight;
    }
    
    public String getPackageType() {
        return packageType;
    }
    
    public void setPackageType(String packageType) {
        this.packageType = packageType;
    }
    
    public BigDecimal getPackageValue() {
        return packageValue;
    }
    
    public void setPackageValue(BigDecimal packageValue) {
        this.packageValue = packageValue;
    }
    
    public String getPackageDescription() {
        return packageDescription;
    }
    
    public void setPackageDescription(String packageDescription) {
        this.packageDescription = packageDescription;
    }
    
    public BigDecimal getTotalCost() {
        return totalCost;
    }
    
    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
    
    public BigDecimal getBaseCost() {
        return baseCost;
    }
    
    public void setBaseCost(BigDecimal baseCost) {
        this.baseCost = baseCost;
    }
    
    public BigDecimal getDeliveryCost() {
        return deliveryCost;
    }
    
    public void setDeliveryCost(BigDecimal deliveryCost) {
        this.deliveryCost = deliveryCost;
    }
    
    public DeliveryType getDeliveryType() {
        return deliveryType;
    }
    
    public void setDeliveryType(DeliveryType deliveryType) {
        this.deliveryType = deliveryType;
    }
    
    public String getAssignedDeviceId() {
        return assignedDeviceId;
    }
    
    public void setAssignedDeviceId(String assignedDeviceId) {
        this.assignedDeviceId = assignedDeviceId;
    }
    
    public String getTrackingNumber() {
        return trackingNumber;
    }
    
    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
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
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public List<OrderStatusHistory> getStatusHistory() {
        return statusHistory;
    }
    
    public void setStatusHistory(List<OrderStatusHistory> statusHistory) {
        this.statusHistory = statusHistory;
    }
    
    public Payment getPayment() {
        return payment;
    }
    
    public void setPayment(Payment payment) {
        this.payment = payment;
    }
}