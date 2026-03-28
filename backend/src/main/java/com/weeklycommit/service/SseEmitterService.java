package com.weeklycommit.service;

import com.weeklycommit.entity.Notification;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseEmitterService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emitters.put(userId, emitter);
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(e -> emitters.remove(userId));
        return emitter;
    }

    public void push(String userId, Notification notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(Map.of(
                                "id", notification.getId().toString(),
                                "type", notification.getType(),
                                "title", notification.getTitle(),
                                "message", notification.getMessage() != null ? notification.getMessage() : "",
                                "createdAt", notification.getCreatedAt().toString()
                        )));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }
}
