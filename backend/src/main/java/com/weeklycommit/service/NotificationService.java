package com.weeklycommit.service;

import com.weeklycommit.entity.Notification;
import com.weeklycommit.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final AuthorizationService authorizationService;

    public NotificationService(NotificationRepository notificationRepo, AuthorizationService authorizationService) {
        this.notificationRepo = notificationRepo;
        this.authorizationService = authorizationService;
    }

    public Notification send(String recipientUserId, String type, String title, String message) {
        var senderId = authorizationService.currentUserId();
        var n = new Notification();
        n.setRecipientUserId(recipientUserId);
        n.setSenderUserId(senderId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        return notificationRepo.save(n);
    }

    public void sendNudge(List<String> recipientUserIds, String weekLabel) {
        var senderId = authorizationService.currentUserId();
        for (var recipientId : recipientUserIds) {
            var n = new Notification();
            n.setRecipientUserId(recipientId);
            n.setSenderUserId(senderId);
            n.setType("NUDGE");
            n.setTitle("Plan reminder from your manager");
            n.setMessage("Your manager is requesting you submit your weekly plan for " + weekLabel + ". Please create and lock your commitments.");
            notificationRepo.save(n);
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> getMyNotifications() {
        var userId = authorizationService.currentUserId();
        return notificationRepo.findByRecipientUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        var userId = authorizationService.currentUserId();
        return notificationRepo.countByRecipientUserIdAndReadFalse(userId);
    }

    public void markAllRead() {
        var userId = authorizationService.currentUserId();
        notificationRepo.markAllReadForUser(userId);
    }

    public void markRead(UUID notificationId) {
        var n = notificationRepo.findById(notificationId)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Notification not found"));
        if (!n.getRecipientUserId().equals(authorizationService.currentUserId())) {
            throw new IllegalArgumentException("Not your notification");
        }
        n.setRead(true);
        notificationRepo.save(n);
    }
}
