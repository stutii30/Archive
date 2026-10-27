package com.archive.auth.exception;

/**
 * Thrown when a refresh token is missing, expired, revoked, or not found.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }
}
