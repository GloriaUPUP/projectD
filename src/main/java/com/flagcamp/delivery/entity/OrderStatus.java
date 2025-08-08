package com.flagcamp.delivery.entity;

public enum OrderStatus {
    PENDING_OPTIONS,
    AWAITING_PAYMENT,
    CONFIRMED,
    PICKED_UP,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED,
    FAILED
}