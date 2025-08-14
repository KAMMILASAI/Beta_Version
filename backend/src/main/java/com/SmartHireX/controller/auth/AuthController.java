package com.SmartHireX.controller.auth;

import com.SmartHireX.dto.response.AuthResponse;
import com.SmartHireX.dto.request.LoginRequest;
import com.SmartHireX.dto.request.RegisterRequest;
import com.SmartHireX.dto.request.OTPRequest;
import com.SmartHireX.dto.request.OTPVerificationRequest;
import com.SmartHireX.dto.request.ResetPasswordRequest;
import com.SmartHireX.entity.User;
import com.SmartHireX.entity.OTP;
import com.SmartHireX.security.JwtTokenProvider;
import com.SmartHireX.service.UserService;
import com.SmartHireX.service.OTPService;
import com.SmartHireX.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private OTPService otpService;

    @Autowired
    private EmailService emailService;

    // Send OTP for registration
    @PostMapping("/send-registration-otp")
    public ResponseEntity<?> sendRegistrationOTP(@Valid @RequestBody OTPRequest otpRequest) {
        try {
            if (userService.existsByEmail(otpRequest.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email is already registered!")
                );
            }
            
            String name = otpRequest.getName() != null ? otpRequest.getName() : "User";
            String message = otpService.generateAndSendOTP(otpRequest.getEmail(), name, OTP.OTPType.REGISTRATION);
            
            return ResponseEntity.ok(Collections.singletonMap("message", message));
        } catch (Exception e) {
            logger.error("Error sending registration OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Verify OTP for registration
    @PostMapping("/verify-registration-otp")
    public ResponseEntity<?> verifyRegistrationOTP(@Valid @RequestBody OTPVerificationRequest request) {
        try {
            // For registration, we don't check if user exists since they're registering
            boolean isValid = otpService.verifyOTPWithType(request.getEmail(), request.getOtp(), OTP.OTPType.REGISTRATION);
            
            if (isValid) {
                return ResponseEntity.ok(Collections.singletonMap("message", "OTP verified successfully"));
            } else {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Invalid or expired OTP")
                );
            }
        } catch (Exception e) {
            logger.error("Error verifying registration OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Verify OTP and register user
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userService.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email is already taken!")
                );
            }
            
            // OTP verification is handled separately via /verify-registration-otp endpoint
            // No need to verify OTP again here since it was already verified
            
            User user = userService.createUser(registerRequest);
            
            // Send welcome email
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
            } catch (Exception e) {
                logger.warn("Failed to send welcome email to: {}", user.getEmail(), e);
            }
            
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    registerRequest.getEmail(),
                    registerRequest.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            return ResponseEntity.ok(new AuthResponse(jwt, "Bearer", user));
        } catch (Exception e) {
            logger.error("Error during registration", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        
        User user = userService.findByEmail(loginRequest.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        return ResponseEntity.ok(new AuthResponse(jwt, "Bearer", user));
    }

    // Send OTP for forgot password
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody OTPRequest otpRequest) {
        try {
            if (!userService.existsByEmail(otpRequest.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email not found!")
                );
            }
            
            User user = userService.findByEmail(otpRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String message = otpService.generateAndSendOTP(otpRequest.getEmail(), user.getFirstName(), OTP.OTPType.PASSWORD_RESET);
            
            return ResponseEntity.ok(Collections.singletonMap("message", message));
        } catch (Exception e) {
            logger.error("Error sending forgot password OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Verify OTP for forgot password
    @PostMapping("/verify-forgot-password-otp")
    public ResponseEntity<?> verifyForgotPasswordOTP(@Valid @RequestBody OTPVerificationRequest request) {
        try {
            if (!userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email not found!")
                );
            }
            
            boolean isValid = otpService.verifyOTPWithType(request.getEmail(), request.getOtp(), OTP.OTPType.PASSWORD_RESET);
            
            if (isValid) {
                return ResponseEntity.ok(Collections.singletonMap("message", "OTP verified successfully"));
            } else {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Invalid or expired OTP")
                );
            }
        } catch (Exception e) {
            logger.error("Error verifying forgot password OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Reset password with OTP
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            if (!userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email not found!")
                );
            }
            
            // Verify OTP
            if (!otpService.verifyOTPWithType(request.getEmail(), request.getOtp(), OTP.OTPType.PASSWORD_RESET)) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Invalid or expired OTP")
                );
            }
            
            // Reset password
            userService.resetPassword(request.getEmail(), request.getNewPassword());
            
            return ResponseEntity.ok(Collections.singletonMap("message", "Password reset successfully"));
        } catch (Exception e) {
            logger.error("Error resetting password", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Send OTP for login (optional 2FA)
    @PostMapping("/send-login-otp")
    public ResponseEntity<?> sendLoginOTP(@Valid @RequestBody OTPRequest otpRequest) {
        try {
            if (!userService.existsByEmail(otpRequest.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email not found!")
                );
            }
            
            User user = userService.findByEmail(otpRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String message = otpService.generateAndSendOTP(otpRequest.getEmail(), user.getFirstName(), OTP.OTPType.LOGIN);
            
            return ResponseEntity.ok(Collections.singletonMap("message", message));
        } catch (Exception e) {
            logger.error("Error sending login OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    // Verify OTP for login
    @PostMapping("/verify-login-otp")
    public ResponseEntity<?> verifyLoginOTP(@Valid @RequestBody OTPVerificationRequest request) {
        try {
            if (!userService.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Email not found!")
                );
            }
            
            boolean isValid = otpService.verifyOTPWithType(request.getEmail(), request.getOtp(), OTP.OTPType.LOGIN);
            
            if (isValid) {
                User user = userService.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                // Create authentication token
                Authentication authentication = new UsernamePasswordAuthenticationToken(
                    user.getEmail(), null, Collections.emptyList()
                );
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                String jwt = tokenProvider.generateToken(authentication);
                
                return ResponseEntity.ok(new AuthResponse(jwt, "Bearer", user));
            } else {
                return ResponseEntity.badRequest().body(
                    Collections.singletonMap("message", "Invalid or expired OTP")
                );
            }
        } catch (Exception e) {
            logger.error("Error verifying login OTP", e);
            return ResponseEntity.badRequest().body(
                Collections.singletonMap("message", e.getMessage())
            );
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userService.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        return ResponseEntity.ok(user);
    }
}
