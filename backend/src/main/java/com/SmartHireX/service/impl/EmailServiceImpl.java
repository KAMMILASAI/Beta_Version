package com.SmartHireX.service.impl;

import com.SmartHireX.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String otp, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SmartHireX - Your OTP Code");

            String htmlContent = buildOtpEmailTemplate(userName, otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to SmartHireX!");

            String htmlContent = buildWelcomeEmailTemplate(userName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Welcome email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send welcome email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send welcome email", e);
        }
    }

    @Override
    public void sendRecruiterPendingEmail(String toEmail, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("SmartHireX - Recruiter Registration Pending Approval");

            String htmlContent = buildRecruiterPendingEmailTemplate(userName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            logger.info("Recruiter pending approval email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send recruiter pending email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send recruiter pending email", e);
        }
    }

    @Override
    public void sendSimpleEmail(String toEmail, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            logger.info("Email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            logger.error("Failed to send email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildOtpEmailTemplate(String userName, String otp) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SmartHireX OTP</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SmartHireX</h1>
                        <p>Your OTP Verification Code</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>You requested an OTP for authentication. Please use the code below to complete your verification:</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">%s</div>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This OTP is valid for 10 minutes only</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this code, please ignore this email</li>
                        </ul>
                        
                        <p>If you have any questions, please contact our support team.</p>
                        
                        <div class="footer">
                            <p>© 2024 SmartHireX. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, userName, otp);
    }

    private String buildWelcomeEmailTemplate(String userName) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to SmartHireX</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .welcome-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; border: 1px solid #ddd; }
                    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to SmartHireX!</h1>
                        <p>Your journey to smart hiring begins now</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>Welcome to SmartHireX! We're excited to have you on board.</p>
                        
                        <div class="welcome-box">
                            <h3>🎉 Account Successfully Created!</h3>
                            <p>Your account has been successfully created and verified. You can now access all features of SmartHireX.</p>
                        </div>
                        
                        <p><strong>What's next?</strong></p>
                        <ul>
                            <li>Complete your profile to get better job matches</li>
                            <li>Browse through thousands of job opportunities</li>
                            <li>Connect with top employers</li>
                            <li>Track your application progress</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="https://smarthirex.netlify.app/dashboard" class="cta-button">Get Started</a>
                        </div>
                        
                        <p>If you have any questions or need assistance, our support team is here to help!</p>
                        
                        <div class="footer">
                            <p>© 2024 SmartHireX. All rights reserved.</p>
                            <p>This email was sent to %s</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, userName, userName);
    }

    private String buildRecruiterPendingEmailTemplate(String userName) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recruiter Registration Pending</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f59e0b 0%%, #ef4444 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .status-box { background: white; padding: 20px; text-align: left; margin: 20px 0; border-radius: 10px; border: 1px solid #ddd; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SmartHireX</h1>
                        <p>Recruiter Registration Pending Approval</p>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>Thank you for registering as a recruiter on SmartHireX.</p>
                        <div class="status-box">
                            <p>Your account is currently <strong>pending admin approval</strong>. Our team will review your request shortly.</p>
                            <p>You'll receive a confirmation email once your account is approved and activated.</p>
                        </div>
                        <p>In the meantime, feel free to explore our platform. You will gain full recruiter access after approval.</p>
                        <p>If you have any questions, contact our support team.</p>
                        <div class="footer">
                            <p>© 2024 SmartHireX. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """, userName);
    }
}
