package com.weeklycommit.service;

import com.weeklycommit.entity.AuditLog;
import com.weeklycommit.repository.AuditLogRepository;
import com.weeklycommit.security.AuthContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, String action, Map<String, Object> changes) {
        var user = AuthContextHolder.get();
        String actorId = user != null ? user.userId() : "system";
        String changesJson = changes != null ? toJson(changes) : null;
        auditLogRepository.save(new AuditLog(entityType, entityId, action, actorId, changesJson));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String entityType, UUID entityId, String action) {
        log(entityType, entityId, action, null);
    }

    private String toJson(Map<String, Object> map) {
        return "{" + map.entrySet().stream()
                .map(e -> "\"" + e.getKey() + "\":" + formatValue(e.getValue()))
                .collect(Collectors.joining(",")) + "}";
    }

    private String formatValue(Object value) {
        if (value == null) return "null";
        if (value instanceof String) return "\"" + value.toString().replace("\"", "\\\"") + "\"";
        return value.toString();
    }
}
