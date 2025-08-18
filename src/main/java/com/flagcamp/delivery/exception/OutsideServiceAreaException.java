package com.flagcamp.delivery.exception;

public class OutsideServiceAreaException extends RuntimeException {
    public OutsideServiceAreaException() {
        super("Address is outside the service area");
    }
    
    public OutsideServiceAreaException(String message) {
        super(message);
    }
    
    public OutsideServiceAreaException(String message, Throwable cause) {
        super(message, cause);
    }
}