package com.weeklycommit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    private boolean isEnabled() {
        return mailSender != null && host != null && !host.isBlank();
    }

    @Async
    public void sendNotificationEmail(String to, String subject, String body) {
        if (!isEnabled() || to == null || to.isBlank()) {
            return;
        }
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("[Weekly Commit] " + subject);
            helper.setText(buildHtml(subject, body), true);
            mailSender.send(message);
            log.info("Sent notification email to {}: {}", to, subject);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private String buildHtml(String subject, String body) {
        return """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="background: #f5f3f7; border-radius: 16px; padding: 24px;">
                    <h2 style="color: #1b1b1e; margin: 0 0 12px;">%s</h2>
                    <p style="color: #5f5e5e; margin: 0; line-height: 1.6;">%s</p>
                </div>
                <p style="color: #9e9e9e; font-size: 12px; margin-top: 16px; text-align: center;">Weekly Commit System</p>
            </div>
            """.formatted(subject, body);
    }
}
