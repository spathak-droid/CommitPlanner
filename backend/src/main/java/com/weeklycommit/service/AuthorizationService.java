package com.weeklycommit.service;

import com.weeklycommit.enums.UserRole;
import com.weeklycommit.repository.ManagerAssignmentRepository;
import com.weeklycommit.security.CurrentUserProvider;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final CurrentUserProvider currentUserProvider;
    private final ManagerAssignmentRepository assignmentRepository;

    public AuthorizationService(CurrentUserProvider currentUserProvider, ManagerAssignmentRepository assignmentRepository) {
        this.currentUserProvider = currentUserProvider;
        this.assignmentRepository = assignmentRepository;
    }

    public String currentUserId() {
        return currentUserProvider.requireUser().userId();
    }

    public void requireManager() {
        currentUserProvider.requireManager();
    }

    public void requireCanAccessUser(String targetUserId) {
        var currentUser = currentUserProvider.requireUser();
        if (currentUser.role() == UserRole.MANAGER) {
            if (currentUser.userId().equals(targetUserId)) return;
            boolean managesUser = assignmentRepository.findByManagerUserIdAndMemberUserId(currentUser.userId(), targetUserId).isPresent();
            if (!managesUser) {
                throw new IllegalArgumentException("You do not have access to this user");
            }
            return;
        }

        if (!currentUser.userId().equals(targetUserId)) {
            throw new IllegalArgumentException("You do not have access to this user");
        }
    }
}
