package com.weeklycommit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${resend.api-key:}")
    private String apiKey;

    @Value("${resend.from-email:}")
    private String fromEmail;

    private boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Async
    public void sendNotificationEmail(String to, String subject, String body) {
        if (!isEnabled() || to == null || to.isBlank()) {
            return;
        }
        sendEmail(to, "[Weekly Commit] " + subject, buildHtml(subject, body));
    }

    @Async
    public void sendRawHtmlEmail(String to, String subject, String html) {
        if (!isEnabled() || to == null || to.isBlank()) {
            return;
        }
        sendEmail(to, "[Weekly Commit] " + subject, html);
    }

    private void sendEmail(String to, String subject, String html) {
        try {
            var payload = Map.of(
                "from", fromEmail,
                "to", new String[]{to},
                "subject", subject,
                "html", html
            );

            var requestBody = RequestBody.create(objectMapper.writeValueAsString(payload), JSON);
            var request = new Request.Builder()
                .url(RESEND_API_URL)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .post(requestBody)
                .build();

            try (var response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    log.info("Sent email via Resend to {}: {}", to, subject);
                } else {
                    log.warn("Resend API error for {}: {} {}", to, response.code(),
                        response.body() != null ? response.body().string() : "");
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String subject, String body) {
        return "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;\">"
            + "<div style=\"background: #f5f3f7; border-radius: 16px; padding: 24px;\">"
            + "<h2 style=\"color: #1b1b1e; margin: 0 0 12px;\">" + escapeHtml(subject) + "</h2>"
            + "<p style=\"color: #5f5e5e; margin: 0; line-height: 1.6;\">" + escapeHtml(body) + "</p>"
            + "</div>"
            + "<p style=\"color: #9e9e9e; font-size: 12px; margin-top: 16px; text-align: center;\">Weekly Commit System</p>"
            + "</div>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
