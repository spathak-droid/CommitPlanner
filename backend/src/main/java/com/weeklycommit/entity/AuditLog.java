package com.weeklycommit.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "actor_user_id", nullable = false)
    private String actorUserId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String changes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String entityType, UUID entityId, String action, String actorUserId, String changes) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.actorUserId = actorUserId;
        this.changes = changes;
    }

    // Getters
    public UUID getId() { return id; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getAction() { return action; }
    public String getActorUserId() { return actorUserId; }
    public String getChanges() { return changes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
