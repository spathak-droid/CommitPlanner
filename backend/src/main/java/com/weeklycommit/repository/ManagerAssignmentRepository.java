package com.weeklycommit.repository;

import com.weeklycommit.entity.ManagerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManagerAssignmentRepository extends JpaRepository<ManagerAssignment, UUID> {
    List<ManagerAssignment> findByManagerUserId(String managerId);
    List<ManagerAssignment> findByMemberUserId(String memberId);
    Optional<ManagerAssignment> findByManagerUserIdAndMemberUserId(String managerId, String memberId);
    void deleteByManagerUserId(String managerId);
}
