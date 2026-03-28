package com.weeklycommit.repository;

import com.weeklycommit.entity.CommitTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CommitTemplateRepository extends JpaRepository<CommitTemplate, UUID> {
    List<CommitTemplate> findByUserIdOrderByCreatedAtDesc(String userId);
}
