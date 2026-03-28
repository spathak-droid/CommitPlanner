package com.weeklycommit.controller;

import com.weeklycommit.dto.AuthResponse;
import com.weeklycommit.dto.LoginRequest;
import com.weeklycommit.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    @Value("${COOKIE_SECURE:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Login and receive a bearer token")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        Cookie cookie = new Cookie("auth_token", authResponse.token());
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api");
        cookie.setMaxAge(12 * 60 * 60); // 12 hours
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
        return authResponse;
    }

    @Operation(summary = "Logout and clear auth cookie")
    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("auth_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public AuthResponse currentUser() {
        return authService.currentUser();
    }
}
