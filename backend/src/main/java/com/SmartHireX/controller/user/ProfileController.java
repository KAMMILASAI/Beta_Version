package com.SmartHireX.controller.user;

import com.SmartHireX.dto.request.ProfileUpdateRequest;
import com.SmartHireX.entity.RecruiterProfile;
import com.SmartHireX.entity.User;
import com.SmartHireX.repository.RecruiterProfileRepository;
import com.SmartHireX.security.UserPrincipal;
import com.SmartHireX.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class ProfileController {

    @Autowired
    private UserService userService;
    
    
    @Autowired
    private RecruiterProfileRepository recruiterProfileRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserPrincipal currentUser, HttpServletRequest request) {
        User user = userService.findById(currentUser.getId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("name", String.format("%s %s",
                user.getFirstName() != null ? user.getFirstName() : "",
                user.getLastName() != null ? user.getLastName() : "").trim());
        if ("recruiter".equalsIgnoreCase(user.getRole())) {
            RecruiterProfile rp = recruiterProfileRepository.findByUser(user).orElse(new RecruiterProfile());
            if (rp.getUser() == null) rp.setUser(user);
            response.put("company", rp.getCompany());
            response.put("companyLink", rp.getCompanyLink());
            response.put("linkedin", rp.getLinkedin());
            response.put("github", rp.getGithub());
            response.put("location", rp.getLocation());
            response.put("numEmployees", rp.getNumEmployees());
            response.put("image", rp.getImage());
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ProfileUpdateRequest updateRequest,
            HttpServletRequest request) {

        User updatedUser = userService.updateUserProfile(currentUser.getId(), updateRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("id", updatedUser.getId());
        response.put("email", updatedUser.getEmail());
        response.put("name", String.format("%s %s",
                updatedUser.getFirstName() != null ? updatedUser.getFirstName() : "",
                updatedUser.getLastName() != null ? updatedUser.getLastName() : "").trim());
        if ("recruiter".equalsIgnoreCase(updatedUser.getRole())) {
            RecruiterProfile rp = recruiterProfileRepository.findByUser(updatedUser).orElse(new RecruiterProfile());
            if (rp.getUser() == null) rp.setUser(updatedUser);
            // apply updates
            if (updateRequest.getCompany() != null) rp.setCompany(updateRequest.getCompany());
            if (updateRequest.getCompanyLink() != null) rp.setCompanyLink(updateRequest.getCompanyLink());
            if (updateRequest.getLinkedin() != null) rp.setLinkedin(updateRequest.getLinkedin());
            if (updateRequest.getGithub() != null) rp.setGithub(updateRequest.getGithub());
            if (updateRequest.getLocation() != null) rp.setLocation(updateRequest.getLocation());
            if (updateRequest.getNumEmployees() != null) rp.setNumEmployees(updateRequest.getNumEmployees());
            rp = recruiterProfileRepository.save(rp);

            response.put("company", rp.getCompany());
            response.put("companyLink", rp.getCompanyLink());
            response.put("linkedin", rp.getLinkedin());
            response.put("github", rp.getGithub());
            response.put("location", rp.getLocation());
            response.put("numEmployees", rp.getNumEmployees());
            response.put("image", rp.getImage());
        }

        return ResponseEntity.ok(response);
    }

    private String buildAbsoluteUrl(HttpServletRequest request, String storedPath) {
        if (storedPath == null || storedPath.isBlank()) return null;
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        String contextPath = request.getContextPath(); // e.g. /api
        return String.format("%s://%s:%d%s%s", scheme, host, port, contextPath, storedPath);
    }
}
