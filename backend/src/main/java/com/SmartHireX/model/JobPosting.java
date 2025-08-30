package com.SmartHireX.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import com.SmartHireX.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "job_postings")
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id", nullable = false)
    @JsonIgnore
    private User recruiter;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Comma-separated list of skills for simplicity
    private String skills; // e.g., "Java, Spring, React"

    // Optional company and location for candidate UI
    private String company;
    private String location;

    private Double minCgpa;

    private Integer minBacklogs;

    // Keep as string to allow ranges like "8-12 LPA" or currency symbols
    private String ctc;

    // fulltime | remote | on-site
    private String employmentType;

    // active | paused | closed
    @Column(nullable = false)
    private String status = "active";

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant expiresAt;

    @Column(unique = true, nullable = false, updatable = false)
    private String linkId;

    // Short human-friendly code to be used when creating tests, e.g., SHX-ABC123
    @Column(unique = true, nullable = false, updatable = false)
    private String jobCode;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.linkId == null) {
            this.linkId = UUID.randomUUID().toString();
        }
        if (this.jobCode == null) {
            this.jobCode = generateJobCode();
        }
    }

    private String generateJobCode() {
        // Format: SHX-XXXXXX (A-Z0-9)
        String base = UUID.randomUUID().toString().replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        return "SHX-" + base.substring(0, 6);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // Also expose plain "id" alongside "_id" for mixed frontend usage
    @JsonProperty("id")
    public Long getIdAlias() {
        return id;
    }

    public User getRecruiter() {
        return recruiter;
    }

    public void setRecruiter(User recruiter) {
        this.recruiter = recruiter;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getMinCgpa() {
        return minCgpa;
    }

    public void setMinCgpa(Double minCgpa) {
        this.minCgpa = minCgpa;
    }

    public Integer getMinBacklogs() {
        return minBacklogs;
    }

    public void setMinBacklogs(Integer minBacklogs) {
        this.minBacklogs = minBacklogs;
    }

    public String getCtc() {
        return ctc;
    }

    public void setCtc(String ctc) {
        this.ctc = ctc;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getLinkId() {
        return linkId;
    }

    public void setLinkId(String linkId) {
        this.linkId = linkId;
    }

    public String getJobCode() {
        return jobCode;
    }

    public void setJobCode(String jobCode) {
        this.jobCode = jobCode;
    }
}
