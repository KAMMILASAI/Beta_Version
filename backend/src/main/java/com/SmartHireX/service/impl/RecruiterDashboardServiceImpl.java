package com.SmartHireX.service.impl;

import com.SmartHireX.service.RecruiterDashboardService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class RecruiterDashboardServiceImpl implements RecruiterDashboardService {
    
    private final Random random = new Random();
    private final String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

    @Override
    public long getTotalCandidates() {
        // Return a random number between 100 and 1000 for demo
        return random.nextInt(901) + 100;
    }

    @Override
    public int getActiveChatsCount() {
        // Return a random number between 5 and 50 for demo
        return random.nextInt(46) + 5;
    }

    @Override
    public int getDrivesConductedCount() {
        // Return a random number between 10 and 100 for demo
        return random.nextInt(91) + 10;
    }

    @Override
    public int getTotalEmployees() {
        // Return a random number between 10 and 100 for demo
        return random.nextInt(91) + 10;
    }

    @Override
    public List<Map<String, Object>> getCandidatesByMonth() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        // Get last 6 months
        int currentMonth = java.time.LocalDate.now().getMonthValue();
        
        for (int i = 5; i >= 0; i--) {
            int monthIndex = (currentMonth - 1 - i + 12) % 12;
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", months[monthIndex]);
            monthData.put("count", random.nextInt(50) + 10); // Random count between 10-60
            data.add(monthData);
        }
        
        return data;
    }

    @Override
    public List<Map<String, Object>> getDrivesByMonth() {
        List<Map<String, Object>> data = new ArrayList<>();
        
        // Get last 6 months
        int currentMonth = java.time.LocalDate.now().getMonthValue();
        
        for (int i = 5; i >= 0; i--) {
            int monthIndex = (currentMonth - 1 - i + 12) % 12;
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", months[monthIndex]);
            monthData.put("count", random.nextInt(10) + 1); // Random count between 1-10
            data.add(monthData);
        }
        
        return data;
    }
}
