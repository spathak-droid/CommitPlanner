package com.weeklycommit.dto;

import com.weeklycommit.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
    @NotBlank String fullName,
    @NotNull UserRole role,
    @NotNull Boolean active
) {}
