package com.SmartHireX.controller.job;

import com.SmartHireX.entity.User;
import com.SmartHireX.model.JobPosting;
import com.SmartHireX.repository.JobRepository;
import com.SmartHireX.security.CurrentUser;
import com.SmartHireX.security.UserPrincipal;
import com.SmartHireX.service.UserService;
import com.SmartHireX.model.Application;
import com.SmartHireX.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/jobs")
public class JobController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @GetMapping
    public ResponseEntity<?> listMyJobs(@CurrentUser UserPrincipal principal) {
        try {
            User me = userService.findById(principal.getId()).orElseThrow();
            List<JobPosting> jobs = jobRepository.findByRecruiterOrderByCreatedAtDesc(me);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to list jobs", "message", e.getMessage()));
        }
    }

    // Public: check if an email already applied to a job identified by linkId
    @GetMapping("/{linkId}/applied")
    public ResponseEntity<?> hasApplied(@PathVariable String linkId, @RequestParam("email") String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "email is required"));
            }
            Optional<JobPosting> opt = jobRepository.findByLinkId(linkId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Invalid or expired link"));
            }
            JobPosting job = opt.get();
            boolean exists = applicationRepository.existsByJob_IdAndEmailLower(job.getId(), email.trim().toLowerCase());
            return ResponseEntity.ok(Map.of("applied", exists));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to check", "message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createJob(@CurrentUser UserPrincipal principal, @RequestBody Map<String, Object> body) {
        try {
            User me = userService.findById(principal.getId()).orElseThrow();

            JobPosting job = new JobPosting();
            job.setRecruiter(me);
            job.setTitle(Objects.toString(body.getOrDefault("title", ""))); // required in UI
            job.setDescription(Objects.toString(body.getOrDefault("description", "")));
            job.setSkills(Objects.toString(body.getOrDefault("skills", "")));
            // Optional company & location
            if (body.get("company") != null) job.setCompany(Objects.toString(body.get("company")));
            if (body.get("location") != null) job.setLocation(Objects.toString(body.get("location")));

            if (body.get("minCgpa") != null) job.setMinCgpa(Double.valueOf(body.get("minCgpa").toString()));
            if (body.get("minBacklogs") != null) job.setMinBacklogs(Integer.valueOf(body.get("minBacklogs").toString()));

            job.setCtc(Objects.toString(body.getOrDefault("ctc", "")));
            job.setEmploymentType(Objects.toString(body.getOrDefault("employmentType", "fulltime")));
            job.setStatus("active");

            if (body.get("expiresAt") != null) {
                try {
                    job.setExpiresAt(Instant.parse(body.get("expiresAt").toString()));
                } catch (Exception ignored) {}
            }

            JobPosting saved = jobRepository.save(job);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create job", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@CurrentUser UserPrincipal principal, @PathVariable Long id) {
        try {
            User me = userService.findById(principal.getId()).orElseThrow();
            Optional<JobPosting> opt = jobRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Job not found"));
            JobPosting job = opt.get();
            if (job.getRecruiter() == null || !Objects.equals(job.getRecruiter().getId(), me.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not allowed"));
            }
            jobRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete job", "message", e.getMessage()));
        }
    }

    // Optional: applications listing used by recruiter JobHistory UI
    @GetMapping("/{id}/applications")
    public ResponseEntity<?> listApplications(@CurrentUser UserPrincipal principal, @PathVariable Long id) {
        try {
            User me = userService.findById(principal.getId()).orElseThrow();
            Optional<JobPosting> opt = jobRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Job not found"));
            JobPosting job = opt.get();
            if (job.getRecruiter() == null || !Objects.equals(job.getRecruiter().getId(), me.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not allowed"));
            }

            var apps = applicationRepository.findByJob_IdOrderByCreatedAtDesc(id);
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to list applications", "message", e.getMessage()));
        }
    }

    // Public: fetch job by shareable linkId for candidate apply page
    @GetMapping("/{linkId}")
    public ResponseEntity<?> getJobByLink(@PathVariable String linkId) {
        try {
            Optional<JobPosting> opt = jobRepository.findByLinkId(linkId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Invalid or expired link"));
            }
            JobPosting job = opt.get();
            // Validate status and expiry
            if (!"active".equalsIgnoreCase(job.getStatus())) {
                return ResponseEntity.status(404).body(Map.of("message", "Invalid or expired link"));
            }
            if (job.getExpiresAt() != null && !job.getExpiresAt().isAfter(Instant.now())) {
                return ResponseEntity.status(404).body(Map.of("message", "Invalid or expired link"));
            }
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch job", "message", e.getMessage()));
        }
    }

    // Public: accept application submission for a job via linkId
    @PostMapping("/{linkId}/apply")
    public ResponseEntity<?> applyToJob(@PathVariable String linkId, @RequestBody Map<String, Object> body) {
        try {
            Optional<JobPosting> opt = jobRepository.findByLinkId(linkId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Invalid or expired link"));
            }
            JobPosting job = opt.get();
            // Validate status and expiry
            if (!"active".equalsIgnoreCase(job.getStatus())) {
                return ResponseEntity.status(400).body(Map.of("message", "Job is not accepting applications"));
            }
            if (job.getExpiresAt() != null && !job.getExpiresAt().isAfter(Instant.now())) {
                return ResponseEntity.status(400).body(Map.of("message", "Job has expired"));
            }

            String name = Objects.toString(body.getOrDefault("name", "")).trim();
            String email = Objects.toString(body.getOrDefault("email", "")).trim();
            if (name.isEmpty() || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Name and email are required"));
            }

            // Prevent duplicate by email per job
            if (applicationRepository.existsByJob_IdAndEmailLower(job.getId(), email.toLowerCase())) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "alreadyApplied", true,
                        "message", "You have already applied to this job.",
                        "jobId", job.getId()
                ));
            }

            Application app = new Application();
            app.setJob(job);
            app.setName(name);
            app.setEmail(email);
            app.setProfileType(Objects.toString(body.getOrDefault("profileType", "")));
            app.setCollege(Objects.toString(body.getOrDefault("college", "")));
            // parse numbers safely
            try { if (body.get("cgpa") != null) app.setCgpa(Double.valueOf(body.get("cgpa").toString())); } catch (Exception ignored) {}
            try { if (body.get("lpa") != null) app.setLpa(Double.valueOf(body.get("lpa").toString())); } catch (Exception ignored) {}
            try { if (body.get("yearsExp") != null) app.setYearsExp(Double.valueOf(body.get("yearsExp").toString())); } catch (Exception ignored) {}

            // booleans
            if (body.get("isFresher") != null) {
                app.setIsFresher(Boolean.valueOf(body.get("isFresher").toString()));
            }
            app.setDegree(Objects.toString(body.getOrDefault("degree", "")));
            app.setCompany(Objects.toString(body.getOrDefault("company", "")));

            // skills array -> comma string
            Object skillsObj = body.get("skills");
            if (skillsObj instanceof Collection<?> col) {
                String skills = col.stream().filter(Objects::nonNull).map(Object::toString).map(String::trim).filter(s -> !s.isEmpty()).distinct().reduce((a, b) -> a + "," + b).orElse("");
                app.setSkills(skills);
            } else if (skillsObj instanceof String s) {
                app.setSkills(s);
            }

            Application saved = applicationRepository.save(app);

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Application submitted! Check your email for confirmation.");
            resp.put("jobId", job.getId());
            resp.put("applicationId", saved.getId());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to apply", "message", e.getMessage()));
        }
    }
}
