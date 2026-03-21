package com.weeklycommit.dto;

import com.weeklycommit.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
    @NotBlank String userId,
    @NotBlank String fullName,
    @NotNull UserRole role,
    @NotBlank String password
) {}
