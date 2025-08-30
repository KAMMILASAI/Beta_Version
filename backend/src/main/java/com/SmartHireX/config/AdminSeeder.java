package com.SmartHireX.config;

import com.SmartHireX.entity.User;
import com.SmartHireX.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email:smarthirex1@gmail.com}")
    private String adminEmail;

    @Value("${admin.default-password:cseateam9}")
    private String adminDefaultPassword;

    @Value("${app.admin.reset-password-on-startup:false}")
    private boolean resetPasswordOnStartup;

    @Value("${app.admin.ensure-default-password:false}")
    private boolean ensureDefaultPassword;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            if (adminEmail == null || adminEmail.isBlank()) {
                log.warn("Admin email is not configured; skipping admin seeding");
                return;
            }
            String email = adminEmail.trim().toLowerCase();
            Optional<User> existingOpt = userRepository.findByEmail(email);
            if (existingOpt.isEmpty()) {
                // Create admin
                User admin = new User();
                admin.setEmail(email);
                admin.setFirstName("Admin");
                admin.setLastName("User");
                admin.setRole("admin");
                admin.setVerified(true);
                admin.setEmailVerified(true);
                admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
                userRepository.save(admin);
                log.info("Seeded default admin user: {}", email);
            } else {
                // Update to ensure admin role and enabled flags
                User admin = existingOpt.get();
                boolean changed = false;
                if (!"admin".equalsIgnoreCase(admin.getRole())) {
                    admin.setRole("admin");
                    changed = true;
                }
                if (!admin.isVerified()) {
                    admin.setVerified(true);
                    changed = true;
                }
                if (!Boolean.TRUE.equals(admin.isEmailVerified())) {
                    admin.setEmailVerified(true);
                    changed = true;
                }
                if (resetPasswordOnStartup) {
                    admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
                    changed = true;
                    log.warn("Admin password reset on startup is ENABLED. Consider disabling in production.");
                } else if (admin.getPassword() == null || admin.getPassword().isBlank()) {
                    admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
                    changed = true;
                    log.info("Admin had no password; set a default one.");
                } else if (ensureDefaultPassword && !passwordEncoder.matches(adminDefaultPassword, admin.getPassword())) {
                    admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
                    changed = true;
                    log.warn("Admin password did not match default and ensure-default-password=true; updated to default.");
                }
                if (changed) {
                    userRepository.save(admin);
                    log.info("Updated admin user to ensure role/verification: {}", email);
                } else {
                    log.info("Admin user already up-to-date: {}", email);
                }
            }
        } catch (Exception e) {
            log.error("Failed to seed/update admin user", e);
        }
    }
}
