package com.flagcamp.delivery.exception;

public class GeocodingException extends RuntimeException {
    public GeocodingException() {
        super("Geocoding operation failed");
    }
    
    public GeocodingException(String message) {
        super(message);
    }
    
    public GeocodingException(String message, Throwable cause) {
        super(message, cause);
    }
}