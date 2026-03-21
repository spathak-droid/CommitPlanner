package com.weeklycommit.service;

import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.HexFormat;

@Component
public class PasswordHasher {

    private static final int ITERATIONS = 120_000;
    private static final int KEY_LENGTH = 256;
    private static final int SALT_BYTES = 16;
    private static final HexFormat HEX = HexFormat.of();
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateSalt() {
        byte[] salt = new byte[SALT_BYTES];
        secureRandom.nextBytes(salt);
        return HEX.formatHex(salt);
    }

    public String hashPassword(String password, String saltHex) {
        try {
            var spec = new PBEKeySpec(password.toCharArray(), HEX.parseHex(saltHex), ITERATIONS, KEY_LENGTH);
            var factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return HEX.formatHex(factory.generateSecret(spec).getEncoded());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to hash password", e);
        }
    }

    public boolean matches(String rawPassword, String saltHex, String expectedHash) {
        return hashPassword(rawPassword, saltHex).equalsIgnoreCase(expectedHash);
    }
}
