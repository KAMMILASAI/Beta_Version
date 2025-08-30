package com.SmartHireX.controller.admin;

import com.SmartHireX.entity.Payment;
import com.SmartHireX.entity.CandidateProfile;
import com.SmartHireX.entity.RecruiterProfile;
import com.SmartHireX.entity.User;
import com.SmartHireX.repository.PaymentRepository;
import com.SmartHireX.repository.UserRepository;
import com.SmartHireX.repository.CandidateProfileRepository;
import com.SmartHireX.repository.RecruiterProfileRepository;
import com.SmartHireX.entity.Notification;
import com.SmartHireX.repository.NotificationRepository;
import com.SmartHireX.service.AdminService;
import com.SmartHireX.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Locale;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Arrays;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AdminService adminService;
    private final EmailService emailService;
    private final CandidateProfileRepository candidateProfileRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    public AdminController(PaymentRepository paymentRepository, UserRepository userRepository, NotificationRepository notificationRepository, AdminService adminService, EmailService emailService, CandidateProfileRepository candidateProfileRepository, RecruiterProfileRepository recruiterProfileRepository) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.adminService = adminService;
        this.emailService = emailService;
        this.candidateProfileRepository = candidateProfileRepository;
        this.recruiterProfileRepository = recruiterProfileRepository;
    }

    // Payments
    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAllWithUser();
        return ResponseEntity.ok(payments);
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable("id") Long id) {
        if (!paymentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        paymentRepository.deleteById(id);
        logger.info("Deleted payment with id {}", id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/payments/total")
    public ResponseEntity<Map<String, Object>> getTotalPayments() {
        List<Payment> payments = paymentRepository.findAll();
        BigDecimal total = payments.stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> body = new HashMap<>();
        body.put("total", total);
        return ResponseEntity.ok(body);
    }

    // Users by role
    @GetMapping("/candidates")
    public ResponseEntity<List<Map<String, Object>>> getCandidates() {
        List<User> users = userRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc("candidate");
        List<Map<String, Object>> list = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("_id", u.getId());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt());
            // attach candidate profile image if available
            String image = candidateProfileRepository.findByUser(u)
                    .map(CandidateProfile::getProfileImage)
                    .orElse(null);
            m.put("image", image);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/recruiters")
    public ResponseEntity<List<Map<String, Object>>> getRecruiters() {
        List<User> users = userRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc("recruiter");
        List<Map<String, Object>> list = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("_id", u.getId());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt());
            String image = recruiterProfileRepository.findByUser(u)
                    .map(RecruiterProfile::getImage)
                    .orElse(null);
            m.put("image", image);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/candidates/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable("id") Long id) {
        boolean ok = adminService.hardDeleteUser(id);
        if (!ok) return ResponseEntity.notFound().build();
        logger.info("Hard-deleted candidate with id {}", id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/recruiters/{id}")
    public ResponseEntity<Void> deleteRecruiter(@PathVariable("id") Long id) {
        boolean ok = adminService.hardDeleteUser(id);
        if (!ok) return ResponseEntity.notFound().build();
        logger.info("Hard-deleted recruiter with id {}", id);
        return ResponseEntity.noContent().build();
    }

    // Pending recruiters overview for Requests and sidebar count
    @GetMapping("/pending-recruiters")
    public ResponseEntity<Map<String, Object>> getPendingRecruiters() {
        // Define "pending" as recruiters who are not yet verified
        List<User> allRecruiters = userRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc("recruiter");
        List<User> pending = allRecruiters.stream()
                .filter(u -> !Boolean.TRUE.equals(u.isVerified())) // not verified
                .collect(Collectors.toList());

        List<Map<String, Object>> requests = pending.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("_id", u.getId());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("email", u.getEmail());
            m.put("createdAt", u.getCreatedAt());
            // Frontend expects these occasionally; provide nulls if unknown
            m.put("phone", u.getPhone());
            m.put("company", null);
            m.put("companyLink", null);
            m.put("numEmployees", null);
            m.put("location", null);
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> body = new HashMap<>();
        body.put("count", requests.size());
        body.put("requests", requests);
        return ResponseEntity.ok(body);
    }

    // Approve a recruiter: mark as verified
    @PostMapping("/approve-recruiter/{id}")
    public ResponseEntity<?> approveRecruiter(@PathVariable("id") Long id,
                                              @RequestBody(required = false) Map<String, Object> payload) {
        return userRepository.findById(id).map(user -> {
            if (!"recruiter".equalsIgnoreCase(user.getRole())) {
                Map<String, Object> err = new HashMap<>();
                err.put("message", "User is not a recruiter");
                return ResponseEntity.badRequest().body(err);
            }
            // Mark verified and return
            user.setVerified(true);
            userRepository.save(user);
            try {
                String firstName = user.getFirstName() != null ? user.getFirstName() : "User";
                emailService.sendWelcomeEmail(user.getEmail(), firstName);
            } catch (Exception e) {
                logger.warn("Failed to send welcome email after recruiter approval to: {}", user.getEmail(), e);
            }
            logger.info("Approved recruiter with id {}", id);
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Recruiter approved successfully");
            return ResponseEntity.ok(body);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Reject a recruiter: remove account for now (can be adapted to a soft-status later)
    @PostMapping("/reject-recruiter/{id}")
    public ResponseEntity<?> rejectRecruiter(@PathVariable("id") Long id,
                                             @RequestBody(required = false) Map<String, Object> payload) {
        return userRepository.findById(id).map(user -> {
            if (!"recruiter".equalsIgnoreCase(user.getRole())) {
                Map<String, Object> err = new HashMap<>();
                err.put("message", "User is not a recruiter");
                return ResponseEntity.badRequest().body(err);
            }
            boolean ok = adminService.hardDeleteUser(id);
            if (!ok) return ResponseEntity.notFound().build();
            logger.info("Rejected (hard-deleted) recruiter with id {}", id);
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Recruiter rejected and removed");
            return ResponseEntity.ok(body);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Admin dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> result = new HashMap<>();

        // Basic counts
        long totalUsers = userRepository.count();
        List<User> candidates = userRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc("candidate");
        List<User> recruiters = userRepository.findByRoleIgnoreCaseOrderByCreatedAtDesc("recruiter");

        result.put("total", totalUsers);
        result.put("candidates", candidates.size());
        result.put("recruiters", recruiters.size());

        // Growth placeholders (0 for now)
        result.put("totalGrowth", 0);
        result.put("candidateGrowth", 0);
        result.put("recruiterGrowth", 0);

        // Payments summary
        List<Payment> payments = paymentRepository.findAll();
        BigDecimal totalRevenue = payments.stream()
                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> paymentStats = new HashMap<>();
        paymentStats.put("totalRevenue", totalRevenue);
        result.put("paymentStats", paymentStats);
        result.put("revenueGrowth", 0);

        // Monthly data for current year (names only with counts)
        String[] months = Arrays.stream(java.time.Month.values())
                .map(m -> m.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                .toArray(String[]::new);
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        // Very simple monthly aggregation (counts and revenue) by month number
        for (int i = 1; i <= 12; i++) {
            int monthIndex = i; // 1-12
            long candCount = candidates.stream()
                    .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().getMonthValue() == monthIndex)
                    .count();
            long recCount = recruiters.stream()
                    .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().getMonthValue() == monthIndex)
                    .count();
            BigDecimal revenue = payments.stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().getMonthValue() == monthIndex)
                    .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> row = new HashMap<>();
            row.put("month", months[i - 1]);
            row.put("candidates", candCount);
            row.put("recruiters", recCount);
            row.put("revenue", revenue);
            monthlyData.add(row);
        }
        result.put("monthlyData", monthlyData);

        // Daily registrations (last 7 days)
        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = LocalDate.now().minusDays(i);
            long cand = candidates.stream().filter(u -> u.getCreatedAt() != null && u.getCreatedAt().toLocalDate().isEqual(day)).count();
            long rec = recruiters.stream().filter(u -> u.getCreatedAt() != null && u.getCreatedAt().toLocalDate().isEqual(day)).count();
            Map<String, Object> row = new HashMap<>();
            row.put("day", day.getMonthValue() + "/" + day.getDayOfMonth());
            row.put("candidates", cand);
            row.put("recruiters", rec);
            dailyData.add(row);
        }
        result.put("dailyData", dailyData);

        // Recent users (last 10 by createdAt desc)
        List<User> allUsers = new ArrayList<>();
        allUsers.addAll(candidates);
        allUsers.addAll(recruiters);
        allUsers.sort(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        List<Map<String, Object>> recentUsers = allUsers.stream().limit(10).map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", (u.getFirstName() != null ? u.getFirstName() : "") + (u.getLastName() != null ? (" " + u.getLastName()) : ""));
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("createdAt", u.getCreatedAt());
            // Frontend checks isApproved to display status; derive from verified flag for recruiters
            boolean approved = !"recruiter".equalsIgnoreCase(u.getRole()) || Boolean.TRUE.equals(u.isVerified());
            m.put("isApproved", approved);
            return m;
        }).collect(Collectors.toList());
        result.put("recentUsers", recentUsers);

        // Activity data placeholders
        List<Map<String, Object>> activityData = new ArrayList<>();
        activityData.add(Map.of("name", "Active Users", "value", totalUsers, "change", "+0%", "percentage", 100));
        activityData.add(Map.of("name", "New Candidates", "value", candidates.size(), "change", "+0%", "percentage", 100));
        activityData.add(Map.of("name", "New Recruiters", "value", recruiters.size(), "change", "+0%", "percentage", 100));
        result.put("activityData", activityData);

        return ResponseEntity.ok(result);
    }

    // ================= Notifications =================
    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications(@RequestParam(value = "audience", required = false) String audience) {
        List<Notification> list;
        if (audience == null || audience.isBlank() || "all".equalsIgnoreCase(audience)) {
            list = notificationRepository.findAllByOrderByCreatedAtDesc();
        } else {
            // filter by audience: candidate or recruiter
            list = notificationRepository.findByAudienceIgnoreCaseOrderByCreatedAtDesc(audience);
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/notifications")
    public ResponseEntity<?> createNotification(@RequestBody Map<String, Object> payload) {
        String title = String.valueOf(payload.getOrDefault("title", "")).trim();
        String message = String.valueOf(payload.getOrDefault("message", "")).trim();
        String audience = String.valueOf(payload.getOrDefault("audience", "all")).trim().toLowerCase();

        if (title.isEmpty() || message.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("message", "Title and message are required");
            return ResponseEntity.badRequest().body(err);
        }
        if (!("all".equals(audience) || "candidate".equals(audience) || "recruiter".equals(audience))) {
            audience = "all";
        }

        Notification n = new Notification();
        n.setTitle(title);
        n.setMessage(message);
        n.setAudience(audience);
        Notification saved = notificationRepository.save(n);

        logger.info("Created notification id={}, audience={}", saved.getId(), audience);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/notifications/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable("id") Long id) {
        if (!notificationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        notificationRepository.deleteById(id);
        logger.info("Deleted notification id={}", id);
        return ResponseEntity.noContent().build();
    }
}
