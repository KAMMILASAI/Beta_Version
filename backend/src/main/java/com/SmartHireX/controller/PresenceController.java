package com.SmartHireX.controller;

import com.SmartHireX.service.PresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/presence")
public class PresenceController {

    private final PresenceService presenceService;

    public PresenceController(PresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(@RequestBody Map<String, String> body) {
        String clientId = body.get("clientId");
        presenceService.heartbeat(clientId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getCount() {
        int count = presenceService.getOnlineCount();
        Map<String, Integer> resp = new HashMap<>();
        resp.put("count", count);
        return ResponseEntity.ok(resp);
    }
}
