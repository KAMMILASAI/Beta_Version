package com.SmartHireX.service.impl;

import com.SmartHireX.service.PresenceService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceServiceImpl implements PresenceService {

    // clientId -> lastSeenEpochMillis
    private final Map<String, Long> presenceMap = new ConcurrentHashMap<>();

    // Consider users online if heartbeat within last N millis
    private static final long ONLINE_WINDOW_MS = 60_000; // 60s

    @Override
    public void heartbeat(String clientId) {
        if (clientId == null || clientId.isBlank()) return;
        presenceMap.put(clientId, Instant.now().toEpochMilli());
    }

    @Override
    public int getOnlineCount() {
        long now = Instant.now().toEpochMilli();
        return (int) presenceMap.values().stream()
                .filter(last -> (now - last) <= ONLINE_WINDOW_MS)
                .count();
    }

    // Cleanup stale entries periodically (every 2 minutes)
    @Scheduled(fixedDelay = 120_000)
    public void cleanup() {
        long now = Instant.now().toEpochMilli();
        presenceMap.entrySet().removeIf(e -> (now - e.getValue()) > ONLINE_WINDOW_MS);
    }
}
