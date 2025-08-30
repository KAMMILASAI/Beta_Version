package com.SmartHireX.service;

import com.SmartHireX.entity.Chat;
import com.SmartHireX.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;

    public AdminService(UserRepository userRepository,
                        CandidateProfileRepository candidateProfileRepository,
                        PracticeSessionRepository practiceSessionRepository,
                        PaymentRepository paymentRepository,
                        NotificationReadRepository notificationReadRepository,
                        MessageRepository messageRepository,
                        ChatRepository chatRepository) {
        this.userRepository = userRepository;
        this.candidateProfileRepository = candidateProfileRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.paymentRepository = paymentRepository;
        this.notificationReadRepository = notificationReadRepository;
        this.messageRepository = messageRepository;
        this.chatRepository = chatRepository;
    }

    @Transactional
    public boolean hardDeleteUser(Long userId) {
        return userRepository.findById(userId).map(user -> {
            String email = user.getEmail();

            // Notification read receipts (by email)
            try { long n = notificationReadRepository.deleteByUserEmail(email); log.info("Deleted {} notification_reads for {}", n, email); } catch (Exception e) { log.warn("notification_reads cleanup failed: {}", e.getMessage()); }

            // Practice sessions
            try { long n = practiceSessionRepository.deleteByUser_Id(userId); log.info("Deleted {} practice_sessions for user {}", n, userId); } catch (Exception e) { log.warn("practice_sessions cleanup failed: {}", e.getMessage()); }

            // Payments
            try { long n = paymentRepository.deleteByUser_Id(userId); log.info("Deleted {} payments for user {}", n, userId); } catch (Exception e) { log.warn("payments cleanup failed: {}", e.getMessage()); }

            // Candidate profile
            try { long n = candidateProfileRepository.deleteByUserId(userId); log.info("Deleted {} candidate_profiles for user {}", n, userId); } catch (Exception e) { log.warn("candidate_profile cleanup failed: {}", e.getMessage()); }

            // Messages sent by this user
            try { long n = messageRepository.deleteBySender_Id(userId); log.info("Deleted {} messages (as sender) for user {}", n, userId); } catch (Exception e) { log.warn("messages (sender) cleanup failed: {}", e.getMessage()); }

            // Chat participation and orphan chat cleanup
            try {
                List<Chat> chats = chatRepository.findByParticipants_Id(userId);
                for (Chat c : chats) {
                    // remove user from participants
                    c.getParticipants().removeIf(u -> u.getId().equals(userId));
                    if (c.getParticipants().isEmpty()) {
                        // delete messages of this chat and then chat
                        long m = messageRepository.deleteByChat_Id(c.getId());
                        log.info("Deleted {} messages of orphan chat {}", m, c.getId());
                        chatRepository.delete(c);
                        log.info("Deleted orphan chat {}", c.getId());
                    } else {
                        chatRepository.save(c);
                    }
                }
            } catch (Exception e) {
                log.warn("chat cleanup failed: {}", e.getMessage());
            }

            // Finally delete the user
            userRepository.deleteById(userId);
            log.info("Hard-deleted user {} ({})", userId, email);
            return true;
        }).orElse(false);
    }
}
