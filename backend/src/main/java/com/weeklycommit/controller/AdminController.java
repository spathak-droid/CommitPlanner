package com.weeklycommit.controller;

import com.weeklycommit.dto.*;
import com.weeklycommit.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getUsers() {
        return adminService.getUsers();
    }

    @GetMapping("/assignments")
    public List<ManagerAssignmentResponse> getAssignments() {
        return adminService.getAssignments();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @PutMapping("/users/{userId}")
    public AdminUserResponse updateUser(@PathVariable String userId, @Valid @RequestBody UpdateUserRequest request) {
        return adminService.updateUser(userId, request);
    }

    @PutMapping("/users/{userId}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable String userId, @Valid @RequestBody ResetPasswordRequest request) {
        adminService.resetPassword(userId, request);
    }

    @PutMapping("/managers/{managerId}/assignments")
    public ResponseEntity<Void> replaceAssignments(@PathVariable String managerId, @Valid @RequestBody ManagerAssignmentsRequest request) {
        adminService.replaceAssignments(managerId, request);
        return ResponseEntity.noContent().build();
    }
}
