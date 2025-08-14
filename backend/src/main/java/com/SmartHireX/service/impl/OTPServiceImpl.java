package com.SmartHireX.service.impl;

import com.SmartHireX.entity.OTP;
import com.SmartHireX.repository.OTPRepository;
import com.SmartHireX.service.OTPService;
import com.SmartHireX.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OTPServiceImpl implements OTPService {

    private static final Logger logger = LoggerFactory.getLogger(OTPServiceImpl.class);
    private static final int OTP_LENGTH = 6;
    private static final int MAX_OTP_ATTEMPTS_PER_HOUR = 5;

    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String generateAndSendOTP(String email, String userName, OTP.OTPType type) {
        try {
            // Check rate limiting
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long recentOTPCount = otpRepository.countOTPsCreatedSince(email, oneHourAgo);
            
            if (recentOTPCount >= MAX_OTP_ATTEMPTS_PER_HOUR) {
                throw new RuntimeException("Too many OTP requests. Please try again after an hour.");
            }

            // Invalidate existing OTPs for this email and type
            otpRepository.markAllOTPsAsUsedForEmailAndType(email, type);

            // Generate new OTP
            String otpCode = generateOTPCode();
            
            // Save OTP to database
            OTP otp = new OTP(email, otpCode, type);
            otpRepository.save(otp);

            // Send OTP via email
            emailService.sendOtpEmail(email, otpCode, userName != null ? userName : "User");
            logger.info("OTP generated and sent successfully for email: {} and type: {}", email, type);
            return "OTP sent successfully to your email";
            
        } catch (Exception e) {
            logger.error("Failed to generate and send OTP for email: {} and type: {}", email, type, e);
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }

    @Override
    public boolean verifyOTP(String email, String otpCode) {
        try {
            Optional<OTP> otpOptional = otpRepository.findByEmailAndOtpCodeAndUsedFalse(email, otpCode);
            
            if (otpOptional.isEmpty()) {
                logger.warn("Invalid OTP attempt for email: {}", email);
                return false;
            }

            OTP otp = otpOptional.get();
            
            if (otp.isExpired()) {
                logger.warn("Expired OTP attempt for email: {}", email);
                return false;
            }

            // Mark OTP as used
            otp.setUsed(true);
            otpRepository.save(otp);
            
            logger.info("OTP verified successfully for email: {}", email);
            return true;
        } catch (Exception e) {
            logger.error("Error verifying OTP for email: {}", email, e);
            return false;
        }
    }

    @Override
    public boolean verifyOTPWithType(String email, String otpCode, OTP.OTPType type) {
        try {
            Optional<OTP> otpOptional = otpRepository.findByEmailAndOtpCodeAndTypeAndUsedFalse(email, otpCode, type);
            
            if (otpOptional.isEmpty()) {
                logger.warn("Invalid OTP attempt for email: {} and type: {}", email, type);
                return false;
            }

            OTP otp = otpOptional.get();
            
            if (otp.isExpired()) {
                logger.warn("Invalid or expired OTP attempt for email: {} and type: {}", email, type);
                return false;
            }

            // Mark OTP as used
            otp.setUsed(true);
            otpRepository.save(otp);
            
            logger.info("OTP verified successfully for email: {} and type: {}", email, type);
            return true;
        } catch (Exception e) {
            logger.error("Error verifying OTP for email: {} and type: {}", email, type, e);
            return false;
        }
    }

    @Override
    public boolean hasValidOTP(String email, OTP.OTPType type) {
        try {
            Optional<OTP> otpOptional = otpRepository.findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type);
            return otpOptional.isPresent() && otpOptional.get().isValid();
        } catch (Exception e) {
            logger.error("Error checking valid OTP for email: {} and type: {}", email, type, e);
            return false;
        }
    }

    private String generateOTPCode() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(secureRandom.nextInt(10));
        }
        return otp.toString();
    }

    // Clean up expired OTPs every hour
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void cleanupExpiredOTPs() {
        try {
            otpRepository.deleteExpiredOTPs(LocalDateTime.now());
            logger.info("Expired OTPs cleaned up successfully");
        } catch (Exception e) {
            logger.error("Error cleaning up expired OTPs", e);
        }
    }
}
