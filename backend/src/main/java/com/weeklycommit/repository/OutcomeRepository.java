package com.weeklycommit.repository;

import com.weeklycommit.entity.Outcome;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OutcomeRepository extends JpaRepository<Outcome, UUID> {
    List<Outcome> findByDefiningObjectiveId(UUID definingObjectiveId);
}
