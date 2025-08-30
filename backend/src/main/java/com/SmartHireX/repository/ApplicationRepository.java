package com.SmartHireX.repository;

import com.SmartHireX.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByJob_IdAndEmailLower(Long jobId, String emailLower);
    List<Application> findByJob_IdOrderByCreatedAtDesc(Long jobId);
    List<Application> findByEmailLowerOrderByCreatedAtDesc(String emailLower);
}
