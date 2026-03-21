package com.weeklycommit.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AuthTokenService {

    private static final long TTL_MILLIS = 1000L * 60 * 60 * 12;
    private final SecretKeySpec keySpec;

    public AuthTokenService(@Value("${app.auth.secret:weekly-commit-dev-secret-change-me}") String secret) {
        this.keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public String issueToken(String userId) {
        long expiry = System.currentTimeMillis() + TTL_MILLIS;
        String payload = userId + ":" + expiry;
        String signature = sign(payload);
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString((payload + ":" + signature).getBytes(StandardCharsets.UTF_8));
    }

    public String verifyAndExtractUserId(String token) {
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 3) throw new IllegalArgumentException("Malformed token");
            String payload = parts[0] + ":" + parts[1];
            long expiry = Long.parseLong(parts[1]);
            if (expiry < System.currentTimeMillis()) throw new IllegalArgumentException("Token expired");
            if (!sign(payload).equals(parts[2])) throw new IllegalArgumentException("Invalid token signature");
            return parts[0];
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Invalid token");
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(keySpec);
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign auth token", e);
        }
    }
}
