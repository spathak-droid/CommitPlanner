package com.weeklycommit.security;

import com.weeklycommit.enums.UserRole;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProvider {

    public AuthenticatedUser requireUser() {
        var user = AuthContextHolder.get();
        if (user == null) {
            throw new IllegalStateException("No authenticated user in request context");
        }
        return user;
    }

    public AuthenticatedUser requireManager() {
        var user = requireUser();
        if (user.role() != UserRole.MANAGER) {
            throw new IllegalArgumentException("Manager access required");
        }
        return user;
    }
}
