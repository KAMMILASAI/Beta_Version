
package com.SmartHireX.security.OAuth2;

import com.SmartHireX.entity.User;
import com.SmartHireX.repository.UserRepository;
// Removed OTPService and EmailService as they are no longer used here
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;
    
    // No additional services required here

    // Do not autowire HttpServletRequest here to avoid thread-bound issues

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String email = oauth2User.getAttribute("email");
        
        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }
        
        // Check if user exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        
        if (existingUser.isPresent()) {
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
            // Do not touch role here; role and new-user flow handled in success handler

            if (changed) {
                userRepository.save(user);
            }
        } else {
            // For non-existing users, do not create here. Let success handler decide.
        }
        
        return new CustomOAuth2User(oauth2User, userRequest.getClientRegistration().getClientName());
    }
}
