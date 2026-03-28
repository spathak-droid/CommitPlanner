package com.weeklycommit.security;

import com.weeklycommit.repository.AppUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthFilter extends OncePerRequestFilter {

    private final AuthTokenService tokenService;
    private final AppUserRepository userRepository;

    public AuthFilter(AuthTokenService tokenService, AppUserRepository userRepository) {
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
            || !path.startsWith("/api")
            || path.equals("/api/health")
            || path.equals("/api/auth/login")
            || path.equals("/api/auth/logout")
            || path.startsWith("/api-docs")
            || path.startsWith("/swagger-ui");
    }

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("auth_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (token == null) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing bearer token");
                return;
            }

            String userId = tokenService.verifyAndExtractUserId(token);
            var user = userRepository.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

            AuthContextHolder.set(new AuthenticatedUser(user.getUserId(), user.getFullName(), user.getRole()));
            filterChain.doFilter(request, response);
        } catch (IllegalArgumentException ex) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, ex.getMessage());
        } finally {
            AuthContextHolder.clear();
        }
    }
}
