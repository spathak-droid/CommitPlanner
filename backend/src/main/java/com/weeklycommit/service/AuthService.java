package com.weeklycommit.service;

import com.weeklycommit.dto.AuthResponse;
import com.weeklycommit.dto.LoginRequest;
import com.weeklycommit.exception.InvalidCredentialsException;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.security.AuthTokenService;
import com.weeklycommit.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final AppUserRepository userRepository;
    private final ManagerAssignmentRepository assignmentRepository;
    private final PasswordHasher passwordHasher;
    private final AuthTokenService tokenService;
    private final CurrentUserProvider currentUserProvider;

    public AuthService(
        AppUserRepository userRepository,
        ManagerAssignmentRepository assignmentRepository,
        PasswordHasher passwordHasher,
        AuthTokenService tokenService,
        CurrentUserProvider currentUserProvider
    ) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
        this.currentUserProvider = currentUserProvider;
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByUserIdAndActiveTrue(request.userId().trim())
            .orElseThrow(() -> new InvalidCredentialsException("Invalid user ID or password"));

        if (!passwordHasher.matches(request.password(), user.getPasswordSalt(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid user ID or password");
        }

        return buildResponse(user.getUserId());
    }

    public AuthResponse currentUser() {
        return buildResponse(currentUserProvider.requireUser().userId());
    }

    private AuthResponse buildResponse(String userId) {
        var user = userRepository.findByUserIdAndActiveTrue(userId)
            .orElseThrow(() -> new InvalidCredentialsException("Invalid user"));
        var managedUserIds = assignmentRepository.findByManagerUserId(user.getUserId()).stream()
            .map(assignment -> assignment.getMember().getUserId())
            .sorted()
            .toList();
        return new AuthResponse(
            user.getUserId(),
            user.getFullName(),
            user.getRole(),
            tokenService.issueToken(user.getUserId()),
            managedUserIds
        );
    }
}
