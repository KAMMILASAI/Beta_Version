package com.SmartHireX.service;

public interface EmailService {
    
    /**
     * Send OTP email to the specified email address
     * @param toEmail The recipient email address
     * @param otp The OTP code to send
     * @param userName The name of the user
     */
    void sendOtpEmail(String toEmail, String otp, String userName);
    
    /**
     * Send welcome email to new users
     * @param toEmail The recipient email address
     * @param userName The name of the user
     */
    void sendWelcomeEmail(String toEmail, String userName);
    
    /**
     * Send simple text email
     * @param toEmail The recipient email address
     * @param subject The email subject
     * @param text The email content
     */
    void sendSimpleEmail(String toEmail, String subject, String text);
}
