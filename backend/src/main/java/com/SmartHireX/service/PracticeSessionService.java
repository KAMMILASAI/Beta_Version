package com.SmartHireX.service;

import com.SmartHireX.entity.PracticeSession;
import com.SmartHireX.entity.User;
import com.SmartHireX.repository.PracticeSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class PracticeSessionService {

    @Autowired
    private PracticeSessionRepository practiceSessionRepository;

    public PracticeSession saveSession(PracticeSession session) {
        return practiceSessionRepository.save(session);
    }

    public List<PracticeSession> generateDynamicPracticeSessions(User user, int count) {
        List<PracticeSession> existingSessions = practiceSessionRepository.findByUserOrderByCreatedAtDesc(user);
        
        // If user has no practice sessions, generate some dynamic ones
        if (existingSessions.isEmpty()) {
            List<PracticeSession> sessions = new ArrayList<>();
            Random random = new Random();
            String[] types = {"mcq", "coding", "interview"};
            
            for (int i = 0; i < count; i++) {
                PracticeSession session = new PracticeSession();
                session.setUser(user);
                session.setType(types[random.nextInt(types.length)]);
                
                // Generate realistic scores
                int baseScore = 60 + random.nextInt(35); // 60-95%
                session.setPercentage(baseScore);
                session.setScore(baseScore);
                
                // Generate questions based on type
                int totalQuestions = switch (session.getType()) {
                    case "mcq" -> 20 + random.nextInt(10); // 20-30 questions
                    case "coding" -> 3 + random.nextInt(3); // 3-5 questions
                    case "interview" -> 5 + random.nextInt(5); // 5-10 questions
                    default -> 10;
                };
                
                session.setTotalQuestions(totalQuestions);
                session.setCorrectAnswers((int) (totalQuestions * (baseScore / 100.0)));
                
                // Set creation time (spread over last 30 days)
                LocalDateTime createdAt = LocalDateTime.now().minusDays(random.nextInt(30));
                session.setCreatedAt(createdAt);
                
                sessions.add(session);
            }
            
            // Save all sessions
            sessions = practiceSessionRepository.saveAll(sessions);
            return sessions;
        }
        
        return existingSessions;
    }

    public List<PracticeSession> getPracticeHistory(User user, int limit) {
        // Return only real sessions from DB; do NOT generate mock data
        return practiceSessionRepository.findByUserWithLimit(user, PageRequest.of(0, limit));
    }

    public long getTotalSessionCount(User user) {
        // Report the true count only; do NOT seed mock sessions
        return practiceSessionRepository.countByUser(user);
    }

    public int calculateDailyStreak(User user) {
        List<PracticeSession> sessions = practiceSessionRepository.findByUserOrderByCreatedAtDesc(user);
        if (sessions.isEmpty()) return 0;
        
        int streak = 0;
        LocalDateTime currentDate = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        for (PracticeSession session : sessions) {
            LocalDateTime sessionDate = session.getCreatedAt().withHour(0).withMinute(0).withSecond(0).withNano(0);
            long daysDiff = java.time.Duration.between(sessionDate, currentDate).toDays();
            
            if (daysDiff == streak) {
                streak++;
                currentDate = currentDate.minusDays(1);
            } else if (daysDiff > streak) {
                break;
            }
        }
        
        return streak;
    }
}
