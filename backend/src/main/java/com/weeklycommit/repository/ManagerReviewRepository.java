package com.weeklycommit.repository;

import com.weeklycommit.entity.ManagerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManagerReviewRepository extends JpaRepository<ManagerReview, UUID> {
    Optional<ManagerReview> findByWeeklyPlanId(UUID weeklyPlanId);
    List<ManagerReview> findByReviewerId(String reviewerId);
}
