package com.SmartHireX.repository;

import com.SmartHireX.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {
    boolean existsByNotificationIdAndUserEmail(Long notificationId, String userEmail);
    Optional<NotificationRead> findByNotificationIdAndUserEmail(Long notificationId, String userEmail);
    List<NotificationRead> findByUserEmail(String userEmail);

    @Modifying
    @Transactional
    long deleteByUserEmail(String userEmail);
}
