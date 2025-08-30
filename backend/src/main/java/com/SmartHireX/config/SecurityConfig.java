package com.SmartHireX.config;

import com.SmartHireX.security.JwtAuthenticationEntryPoint;
import com.SmartHireX.security.JwtAuthenticationFilter;
import com.SmartHireX.security.OAuth2.CustomOAuth2UserService;
import com.SmartHireX.security.OAuth2.OAuth2AuthenticationFailureHandler;
import com.SmartHireX.security.OAuth2.OAuth2AuthenticationSuccessHandler;
import com.SmartHireX.security.OAuth2.HttpCookieOAuth2AuthorizationRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

    @Autowired
    public SecurityConfig(JwtAuthenticationEntryPoint unauthorizedHandler,
                         JwtAuthenticationFilter jwtAuthenticationFilter,
                         CustomOAuth2UserService customOAuth2UserService,
                         OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
                         OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler) {
        this.unauthorizedHandler = unauthorizedHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
    }

    @Bean
    public HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository() {
        return new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .authorizeHttpRequests(auth -> {
                // Auth endpoints - MUST be first to take precedence
                // Note: context path /api is stripped, so we match the actual paths
                auth.requestMatchers(
                    "/auth/send-registration-otp",
                    "/auth/verify-registration-otp",
                    "/auth/send-login-otp",
                    "/auth/verify-login-otp",
                    "/auth/register",
                    "/auth/login",
                    "/auth/forgot-password",
                    "/auth/reset-password"
                ).permitAll();
                
                // OAuth2 endpoints
                auth.requestMatchers(
                    "/oauth2/authorize/**",
                    "/oauth2/authorization/**", 
                    "/oauth2/user",
                    "/login/oauth2/code/*"
                ).permitAll();
                
                
                // Public endpoints
                auth.requestMatchers(
                    "/",
                    "/error",
                    "/favicon.ico",
                    // Config public endpoints
                    "/config/support-upi",
                    // Public job apply endpoints (context path /api is stripped)
                    "/jobs/**",
                    // Presence endpoints for online counter
                    "/presence/**"
                ).permitAll();
                
                // Static resources
                auth.requestMatchers(
                    "*.png",
                    "*.gif", 
                    "*.svg",
                    "*.jpg",
                    "*.html",
                    "*.css",
                    "*.js"
                ).permitAll();
                
                // Swagger/OpenAPI docs
                auth.requestMatchers(
                    "/v3/api-docs",
                    "/swagger-ui",
                    "/swagger-ui.html"
                ).permitAll();
                
                // All other requests require authentication
                auth.anyRequest().authenticated();
            })
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization -> authorization
                    .baseUri("/oauth2/authorize")
                    .authorizationRequestRepository(cookieAuthorizationRequestRepository())
                )
                .redirectionEndpoint(redirection -> redirection
                    .baseUri("/login/oauth2/code/*")
                )
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(oAuth2AuthenticationSuccessHandler)
                .failureHandler(oAuth2AuthenticationFailureHandler)
            );

        // Add our custom JWT security filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://smarthirex.netlify.app",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
