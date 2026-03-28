package com.weeklycommit.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "commit_comments")
public class CommitComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "commit_id", nullable = false)
    private UUID commitId;

    @Column(name = "author_user_id", nullable = false, length = 255)
    private String authorUserId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "parent_comment_id")
    private UUID parentCommentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCommitId() { return commitId; }
    public void setCommitId(UUID commitId) { this.commitId = commitId; }
    public String getAuthorUserId() { return authorUserId; }
    public void setAuthorUserId(String authorUserId) { this.authorUserId = authorUserId; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public UUID getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(UUID parentCommentId) { this.parentCommentId = parentCommentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PreUpdate
    protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
