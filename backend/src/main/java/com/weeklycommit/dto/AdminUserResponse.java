package com.weeklycommit.dto;

import com.weeklycommit.enums.UserRole;

public record AdminUserResponse(
    String userId,
    String fullName,
    UserRole role,
    boolean active
) {}
