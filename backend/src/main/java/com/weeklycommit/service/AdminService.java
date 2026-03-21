package com.weeklycommit.service;

import com.weeklycommit.dto.*;
import com.weeklycommit.entity.AppUser;
import com.weeklycommit.entity.ManagerAssignment;
import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.AppUserRepository;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class AdminService {

    private final AuthorizationService authorizationService;
    private final AppUserRepository userRepository;
    private final ManagerAssignmentRepository assignmentRepository;
    private final PasswordHasher passwordHasher;

    public AdminService(
        AuthorizationService authorizationService,
        AppUserRepository userRepository,
        ManagerAssignmentRepository assignmentRepository,
        PasswordHasher passwordHasher
    ) {
        this.authorizationService = authorizationService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordHasher = passwordHasher;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers() {
        authorizationService.requireManager();
        return userRepository.findAll().stream()
            .map(user -> new AdminUserResponse(user.getUserId(), user.getFullName(), user.getRole(), user.isActive()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ManagerAssignmentResponse> getAssignments() {
        authorizationService.requireManager();
        return assignmentRepository.findAll().stream()
            .map(a -> new ManagerAssignmentResponse(a.getManager().getUserId(), a.getMember().getUserId()))
            .toList();
    }

    public AdminUserResponse createUser(CreateUserRequest request) {
        authorizationService.requireManager();
        if (userRepository.existsById(request.userId().trim())) {
            throw new IllegalArgumentException("User already exists: " + request.userId());
        }

        var user = new AppUser();
        user.setUserId(request.userId().trim());
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setPasswordSalt(passwordHasher.generateSalt());
        user.setPasswordHash(passwordHasher.hashPassword(request.password(), user.getPasswordSalt()));
        user = userRepository.save(user);

        return new AdminUserResponse(user.getUserId(), user.getFullName(), user.getRole(), user.isActive());
    }

    public AdminUserResponse updateUser(String userId, UpdateUserRequest request) {
        authorizationService.requireManager();
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        user.setActive(request.active());
        if (request.role() == UserRole.IC) {
            assignmentRepository.deleteByManagerUserId(user.getUserId());
        }
        user = userRepository.save(user);
        return new AdminUserResponse(user.getUserId(), user.getFullName(), user.getRole(), user.isActive());
    }

    public void resetPassword(String userId, ResetPasswordRequest request) {
        authorizationService.requireManager();
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        String salt = passwordHasher.generateSalt();
        user.setPasswordSalt(salt);
        user.setPasswordHash(passwordHasher.hashPassword(request.password(), salt));
        userRepository.save(user);
    }

    public void replaceAssignments(String managerId, ManagerAssignmentsRequest request) {
        authorizationService.requireManager();
        var manager = userRepository.findById(managerId)
            .orElseThrow(() -> new EntityNotFoundException("Manager not found: " + managerId));
        if (manager.getRole() != UserRole.MANAGER) {
            throw new IllegalArgumentException("Assignments can only be created for managers");
        }

        Set<String> memberIds = request.memberIds().stream().map(String::trim).collect(java.util.stream.Collectors.toSet());
        var members = userRepository.findAllById(memberIds);
        if (members.size() != memberIds.size()) {
            throw new IllegalArgumentException("One or more members were not found");
        }
        boolean hasNonIc = members.stream().anyMatch(user -> user.getRole() != UserRole.IC);
        if (hasNonIc) {
            throw new IllegalArgumentException("Only IC users can be assigned to a manager");
        }

        assignmentRepository.deleteByManagerUserId(managerId);
        assignmentRepository.flush();
        for (var member : members) {
            var assignment = new ManagerAssignment();
            assignment.setManager(manager);
            assignment.setMember(member);
            assignmentRepository.save(assignment);
        }
    }
}
