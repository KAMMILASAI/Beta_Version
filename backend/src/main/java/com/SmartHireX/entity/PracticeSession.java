package com.SmartHireX.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "practice_sessions")
public class PracticeSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(length = 20)
    private String type; // mcq, coding, interview
    
    private Integer percentage;
    
    private Integer score;
    
    private Integer totalQuestions;
    
    private Integer correctAnswers;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
