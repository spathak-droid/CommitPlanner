package com.weeklycommit.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasher {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    public String generateSalt() {
        return ""; // BCrypt embeds its own salt
    }

    public String hashPassword(String password, String saltHex) {
        return encoder.encode(password);
    }

    public boolean matches(String rawPassword, String saltHex, String expectedHash) {
        return encoder.matches(rawPassword, expectedHash);
    }
}
