package com.SmartHireX.controller.recruiter;

import com.SmartHireX.service.RecruiterDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterDashboardController {

    @Autowired
    private RecruiterDashboardService dashboardService;

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> response = new HashMap<>();
        
        // Get total candidates
        long totalCandidates = dashboardService.getTotalCandidates();
        // Get active chats count
        int activeChats = dashboardService.getActiveChatsCount();
        // Get drives conducted
        int drivesConducted = dashboardService.getDrivesConductedCount();
        // Get total employees
        int totalEmployees = dashboardService.getTotalEmployees();
        
        // Get chart data
        Map<String, Object> charts = new HashMap<>();
        charts.put("candidatesByMonth", dashboardService.getCandidatesByMonth());
        charts.put("drivesByMonth", dashboardService.getDrivesByMonth());
        
        response.put("totalCandidates", totalCandidates);
        response.put("activeChats", activeChats);
        response.put("drivesConducted", drivesConducted);
        response.put("totalEmployees", totalEmployees);
        response.put("charts", charts);
        
        return ResponseEntity.ok(response);
    }
}
