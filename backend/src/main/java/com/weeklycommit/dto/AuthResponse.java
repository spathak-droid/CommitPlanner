package com.weeklycommit.dto;

import com.weeklycommit.enums.UserRole;

import java.util.List;

public record AuthResponse(
    String userId,
    String fullName,
    UserRole role,
    String token,
    List<String> managedUserIds
) {}
