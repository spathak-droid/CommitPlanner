package com.weeklycommit.repository;

import com.weeklycommit.entity.WeeklyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyPlanRepository extends JpaRepository<WeeklyPlan, UUID> {
    Optional<WeeklyPlan> findByUserIdAndWeekStartDate(String userId, LocalDate weekStartDate);
    List<WeeklyPlan> findByUserId(String userId);
    List<WeeklyPlan> findByUserIdInAndWeekStartDate(List<String> userIds, LocalDate weekStartDate);
    List<WeeklyPlan> findByWeekStartDate(LocalDate weekStartDate);
}
