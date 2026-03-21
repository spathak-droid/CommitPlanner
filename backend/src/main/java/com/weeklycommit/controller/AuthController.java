package com.weeklycommit.controller;

import com.weeklycommit.dto.AuthResponse;
import com.weeklycommit.dto.LoginRequest;
import com.weeklycommit.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse currentUser() {
        return authService.currentUser();
    }
}
