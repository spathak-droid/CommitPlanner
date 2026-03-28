package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @Operation(summary = "List all users")
    @GetMapping("/users")
    public List<AdminUserResponse> getUsers() {
        return adminService.getUsers();
    }

    @Operation(summary = "List all manager-to-user assignments")
    @GetMapping("/assignments")
    public List<ManagerAssignmentResponse> getAssignments() {
        return adminService.getAssignments();
    }

    @Operation(summary = "Create a new user")
    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @Operation(summary = "Update an existing user")
    @PutMapping("/users/{userId}")
    public AdminUserResponse updateUser(@PathVariable String userId, @Valid @RequestBody UpdateUserRequest request) {
        return adminService.updateUser(userId, request);
    }

    @Operation(summary = "Reset a user's password")
    @PutMapping("/users/{userId}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable String userId, @Valid @RequestBody ResetPasswordRequest request) {
        adminService.resetPassword(userId, request);
    }

    @Operation(summary = "Replace all direct reports for a manager")
    @PutMapping("/managers/{managerId}/assignments")
    public ResponseEntity<Void> replaceAssignments(@PathVariable String managerId, @Valid @RequestBody ManagerAssignmentsRequest request) {
        adminService.replaceAssignments(managerId, request);
        return ResponseEntity.noContent().build();
    }
}
