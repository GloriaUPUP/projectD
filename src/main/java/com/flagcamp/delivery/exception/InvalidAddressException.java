package com.flagcamp.delivery.exception;

public class InvalidAddressException extends RuntimeException {
    public InvalidAddressException() {
        super("Invalid address provided");
    }
    
    public InvalidAddressException(String message) {
        super(message);
    }
    
    public InvalidAddressException(String message, Throwable cause) {
        super(message, cause);
    }
}