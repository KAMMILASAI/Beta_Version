package com.SmartHireX.repository;

import com.SmartHireX.entity.User;
import com.SmartHireX.model.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.Instant;

public interface JobRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByRecruiterOrderByCreatedAtDesc(User recruiter);

    @Query("SELECT j FROM JobPosting j WHERE j.status = 'active' AND (j.expiresAt IS NULL OR j.expiresAt > :now) ORDER BY j.createdAt DESC")
    List<JobPosting> findActiveNonExpired(@Param("now") Instant now);

    // Public job access via unique shareable link
    java.util.Optional<JobPosting> findByLinkId(String linkId);
}
