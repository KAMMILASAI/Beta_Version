package com.SmartHireX.controller.candidate;

import com.SmartHireX.entity.User;
import com.SmartHireX.security.CurrentUser;
import com.SmartHireX.security.UserPrincipal;
import com.SmartHireX.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/candidate")
public class CandidateController {

    @Autowired
    private UserService userService;

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Candidate endpoint is working!");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@CurrentUser UserPrincipal userPrincipal) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", user.getFirstName() + " " + user.getLastName());
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("verified", user.isVerified());
            profile.put("emailVerified", user.isEmailVerified());
            profile.put("role", user.getRole().toString());
            
            // Additional profile fields that frontend expects
            profile.put("image", ""); // Default empty image
            profile.put("college", ""); // Default empty college
            profile.put("regNo", ""); // Default empty registration number
            profile.put("location", ""); // Default empty location
            profile.put("portfolio", ""); // Default empty portfolio
            profile.put("github", ""); // Default empty github
            profile.put("linkedin", ""); // Default empty linkedin
            profile.put("skills", ""); // Default empty skills
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch profile");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@CurrentUser UserPrincipal userPrincipal,
                                         @RequestParam(required = false) String name,
                                         @RequestParam(required = false) String email,
                                         @RequestParam(required = false) String college,
                                         @RequestParam(required = false) String regNo,
                                         @RequestParam(required = false) String location,
                                         @RequestParam(required = false) String portfolio,
                                         @RequestParam(required = false) String github,
                                         @RequestParam(required = false) String linkedin,
                                         @RequestParam(required = false) String skills,
                                         @RequestParam(required = false) MultipartFile image) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update basic user fields
            if (name != null && !name.trim().isEmpty()) {
                String[] nameParts = name.trim().split(" ", 2);
                user.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    user.setLastName(nameParts[1]);
                }
            }
            
            if (email != null && !email.trim().isEmpty()) {
                user.setEmail(email.trim());
            }

            // Save user
            user = userService.save(user);

            // Return updated profile
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", user.getFirstName() + " " + user.getLastName());
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("verified", user.isVerified());
            profile.put("emailVerified", user.isEmailVerified());
            profile.put("role", user.getRole().toString());
            
            // Include the additional fields (for now just echo back what was sent)
            profile.put("image", ""); // TODO: Handle image upload
            profile.put("college", college != null ? college : "");
            profile.put("regNo", regNo != null ? regNo : "");
            profile.put("location", location != null ? location : "");
            profile.put("portfolio", portfolio != null ? portfolio : "");
            profile.put("github", github != null ? github : "");
            profile.put("linkedin", linkedin != null ? linkedin : "");
            profile.put("skills", skills != null ? skills : "");
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update profile");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
