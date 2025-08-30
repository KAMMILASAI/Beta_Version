package com.SmartHireX.controller.chat;

import com.SmartHireX.entity.Chat;
import com.SmartHireX.entity.Message;
import com.SmartHireX.entity.User;
import com.SmartHireX.repository.ChatRepository;
import com.SmartHireX.repository.MessageRepository;
import com.SmartHireX.repository.UserRepository;
import com.SmartHireX.security.CurrentUser;
import com.SmartHireX.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    // In-memory last seen message per user per chat: userId -> (chatId -> lastSeenMessageId)
    private final Map<Long, Map<Long, Long>> lastSeenByUser = new ConcurrentHashMap<>();

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
            Long currentUserId = userPrincipal.getId();
            List<Chat> chats = chatRepository.findByParticipants_Id(currentUserId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Chat c : chats) {
                // Try to get last message text
                List<Message> msgs = messageRepository.findByChat_IdOrderByCreatedAtAsc(c.getId());
                String lastText = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getText();
                long lastSeenId = lastSeenByUser
                        .getOrDefault(currentUserId, Collections.emptyMap())
                        .getOrDefault(c.getId(), 0L);
                int unreadCount = 0;
                for (Message m : msgs) {
                    if (m.getSender() != null && !Objects.equals(m.getSender().getId(), currentUserId)
                            && safeId(m) > lastSeenId) {
                        unreadCount++;
                    }
                }
                result.add(mapChat(c, lastText, unreadCount));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch chats");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/messages/{chatId}")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMessages(@PathVariable Long chatId, @CurrentUser UserPrincipal userPrincipal) {
        try {
            List<Message> list = messageRepository.findByChat_IdOrderByCreatedAtAsc(chatId);
            List<Map<String, Object>> result = new ArrayList<>();
            for (Message m : list) {
                result.add(mapMessage(m));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch messages");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/search-users")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> searchUsers(@RequestParam("query") String query) {
        try {
            List<User> found = userRepository.searchUsers(query);
            List<Map<String, Object>> result = new ArrayList<>();
            for (User u : found) result.add(mapUser(u));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to search users");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/create-chat")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> createChat(@RequestBody Map<String, Object> body, @CurrentUser UserPrincipal principal) {
        try {
            Long currentUserId = principal.getId();
            Long participantId = Long.valueOf(String.valueOf(body.get("participantId")));
            User me = userRepository.findById(currentUserId).orElseThrow();
            User other = userRepository.findById(participantId).orElseThrow();

            Optional<Chat> existing = chatRepository.findDirectChat(currentUserId, participantId);
            Chat chat = existing.orElseGet(() -> {
                Chat c = new Chat();
                c.getParticipants().add(me);
                c.getParticipants().add(other);
                c.setLastActivity(LocalDateTime.now());
                return chatRepository.save(c);
            });

            // Map with last message if any
            List<Message> msgs = messageRepository.findByChat_IdOrderByCreatedAtAsc(chat.getId());
            String lastText = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1).getText();
            long lastSeenId = lastSeenByUser
                    .getOrDefault(currentUserId, Collections.emptyMap())
                    .getOrDefault(chat.getId(), 0L);
            int unreadCount = 0;
            for (Message m : msgs) {
                if (m.getSender() != null && !Objects.equals(m.getSender().getId(), currentUserId)
                        && safeId(m) > lastSeenId) {
                    unreadCount++;
                }
            }
            return ResponseEntity.ok(mapChat(chat, lastText, unreadCount));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create chat");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/send-message")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body, @CurrentUser UserPrincipal principal) {
        try {
            Long chatId = Long.valueOf(String.valueOf(body.get("chatId")));
            String text = String.valueOf(body.get("text"));
            User sender = userRepository.findById(principal.getId()).orElseThrow();
            Chat chat = chatRepository.findById(chatId).orElseThrow();

            Message msg = new Message();
            msg.setChat(chat);
            msg.setSender(sender);
            msg.setText(text);
            msg = messageRepository.save(msg);

            chat.setLastActivity(LocalDateTime.now());
            chatRepository.save(chat);

            return ResponseEntity.ok(mapMessage(msg));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to send message");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/mark-read")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<?> markRead(@RequestBody Map<String, Object> body, @CurrentUser UserPrincipal principal) {
        try {
            Long userId = principal.getId();
            Long chatId = Long.valueOf(String.valueOf(body.get("chatId")));
            List<Message> msgs = messageRepository.findByChat_IdOrderByCreatedAtAsc(chatId);
            long latestId = 0L;
            if (!msgs.isEmpty()) {
                latestId = safeId(msgs.get(msgs.size() - 1));
            }
            lastSeenByUser.computeIfAbsent(userId, k -> new ConcurrentHashMap<>()).put(chatId, latestId);

            Map<String, Object> res = new HashMap<>();
            res.put("status", "ok");
            res.put("chatId", chatId);
            res.put("lastSeenMessageId", latestId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to mark as read");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // Helper mapping methods
    private Map<String, Object> createUnreadChat(String name, int count, String lastMessage) {
        Map<String, Object> chat = new HashMap<>();
        chat.put("name", name);
        chat.put("unreadCount", count);
        chat.put("lastMessage", lastMessage);
        return chat;
    }

    private Map<String, Object> mapUser(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("_id", String.valueOf(u.getId()));
        m.put("firstName", u.getFirstName());
        m.put("lastName", u.getLastName());
        m.put("role", u.getRole());
        m.put("email", u.getEmail());
        m.put("image", null);
        return m;
    }

    private Map<String, Object> mapChat(Chat c, String lastMessageText, int unreadCount) {
        Map<String, Object> m = new HashMap<>();
        m.put("_id", String.valueOf(c.getId()));
        List<Map<String, Object>> participants = new ArrayList<>();
        for (User u : c.getParticipants()) participants.add(mapUser(u));
        m.put("participants", participants);
        Map<String, Object> last = new HashMap<>();
        last.put("text", lastMessageText);
        m.put("lastMessage", last);
        m.put("lastActivity", (c.getLastActivity() != null ? c.getLastActivity() : LocalDateTime.now()).toString());
        m.put("unreadCount", unreadCount);
        return m;
    }

    private Map<String, Object> mapMessage(Message msg) {
        Map<String, Object> m = new HashMap<>();
        m.put("_id", String.valueOf(msg.getId()));
        m.put("sender", mapUser(msg.getSender()));
        m.put("text", msg.getText());
        m.put("createdAt", (msg.getCreatedAt() != null ? msg.getCreatedAt() : LocalDateTime.now()).toString());
        m.put("messageType", msg.getMessageType() != null ? msg.getMessageType() : "text");
        m.put("isSaved", msg.isSaved());
        return m;
    }

    private long safeId(Message m) {
        try {
            return m.getId() == null ? 0L : m.getId();
        } catch (Exception ignored) {
            return 0L;
        }
    }
}
