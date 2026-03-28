package com.weeklycommit.service;

import com.weeklycommit.entity.Notification;
import com.weeklycommit.entity.WeeklyPlan;
import com.weeklycommit.enums.PlanStatus;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.NotificationRepository;
import com.weeklycommit.repository.WeeklyPlanRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final AuthorizationService authorizationService;
    private final SseEmitterService sseEmitterService;
    private final WeeklyPlanRepository weeklyPlanRepo;
    private final AppUserRepository userRepo;
    private final EmailService emailService;

    public NotificationService(NotificationRepository notificationRepo, AuthorizationService authorizationService, SseEmitterService sseEmitterService, WeeklyPlanRepository weeklyPlanRepo, AppUserRepository userRepo, EmailService emailService) {
        this.notificationRepo = notificationRepo;
        this.authorizationService = authorizationService;
        this.sseEmitterService = sseEmitterService;
        this.weeklyPlanRepo = weeklyPlanRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

    public Notification send(String recipientUserId, String type, String title, String message) {
        var senderId = authorizationService.currentUserId();
        var n = new Notification();
        n.setRecipientUserId(recipientUserId);
        n.setSenderUserId(senderId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        var saved = notificationRepo.save(n);
        sseEmitterService.push(recipientUserId, saved);
        sendEmailIfEnabled(recipientUserId, title, message);
        return saved;
    }

    public Notification sendSystem(String recipientUserId, String type, String title, String message) {
        var n = new Notification();
        n.setRecipientUserId(recipientUserId);
        n.setSenderUserId("SYSTEM");
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        var saved = notificationRepo.save(n);
        sseEmitterService.push(recipientUserId, saved);
        sendEmailIfEnabled(recipientUserId, title, message);
        return saved;
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
            var saved = notificationRepo.save(n);
            sseEmitterService.push(recipientId, saved);
            sendEmailIfEnabled(recipientId, n.getTitle(), n.getMessage());
        }
    }

    private void sendEmailIfEnabled(String recipientUserId, String title, String message) {
        var user = userRepo.findById(recipientUserId).orElse(null);
        if (user != null && user.getEmail() != null && user.isEmailNotificationsEnabled()) {
            emailService.sendNotificationEmail(user.getEmail(), title, message != null ? message : "");
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

    public void delete(UUID notificationId) {
        var n = notificationRepo.findById(notificationId)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Notification not found"));
        if (!n.getRecipientUserId().equals(authorizationService.currentUserId())) {
            throw new IllegalArgumentException("Not your notification");
        }
        notificationRepo.delete(n);
    }

    @Scheduled(cron = "0 0 9 * * WED")
    @Transactional
    public void sendWeeklyNudges() {
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        List<WeeklyPlan> draftPlans = weeklyPlanRepo.findByWeekStartDate(monday).stream()
            .filter(p -> p.getStatus() == PlanStatus.DRAFT)
            .toList();
        for (var plan : draftPlans) {
            var n = new Notification();
            n.setRecipientUserId(plan.getUserId());
            n.setSenderUserId("SYSTEM");
            n.setType("NUDGE");
            n.setTitle("Weekly plan reminder");
            n.setMessage("Your plan for the week of " + monday + " is still in DRAFT. Please finalize and lock your commitments.");
            var saved = notificationRepo.save(n);
            sseEmitterService.push(plan.getUserId(), saved);
            sendEmailIfEnabled(plan.getUserId(), n.getTitle(), n.getMessage());
        }
    }
}
