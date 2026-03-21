package com.weeklycommit.repository;

import com.weeklycommit.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByUserIdAndActiveTrue(String userId);
}
