package com.weeklycommit.repository;

import com.weeklycommit.entity.DefiningObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DefiningObjectiveRepository extends JpaRepository<DefiningObjective, UUID> {
    List<DefiningObjective> findByRallyCryId(UUID rallyCryId);
}
