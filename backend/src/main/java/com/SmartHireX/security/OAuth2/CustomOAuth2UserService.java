
package com.SmartHireX.security.OAuth2;

import com.SmartHireX.entity.User;
import com.SmartHireX.repository.UserRepository;
import com.SmartHireX.service.OTPService;
import com.SmartHireX.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.time.LocalDateTime;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OTPService otpService;
    
    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        
        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }
        
        // Check if user exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isEmpty()) {
            // Create new user with OAuth2 details
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setOAuth2Provider(userRequest.getClientRegistration().getRegistrationId());
            
            // Set name if available
            if (name != null && !name.isEmpty()) {
                String[] nameParts = name.split(" ", 2);
                newUser.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    newUser.setLastName(nameParts[1]);
                }
            } else {
                // Set default name if not provided
                newUser.setFirstName("User");
            }
            
            // Mark email as verified and account as verified for OAuth2 users
            newUser.setEmailVerified(true);
            newUser.setVerified(true);
            
            // Set default role
            newUser.setRole("candidate");
            
            // Set default phone number for OAuth2 users
            newUser.setPhone("0000000000");
            
            // Set timestamps
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());
            
            // Ensure non-null password to satisfy DB constraint for OAuth2 accounts
            // This placeholder is never used for login; real auth is via OAuth2
            newUser.setPassword("OAUTH2_USER");
            
            // Save the new user
            User savedUser = userRepository.save(newUser);
            
            try {
                // Send welcome email
                emailService.sendWelcomeEmail(savedUser.getEmail(), 
                    savedUser.getFirstName() != null ? savedUser.getFirstName() : "User");
            } catch (Exception e) {
                // Log but don't fail authentication if email fails
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }
        } else {
            // Update existing user's details to reflect OAuth2 login status
            User user = existingUser.get();
            boolean changed = false;

            if (user.getOAuth2Provider() == null || user.getOAuth2Provider().isEmpty()) {
                user.setOAuth2Provider(userRequest.getClientRegistration().getRegistrationId());
                changed = true;
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
                changed = true;
            }
            if (!user.isVerified()) {
                user.setVerified(true);
                changed = true;
            }
            if (user.getRole() == null || user.getRole().isBlank()) {
                user.setRole("candidate");
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
            }
        }
        
        return new CustomOAuth2User(oauth2User, userRequest.getClientRegistration().getClientName());
    }
}
