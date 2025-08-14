package com.SmartHireX.controller.chat;

import com.SmartHireX.security.CurrentUser;
import com.SmartHireX.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@CurrentUser UserPrincipal userPrincipal) {
        try {
            // Mock unread count data
            Map<String, Object> response = new HashMap<>();
            response.put("totalUnreadCount", 3);
            response.put("unreadChats", Arrays.asList(
                createUnreadChat("TechCorp HR", 2, "We'd like to schedule an interview..."),
                createUnreadChat("DataTech Recruiter", 1, "Thank you for your application...")
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch unread count");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/chats")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> getChats(@CurrentUser UserPrincipal userPrincipal) {
        try {
            // Mock chat list data
            List<Map<String, Object>> chats = Arrays.asList(
                createChat("1", "TechCorp HR", "We'd like to schedule an interview with you for the Software Engineer position.", LocalDateTime.now().minusHours(2), 2),
                createChat("2", "DataTech Recruiter", "Thank you for your application. We'll review it and get back to you soon.", LocalDateTime.now().minusDays(1), 1),
                createChat("3", "InnovateLabs", "Your coding challenge has been received. Results will be available in 24 hours.", LocalDateTime.now().minusDays(2), 0),
                createChat("4", "CodeCraft Team", "Welcome to CodeCraft! We're excited to have you in our talent pool.", LocalDateTime.now().minusDays(3), 0)
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("chats", chats);
            response.put("totalChats", chats.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch chats");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/messages/{chatId}")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMessages(@PathVariable String chatId, @CurrentUser UserPrincipal userPrincipal) {
        try {
            // Mock messages data
            List<Map<String, Object>> messages = Arrays.asList(
                createMessage("1", "Hello! Thank you for applying to our Software Engineer position.", false, LocalDateTime.now().minusDays(3)),
                createMessage("2", "Thank you for considering me! I'm very interested in the role.", true, LocalDateTime.now().minusDays(3).plusHours(1)),
                createMessage("3", "Great! We'd like to schedule a technical interview. Are you available this week?", false, LocalDateTime.now().minusHours(2)),
                createMessage("4", "Yes, I'm available. What times work best for you?", true, LocalDateTime.now().minusHours(1))
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("messages", messages);
            response.put("chatId", chatId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch messages");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // Helper methods
    private Map<String, Object> createUnreadChat(String name, int count, String lastMessage) {
        Map<String, Object> chat = new HashMap<>();
        chat.put("name", name);
        chat.put("unreadCount", count);
        chat.put("lastMessage", lastMessage);
        return chat;
    }

    private Map<String, Object> createChat(String id, String name, String lastMessage, LocalDateTime lastMessageTime, int unreadCount) {
        Map<String, Object> chat = new HashMap<>();
        chat.put("id", id);
        chat.put("name", name);
        chat.put("lastMessage", lastMessage);
        chat.put("lastMessageTime", lastMessageTime.toString());
        chat.put("unreadCount", unreadCount);
        chat.put("avatar", "https://via.placeholder.com/40");
        return chat;
    }

    private Map<String, Object> createMessage(String id, String content, boolean isFromUser, LocalDateTime timestamp) {
        Map<String, Object> message = new HashMap<>();
        message.put("id", id);
        message.put("content", content);
        message.put("isFromUser", isFromUser);
        message.put("timestamp", timestamp.toString());
        return message;
    }
}
