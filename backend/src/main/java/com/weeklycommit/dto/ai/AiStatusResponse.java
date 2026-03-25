package com.weeklycommit.dto.ai;

public record AiStatusResponse(
    boolean enabled,
    String model
) {}
