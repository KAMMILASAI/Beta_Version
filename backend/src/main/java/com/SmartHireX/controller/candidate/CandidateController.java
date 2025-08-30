package com.SmartHireX.controller.candidate;

import com.SmartHireX.entity.CandidateProfile;
import com.SmartHireX.entity.PracticeSession;
import com.SmartHireX.entity.User;
import com.SmartHireX.model.JobPosting;
import com.SmartHireX.model.Application;
import com.SmartHireX.repository.ApplicationRepository;
import com.SmartHireX.repository.CandidateProfileRepository;
import com.SmartHireX.repository.JobRepository;
import com.SmartHireX.security.CurrentUser;
import com.SmartHireX.security.UserPrincipal;
import com.SmartHireX.service.PracticeSessionService;
import com.SmartHireX.service.GeminiQuestionService;
import com.SmartHireX.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.time.Instant;

@RestController
@RequestMapping("/candidate")
public class CandidateController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private CandidateProfileRepository candidateProfileRepository;
    
    
    @Autowired
    private PracticeSessionService practiceSessionService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private GeminiQuestionService geminiQuestionService;

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Candidate endpoint is working!");
        response.put("timestamp", new java.util.Date().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getMyApplications(@CurrentUser UserPrincipal userPrincipal) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String emailLower = user.getEmail() != null ? user.getEmail().toLowerCase() : null;
            if (emailLower == null || emailLower.isBlank()) {
                return ResponseEntity.ok(List.of());
            }

            List<Application> apps = applicationRepository.findByEmailLowerOrderByCreatedAtDesc(emailLower);

            List<Map<String, Object>> response = new ArrayList<>();
            for (Application a : apps) {
                Map<String, Object> item = new HashMap<>();
                item.put("_id", a.getId());
                item.put("id", a.getId());

                // Map backend statuses to frontend expectations
                String st = a.getStatus();
                String mapped;
                if ("reviewed".equalsIgnoreCase(st) || "under_review".equalsIgnoreCase(st)) mapped = "under_review";
                else if ("interviewed".equalsIgnoreCase(st)) mapped = "interview_scheduled";
                else if ("hired".equalsIgnoreCase(st)) mapped = "shortlisted";
                else if ("rejected".equalsIgnoreCase(st)) mapped = "rejected";
                else mapped = "applied";
                item.put("status", mapped);

                item.put("appliedAt", a.getCreatedAt());
                item.put("updatedAt", null);

                JobPosting j = a.getJob();
                Map<String, Object> job = new HashMap<>();
                if (j != null) {
                    job.put("id", j.getId());
                    job.put("_id", j.getId());
                    job.put("title", j.getTitle());
                    job.put("company", j.getCompany());
                    job.put("location", j.getLocation());
                    job.put("linkId", j.getLinkId());
                    job.put("ctc", j.getCtc());
                    job.put("employmentType", j.getEmploymentType());
                }
                item.put("job", job);

                response.add(item);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch applications");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    // --- Practice: MCQs generation ---
    @PostMapping("/practice/mcqs")
    public ResponseEntity<?> generateMcqs(@CurrentUser UserPrincipal userPrincipal,
                                          @RequestBody Map<String, Object> body) {
        try {
            // Ensure user exists
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String tech = String.valueOf(body.getOrDefault("tech", ""));
            int num = 5;
            try { num = Integer.parseInt(String.valueOf(body.getOrDefault("num", 5))); } catch (Exception ignored) {}
            String difficulty = String.valueOf(body.getOrDefault("difficulty", "Medium"));

            // Derive technologies
            List<String> techs = Arrays.stream(tech.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
            // If not provided, fallback to user's skills or General
            if (techs.isEmpty()) {
                CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user).orElse(null);
                if (candidateProfile != null && candidateProfile.getSkills() != null && !candidateProfile.getSkills().isBlank()) {
                    techs = Arrays.stream(candidateProfile.getSkills().split(","))
                            .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
                }
            }
            if (techs.isEmpty()) techs = List.of("General");

            // Fetch candidate profile for personalization
            CandidateProfile profile = candidateProfileRepository.findByUser(user).orElse(null);

            var mcqs = geminiQuestionService.generateMcqs(user, profile, techs, difficulty, Math.max(1, num));

            // Map to existing response shape expected by frontend
            List<Map<String, Object>> questions = new ArrayList<>();
            for (var q : mcqs) {
                Map<String, Object> item = new HashMap<>();
                item.put("q", q.getQuestion());
                item.put("options", q.getOptions());
                item.put("answer", q.getAnswer());
                item.put("technology", q.getTechnology());
                questions.add(item);
            }

            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "error", "Failed to generate MCQs",
                    "message", e.getMessage()
            ));
        }
    }

    // Frontend compatibility endpoint: GET with query params
    @GetMapping("/mcqs")
    public ResponseEntity<?> generateMcqsGet(@CurrentUser UserPrincipal userPrincipal,
                                             @RequestParam(name = "topic", required = false, defaultValue = "") String topic,
                                             @RequestParam(name = "level", required = false, defaultValue = "Medium") String level,
                                             @RequestParam(name = "count", required = false, defaultValue = "5") int count) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<String> techs = Arrays.stream(topic.split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
            if (techs.isEmpty()) {
                CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user).orElse(null);
                if (candidateProfile != null && candidateProfile.getSkills() != null && !candidateProfile.getSkills().isBlank()) {
                    techs = Arrays.stream(candidateProfile.getSkills().split(","))
                            .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
                }
            }
            if (techs.isEmpty()) techs = List.of("General");

            CandidateProfile profile = candidateProfileRepository.findByUser(user).orElse(null);

            var mcqs = geminiQuestionService.generateMcqs(user, profile, techs, level, Math.max(1, count));

            List<Map<String, Object>> questions = new ArrayList<>();
            for (var q : mcqs) {
                Map<String, Object> item = new HashMap<>();
                item.put("q", q.getQuestion());
                item.put("options", q.getOptions());
                item.put("answer", q.getAnswer());
                item.put("technology", q.getTechnology());
                questions.add(item);
            }
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "error", "Failed to generate MCQs",
                    "message", e.getMessage()
            ));
        }
    }

    // --- Practice: Coding challenge generation ---
    @PostMapping("/practice/coding")
    public ResponseEntity<?> generateCoding(@CurrentUser UserPrincipal userPrincipal,
                                            @RequestBody Map<String, Object> body) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String tech = String.valueOf(body.getOrDefault("tech", "General"));
            String difficulty = String.valueOf(body.getOrDefault("difficulty", "Medium"));
            String primary = Arrays.stream(tech.split(",")).map(String::trim).filter(s -> !s.isEmpty()).findFirst().orElse("General");
            CandidateProfile profile = candidateProfileRepository.findByUser(user).orElse(null);

            var challenge = geminiQuestionService.generateCoding(user, profile, primary, difficulty);

            Map<String, Object> coding = new HashMap<>();
            coding.put("title", challenge.getTitle());
            coding.put("description", challenge.getDescription());
            coding.put("technology", challenge.getTechnology());
            coding.put("examples", challenge.getExamples());
            coding.put("constraints", challenge.getConstraints());
            coding.put("timeComplexity", challenge.getTimeComplexity());
            coding.put("spaceComplexity", challenge.getSpaceComplexity());
            coding.put("starter", challenge.getStarter());
            coding.put("hints", challenge.getHints());

            return ResponseEntity.ok(coding);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to generate coding challenge",
                    "message", e.getMessage()
            ));
        }
    }

    // --- Practice: Save session ---
    @PostMapping("/practice/save-session")
    public ResponseEntity<?> savePracticeSession(@CurrentUser UserPrincipal userPrincipal,
                                                 @RequestBody Map<String, Object> body) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String type = String.valueOf(body.getOrDefault("type", "mcq"));
            int score = 0;
            int totalQuestions = 0;
            int correctAnswers = 0;
            try { score = Integer.parseInt(String.valueOf(body.getOrDefault("score", 0))); } catch (Exception ignored) {}
            try { totalQuestions = Integer.parseInt(String.valueOf(body.getOrDefault("totalQuestions", 0))); } catch (Exception ignored) {}

            // derive correctAnswers if provided in questions payload
            Object qs = body.get("questions");
            if (qs instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        Object isCorrect = m.get("isCorrect");
                        if (isCorrect != null && Boolean.parseBoolean(String.valueOf(isCorrect))) correctAnswers++;
                    }
                }
            }

            PracticeSession session = new PracticeSession();
            session.setUser(user);
            session.setType(type);
            session.setScore(score);
            session.setTotalQuestions(totalQuestions);
            session.setCorrectAnswers(correctAnswers);
            // Robust percentage calculation:
            // - If score <= totalQuestions: treat as number of correct answers (MCQ), compute ratio
            // - Else if score in [0,100]: treat as direct percentage (coding)
            int percentage;
            if (totalQuestions > 0 && score <= totalQuestions) {
                percentage = (int) Math.round((score * 100.0) / Math.max(1, totalQuestions));
            } else if (score >= 0 && score <= 100) {
                percentage = score;
            } else {
                percentage = 0;
            }
            session.setPercentage(percentage);

            // Persist the practice session
            PracticeSession saved = practiceSessionService.saveSession(session);

            // Build response with saved details
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "ok");
            resp.put("id", saved.getId());
            resp.put("type", saved.getType());
            resp.put("score", saved.getScore());
            resp.put("totalQuestions", saved.getTotalQuestions());
            resp.put("correctAnswers", saved.getCorrectAnswers());
            resp.put("percentage", saved.getPercentage());
            resp.put("createdAt", saved.getCreatedAt());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to save practice session",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getAvailableJobs(@CurrentUser UserPrincipal userPrincipal) {
        try {
            // Ensure user exists (auth already validated)
            userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<JobPosting> jobs = jobRepository.findActiveNonExpired(Instant.now());

            List<Map<String, Object>> response = new ArrayList<>();
            for (JobPosting j : jobs) {
                Map<String, Object> item = new HashMap<>();
                item.put("_id", j.getId());
                item.put("id", j.getId());
                item.put("title", j.getTitle());
                item.put("description", j.getDescription());
                item.put("company", j.getCompany());
                item.put("location", j.getLocation());
                // Convert comma-separated skills to array
                if (j.getSkills() != null && !j.getSkills().isBlank()) {
                    String[] parts = j.getSkills().split(",");
                    List<String> skills = new ArrayList<>();
                    for (String p : parts) {
                        String s = p.trim();
                        if (!s.isEmpty()) skills.add(s);
                    }
                    item.put("skills", skills);
                } else {
                    item.put("skills", Collections.emptyList());
                }
                item.put("expiresAt", j.getExpiresAt() != null ? j.getExpiresAt().toString() : null);
                item.put("posted", j.getCreatedAt() != null ? j.getCreatedAt().toString() : null);
                item.put("status", "not_applied"); // default for listing
                item.put("linkId", j.getLinkId());
                response.add(item);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch jobs");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@CurrentUser UserPrincipal userPrincipal) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get or create candidate profile
            CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user)
                    .orElse(new CandidateProfile());

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", (user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : ""));
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("verified", user.isVerified());
            profile.put("emailVerified", user.isEmailVerified());
            profile.put("role", user.getRole().toString());
            
            // Extended profile fields from CandidateProfile entity
            profile.put("image", candidateProfile.getProfileImage() != null ? candidateProfile.getProfileImage() : "");
            profile.put("college", candidateProfile.getCollege() != null ? candidateProfile.getCollege() : "");
            profile.put("regNo", candidateProfile.getRegNo() != null ? candidateProfile.getRegNo() : "");
            profile.put("location", candidateProfile.getLocation() != null ? candidateProfile.getLocation() : "");
            profile.put("portfolio", candidateProfile.getPortfolio() != null ? candidateProfile.getPortfolio() : "");
            profile.put("github", candidateProfile.getGithub() != null ? candidateProfile.getGithub() : "");
            profile.put("linkedin", candidateProfile.getLinkedin() != null ? candidateProfile.getLinkedin() : "");
            profile.put("skills", candidateProfile.getSkills() != null ? candidateProfile.getSkills() : "");

            // Newly added fields to support application completeness
            profile.put("profileType", candidateProfile.getProfileType());
            profile.put("isFresher", candidateProfile.getIsFresher());
            profile.put("degree", candidateProfile.getDegree());
            profile.put("cgpa", candidateProfile.getCgpa());
            profile.put("company", candidateProfile.getCompany());
            profile.put("lpa", candidateProfile.getLpa());
            profile.put("yearsExp", candidateProfile.getYearsExp());
            
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
                                         // extended fields
                                         @RequestParam(required = false) String profileType,
                                         @RequestParam(required = false) Boolean isFresher,
                                         @RequestParam(required = false) String degree,
                                         @RequestParam(required = false) Double cgpa,
                                         @RequestParam(required = false) String company,
                                         @RequestParam(required = false) Double lpa,
                                         @RequestParam(required = false) Double yearsExp,
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
                } else {
                    user.setLastName("");
                }
            }
            
            if (email != null && !email.trim().isEmpty()) {
                user.setEmail(email.trim());
            }

            // Save user basic changes (name/email)
            user = userService.save(user);

            // Get or create candidate profile
            CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user)
                    .orElse(new CandidateProfile());
            
            if (candidateProfile.getUser() == null) {
                candidateProfile.setUser(user);
            }

            // Update candidate profile fields
            if (college != null) candidateProfile.setCollege(college.trim());
            if (regNo != null) candidateProfile.setRegNo(regNo.trim());
            if (location != null) candidateProfile.setLocation(location.trim());
            if (portfolio != null) candidateProfile.setPortfolio(portfolio.trim());
            if (github != null) candidateProfile.setGithub(github.trim());
            if (linkedin != null) candidateProfile.setLinkedin(linkedin.trim());
            if (skills != null) candidateProfile.setSkills(skills.trim());

            // Extended fields
            if (profileType != null && !profileType.isBlank()) candidateProfile.setProfileType(profileType.trim());
            if (isFresher != null) candidateProfile.setIsFresher(isFresher);
            if (degree != null) candidateProfile.setDegree(degree.trim());
            if (cgpa != null) candidateProfile.setCgpa(cgpa);
            if (company != null) candidateProfile.setCompany(company.trim());
            if (lpa != null) candidateProfile.setLpa(lpa);
            if (yearsExp != null) candidateProfile.setYearsExp(yearsExp);

            // Handle image upload
            if (image != null && !image.isEmpty()) {
                String imagePath = saveProfileImage(image, user.getId());
                candidateProfile.setProfileImage(imagePath);
            }

            // Save candidate profile
            candidateProfile = candidateProfileRepository.save(candidateProfile);

            // Return updated profile
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId());
            profile.put("name", (user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : ""));
            profile.put("firstName", user.getFirstName());
            profile.put("lastName", user.getLastName());
            profile.put("email", user.getEmail());
            profile.put("phone", user.getPhone());
            profile.put("verified", user.isVerified());
            profile.put("emailVerified", user.isEmailVerified());
            profile.put("role", user.getRole().toString());
            
            // Include the updated candidate profile fields
            profile.put("image", candidateProfile.getProfileImage() != null ? candidateProfile.getProfileImage() : "");
            profile.put("college", candidateProfile.getCollege() != null ? candidateProfile.getCollege() : "");
            profile.put("regNo", candidateProfile.getRegNo() != null ? candidateProfile.getRegNo() : "");
            profile.put("location", candidateProfile.getLocation() != null ? candidateProfile.getLocation() : "");
            profile.put("portfolio", candidateProfile.getPortfolio() != null ? candidateProfile.getPortfolio() : "");
            profile.put("github", candidateProfile.getGithub() != null ? candidateProfile.getGithub() : "");
            profile.put("linkedin", candidateProfile.getLinkedin() != null ? candidateProfile.getLinkedin() : "");
            profile.put("skills", candidateProfile.getSkills() != null ? candidateProfile.getSkills() : "");

            // Newly added fields
            profile.put("profileType", candidateProfile.getProfileType());
            profile.put("isFresher", candidateProfile.getIsFresher());
            profile.put("degree", candidateProfile.getDegree());
            profile.put("cgpa", candidateProfile.getCgpa());
            profile.put("company", candidateProfile.getCompany());
            profile.put("lpa", candidateProfile.getLpa());
            profile.put("yearsExp", candidateProfile.getYearsExp());
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update profile");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@CurrentUser UserPrincipal userPrincipal) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get candidate profile
            CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user)
                    .orElse(new CandidateProfile());
            
            if (candidateProfile.getUser() == null) {
                candidateProfile.setUser(user);
                candidateProfile = candidateProfileRepository.save(candidateProfile);
            }

            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("id", user.getId());
            dashboard.put("name", (user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : ""));
            dashboard.put("email", user.getEmail());
            dashboard.put("college", candidateProfile.getCollege() != null ? candidateProfile.getCollege() : "");
            dashboard.put("regNo", candidateProfile.getRegNo() != null ? candidateProfile.getRegNo() : "");
            dashboard.put("location", candidateProfile.getLocation() != null ? candidateProfile.getLocation() : "");
            dashboard.put("portfolio", candidateProfile.getPortfolio() != null ? candidateProfile.getPortfolio() : "");
            dashboard.put("github", candidateProfile.getGithub() != null ? candidateProfile.getGithub() : "");
            dashboard.put("linkedin", candidateProfile.getLinkedin() != null ? candidateProfile.getLinkedin() : "");
            dashboard.put("skills", candidateProfile.getSkills() != null ? candidateProfile.getSkills() : "");
            dashboard.put("image", candidateProfile.getProfileImage() != null ? candidateProfile.getProfileImage() : "");
            dashboard.put("resumeScore", candidateProfile.getResumeScore() != null ? candidateProfile.getResumeScore() : 75);
            dashboard.put("interviewsAttended", candidateProfile.getInterviewsAttended() != null ? candidateProfile.getInterviewsAttended() : 3);
            dashboard.put("practiceSessionsCompleted", (int) practiceSessionService.getTotalSessionCount(user));
            dashboard.put("dailyStreak", practiceSessionService.calculateDailyStreak(user));
            
            return ResponseEntity.ok(dashboard);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch dashboard data");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/practice/history")
    public ResponseEntity<?> getPracticeHistory(@CurrentUser UserPrincipal userPrincipal,
                                              @RequestParam(defaultValue = "10") int limit) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<PracticeSession> sessions = practiceSessionService.getPracticeHistory(user, limit);
            
            Map<String, Object> response = new HashMap<>();
            response.put("sessions", sessions);
            response.put("totalSessions", practiceSessionService.getTotalSessionCount(user));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch practice history");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @GetMapping("/resume-score-history")
    public ResponseEntity<?> getResumeScoreHistory(@CurrentUser UserPrincipal userPrincipal) {
        try {
            User user = userService.findById(userPrincipal.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            CandidateProfile candidateProfile = candidateProfileRepository.findByUser(user)
                    .orElse(new CandidateProfile());

            // Mock resume score history for now
            List<Map<String, Object>> history = new ArrayList<>();
            Map<String, Object> initial = new HashMap<>();
            initial.put("period", "Resume 0");
            initial.put("score", 45);
            initial.put("label", "Initial");
            history.add(initial);
            
            Map<String, Object> current = new HashMap<>();
            current.put("period", "Resume 1");
            current.put("score", candidateProfile.getResumeScore() != null ? candidateProfile.getResumeScore() : 75);
            current.put("label", "Latest");
            history.add(current);
            
            Map<String, Object> response = new HashMap<>();
            response.put("history", history);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch resume score history");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    @PostMapping("/resume-check")
    public ResponseEntity<?> checkResume(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam("jobDescription") String jobDescription,
            @CurrentUser User currentUser) {
        try {
            // Mock AI resume analysis for now
            Map<String, Object> response = new HashMap<>();
            response.put("score", 78);
            
            List<String> strengths = Arrays.asList(
                "Strong technical skills mentioned",
                "Relevant work experience",
                "Good educational background",
                "Clear formatting and structure"
            );
            response.put("strengths", strengths);
            
            List<String> weaknesses = Arrays.asList(
                "Could add more quantified achievements",
                "Missing some keywords from job description",
                "Consider adding more project details"
            );
            response.put("weaknesses", weaknesses);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to analyze resume");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    private String saveProfileImage(MultipartFile image, Long userId) throws IOException {
        // Create uploads directory if it doesn't exist
        String uploadDir = "uploads/profiles/";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = image.getOriginalFilename();
        String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
        String filename = "profile_" + userId + "_" + System.currentTimeMillis() + extension;
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(image.getInputStream(), filePath);
        
        // Return relative path
        return "/uploads/profiles/" + filename;
    }
}
