package com.SmartHireX.service;

public interface PresenceService {
    void heartbeat(String clientId);
    int getOnlineCount();
}
