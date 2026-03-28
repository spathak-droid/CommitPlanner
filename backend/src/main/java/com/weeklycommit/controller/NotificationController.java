package com.weeklycommit.controller;

import com.weeklycommit.entity.Notification;
import com.weeklycommit.service.NotificationService;
import com.weeklycommit.service.SseEmitterService;
import com.weeklycommit.service.AuthorizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterService sseEmitterService;
    private final AuthorizationService authorizationService;

    public NotificationController(NotificationService notificationService, SseEmitterService sseEmitterService, AuthorizationService authorizationService) {
        this.notificationService = notificationService;
        this.sseEmitterService = sseEmitterService;
        this.authorizationService = authorizationService;
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

    @Operation(summary = "Subscribe to real-time notification stream via SSE")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        String userId = authorizationService.currentUserId();
        return sseEmitterService.subscribe(userId);
    }

    @Operation(summary = "Dismiss (delete) a notification")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void dismiss(@PathVariable UUID id) {
        notificationService.delete(id);
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
