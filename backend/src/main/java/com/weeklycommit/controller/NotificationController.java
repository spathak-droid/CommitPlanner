package com.weeklycommit.controller;

import com.weeklycommit.entity.Notification;
import com.weeklycommit.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Operation(summary = "Get notifications for the current user")
    @GetMapping
    public List<Notification> getMyNotifications() {
        return notificationService.getMyNotifications();
    }

    @Operation(summary = "Get unread notification count")
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return Map.of("count", notificationService.getUnreadCount());
    }

    @Operation(summary = "Mark all notifications as read")
    @PostMapping("/mark-all-read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllRead();
    }

    @Operation(summary = "Mark a single notification as read")
    @PostMapping("/{id}/mark-read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@PathVariable UUID id) {
        notificationService.markRead(id);
    }

    @Operation(summary = "Send a nudge notification to team members")
    @PostMapping("/nudge")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> nudge(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        var userIds = (List<String>) body.get("userIds");
        var weekLabel = (String) body.getOrDefault("weekLabel", "this week");
        notificationService.sendNudge(userIds, weekLabel);
        return Map.of("message", "Nudge sent to " + userIds.size() + " team member(s)");
    }
}
