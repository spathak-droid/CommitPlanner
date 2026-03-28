package com.weeklycommit.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    UUID commitId,
    String authorUserId,
    String authorName,
    String body,
    UUID parentCommentId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
