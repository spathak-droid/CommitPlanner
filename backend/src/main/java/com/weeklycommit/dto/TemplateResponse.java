package com.weeklycommit.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TemplateResponse(
    UUID id,
    String name,
    String commits,
    LocalDateTime createdAt
) {}
