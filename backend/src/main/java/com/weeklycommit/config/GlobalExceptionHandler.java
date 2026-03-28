package com.weeklycommit.config;

import com.weeklycommit.exception.AiUnavailableException;
import com.weeklycommit.exception.InvalidCredentialsException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        List<Map<String, String>> fieldErrors = e.getBindingResult().getFieldErrors().stream()
            .map(fe -> Map.of(
                "field", fe.getField(),
                "error", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid value",
                "code", fe.getCode() != null ? fe.getCode() : "INVALID"
            ))
            .collect(Collectors.toList());
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Validation failed",
            "code", "VALIDATION_ERROR",
            "fieldErrors", fieldErrors
        ));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException e) {
        List<Map<String, String>> violations = e.getConstraintViolations().stream()
            .map(cv -> Map.of(
                "field", cv.getPropertyPath().toString(),
                "error", cv.getMessage(),
                "code", "CONSTRAINT_VIOLATION"
            ))
            .collect(Collectors.toList());
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Constraint violation",
            "code", "VALIDATION_ERROR",
            "fieldErrors", violations
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", e.getMessage(),
            "code", "INVALID_ARGUMENT"
        ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "error", e.getMessage(),
            "code", "INVALID_STATE"
        ));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(ObjectOptimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "error", "This plan was modified by another request. Please refresh and try again.",
            "code", "OPTIMISTIC_LOCK_CONFLICT"
        ));
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(jakarta.persistence.EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "error", e.getMessage(),
            "code", "NOT_FOUND"
        ));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorized(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
            "error", e.getMessage(),
            "code", "UNAUTHORIZED"
        ));
    }

    @ExceptionHandler(AiUnavailableException.class)
    public ResponseEntity<Map<String, String>> handleAiUnavailable(AiUnavailableException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
            "error", e.getMessage(),
            "code", "AI_UNAVAILABLE"
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "error", "An unexpected error occurred",
            "code", "INTERNAL_ERROR"
        ));
    }
}
