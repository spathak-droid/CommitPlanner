package com.weeklycommit.security;

import com.weeklycommit.enums.UserRole;

public record AuthenticatedUser(
    String userId,
    String fullName,
    UserRole role
) {}
