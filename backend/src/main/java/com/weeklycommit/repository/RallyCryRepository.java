package com.weeklycommit.repository;

import com.weeklycommit.entity.RallyCry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RallyCryRepository extends JpaRepository<RallyCry, UUID> {
    List<RallyCry> findByActiveTrue();
}
