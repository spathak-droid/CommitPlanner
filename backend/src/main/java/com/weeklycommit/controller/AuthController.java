package com.weeklycommit.controller;

import com.weeklycommit.dto.AuthResponse;
import com.weeklycommit.dto.LoginRequest;
import com.weeklycommit.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Login and receive a bearer token")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public AuthResponse currentUser() {
        return authService.currentUser();
    }
}
