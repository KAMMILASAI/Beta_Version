package com.SmartHireX.repository;

import com.SmartHireX.entity.PracticeSession;
import com.SmartHireX.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    List<PracticeSession> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT p FROM PracticeSession p WHERE p.user = :user ORDER BY p.createdAt DESC")
    List<PracticeSession> findByUserWithLimit(@Param("user") User user, org.springframework.data.domain.Pageable pageable);
    
    long countByUser(User user);

    @Modifying
    @Transactional
    long deleteByUser_Id(Long userId);
}
