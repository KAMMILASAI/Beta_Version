package com.SmartHireX.controller;

import com.SmartHireX.entity.Notification;
import com.SmartHireX.repository.NotificationRepository;
import com.SmartHireX.entity.NotificationRead;
import com.SmartHireX.repository.NotificationReadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;

    public NotificationController(NotificationRepository notificationRepository,
                                  NotificationReadRepository notificationReadRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationReadRepository = notificationReadRepository;
    }

    // Public feed: returns union of 'all' and the provided audience (candidate/recruiter)
    @GetMapping
    public ResponseEntity<List<Notification>> getFeed(@RequestParam(value = "audience", required = false) String audience) {
        List<Notification> allList = notificationRepository.findByAudienceIgnoreCaseOrderByCreatedAtDesc("all");
        if (audience == null || audience.isBlank()) {
            return ResponseEntity.ok(allList);
        }
        List<Notification> roleList = notificationRepository.findByAudienceIgnoreCaseOrderByCreatedAtDesc(audience);
        // merge by id, keep order by createdAt desc
        Set<Long> seen = new HashSet<>();
        List<Notification> merged = new ArrayList<>();
        for (Notification n : allList) {
            if (n.getId() != null && seen.add(n.getId())) merged.add(n);
        }
        for (Notification n : roleList) {
            if (n.getId() != null && seen.add(n.getId())) merged.add(n);
        }
        merged.sort(Comparator.comparing(Notification::getCreatedAt).reversed());
        return ResponseEntity.ok(merged);
    }

    // Mark a notification as read for a user (identified by email)
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable("id") Long id,
                                      @RequestParam("email") String email) {
        if (email == null || email.isBlank()) return ResponseEntity.badRequest().build();
        if (!notificationRepository.existsById(id)) return ResponseEntity.notFound().build();
        if (!notificationReadRepository.existsByNotificationIdAndUserEmail(id, email)) {
            NotificationRead nr = new NotificationRead();
            nr.setNotificationId(id);
            nr.setUserEmail(email);
            notificationReadRepository.save(nr);
        }
        return ResponseEntity.noContent().build();
    }

    // Get all read notification IDs for a user
    @GetMapping("/read-ids")
    public ResponseEntity<List<Long>> getReadIds(@RequestParam("email") String email) {
        if (email == null || email.isBlank()) return ResponseEntity.ok(List.of());
        List<Long> ids = notificationReadRepository.findByUserEmail(email)
                .stream().map(NotificationRead::getNotificationId).toList();
        return ResponseEntity.ok(ids);
    }
}
