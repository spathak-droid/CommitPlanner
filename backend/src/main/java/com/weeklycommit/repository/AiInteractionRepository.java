package com.weeklycommit.repository;

import com.weeklycommit.entity.AiInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AiInteractionRepository extends JpaRepository<AiInteraction, UUID> {
    List<AiInteraction> findByUserIdAndFeatureOrderByCreatedAtDesc(String userId, String feature);
}
