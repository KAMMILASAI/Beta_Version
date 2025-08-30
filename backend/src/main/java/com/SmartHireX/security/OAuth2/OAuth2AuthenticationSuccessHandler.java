package com.SmartHireX.security.OAuth2;

import com.SmartHireX.entity.User;
import com.SmartHireX.service.UserService;
import com.SmartHireX.security.JwtTokenProvider;
import com.SmartHireX.util.CookieUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.Optional;

import static com.SmartHireX.security.OAuth2.HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private JwtTokenProvider tokenProvider;

    private UserService userService;

    private HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.oauth2.authorizedRedirectUris}")
    private String authorizedRedirectUris;

    @Autowired
    OAuth2AuthenticationSuccessHandler(JwtTokenProvider tokenProvider, @Lazy UserService userService,
                                      HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository) {
        this.tokenProvider = tokenProvider;
        this.userService = userService;
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
        // Force frontend redirect URL
        setDefaultTargetUrl("https://smarthirex.netlify.app/oauth2/redirect");
        setAlwaysUseDefaultTargetUrl(false);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String targetUrl = determineTargetUrl(request, response, authentication);

        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect to " + targetUrl);
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        // Always redirect to frontend - ignore any stored redirect URIs that might point to backend
        String targetUrl = "https://smarthirex.netlify.app/oauth2/redirect";
        
        System.out.println("OAuth2 Success - Force redirecting to frontend: " + targetUrl);

        // Get user information
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        
        Optional<User> userOptional = userService.findByEmail(email);
        if (userOptional.isEmpty()) {
            // New OAuth2 user: send to register with prefilled info
            String name = oAuth2User.getAttribute("name");
            String desiredRole = null;
            Optional<Cookie> roleCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.ROLE_PARAM_COOKIE_NAME);
            if (roleCookie.isPresent()) {
                String rc = roleCookie.get().getValue();
                if (rc != null) {
                    rc = rc.trim().toLowerCase();
                    if ("candidate".equals(rc) || "recruiter".equals(rc) || "admin".equals(rc)) {
                        desiredRole = rc;
                    }
                }
            }

            // Check OAuth2 initiation source
            String source = null;
            Optional<Cookie> sourceCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.SOURCE_PARAM_COOKIE_NAME);
            if (sourceCookie.isPresent()) {
                source = sourceCookie.get().getValue();
            }

            UriComponentsBuilder builder = UriComponentsBuilder.fromUriString("https://smarthirex.netlify.app/register")
                    .queryParam("oauth2User", true)
                    .queryParam("email", email)
                    .queryParam("name", name)
                    .queryParam("role", desiredRole);
            // Only show error hint if OAuth2 was started from Login page (not Register)
            if (source == null || !"register".equalsIgnoreCase(source)) {
                builder.queryParam("error", "oauth_register_required");
            }
            String registerUrl = builder.build().toUriString();
            System.out.println("OAuth2 Success - New user, redirecting to register: " + registerUrl);
            return registerUrl;
        }
        
        User user = userOptional.get();

        // Try to read desired role from cookie (set at authorization step)
        String desiredRole = null;
        Optional<Cookie> roleCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.ROLE_PARAM_COOKIE_NAME);
        if (roleCookie.isPresent()) {
            String rc = roleCookie.get().getValue();
            if (rc != null) {
                rc = rc.trim().toLowerCase();
                if ("candidate".equals(rc) || "recruiter".equals(rc) || "admin".equals(rc)) {
                    desiredRole = rc;
                }
            }
        }

        boolean userChanged = false;
        if (desiredRole != null && !desiredRole.equalsIgnoreCase(user.getRole())) {
            user.setRole(desiredRole);
            userChanged = true;
        }
        // Do NOT change verified flag here. Admin approval sets it; we only respect it.
        if (userChanged) {
            userService.save(user);
        }

        // If recruiter and not verified, do NOT issue token; redirect with pending approval info
        if ("recruiter".equalsIgnoreCase(user.getRole()) && !user.isEnabled()) {
            String pendingUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("error", "pending_approval")
                    .queryParam("email", user.getEmail())
                    .queryParam("firstName", user.getFirstName())
                    .queryParam("lastName", user.getLastName())
                    .queryParam("role", user.getRole())
                    .build().toUriString();
            System.out.println("OAuth2 Success - Recruiter pending approval, redirecting to: " + pendingUrl);
            return pendingUrl;
        }

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("token", token)
                .queryParam("userId", user.getId())
                .queryParam("email", user.getEmail())
                .queryParam("firstName", user.getFirstName())
                .queryParam("lastName", user.getLastName())
                .queryParam("role", user.getRole())
                .queryParam("emailVerified", user.isEmailVerified())
                .queryParam("oAuth2Provider", user.getOAuth2Provider())
                .build().toUriString();
                
        System.out.println("OAuth2 Success - Redirecting to: " + finalUrl);
        return finalUrl;
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }

    private boolean isAuthorizedRedirectUri(String uri) {
        URI clientRedirectUri = URI.create(uri);
        URI authorizedURI = URI.create(authorizedRedirectUris);
        
        return authorizedURI.getHost().equalsIgnoreCase(clientRedirectUri.getHost())
                && authorizedURI.getPort() == clientRedirectUri.getPort();
    }
}