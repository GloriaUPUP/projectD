package com.flagcamp.delivery.entity;

public enum DeliveryOrderStatus {
    PENDING_PAYMENT, PAID, DISPATCHED, AT_PICKUP,
    IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED, FAILED
}