package com.SmartHireX.controller.user;

import com.SmartHireX.dto.request.ProfileUpdateRequest;
import com.SmartHireX.entity.User;
import com.SmartHireX.security.UserPrincipal;
import com.SmartHireX.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userService.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("phone", user.getPhone());
        response.put("isOAuth2User", user.getOAuth2Provider() != null);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ProfileUpdateRequest updateRequest) {
        
        User updatedUser = userService.updateUserProfile(currentUser.getId(), updateRequest);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("user", createUserResponse(updatedUser));
        
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> createUserResponse(User user) {
        Map<String, Object> userResponse = new HashMap<>();
        userResponse.put("id", user.getId());
        userResponse.put("email", user.getEmail());
        userResponse.put("firstName", user.getFirstName());
        userResponse.put("lastName", user.getLastName());
        userResponse.put("phone", user.getPhone());
        userResponse.put("isOAuth2User", user.getOAuth2Provider() != null);
        return userResponse;
    }
}
