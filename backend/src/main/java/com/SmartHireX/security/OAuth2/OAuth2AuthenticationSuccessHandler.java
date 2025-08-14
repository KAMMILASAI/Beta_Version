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
        setDefaultTargetUrl("http://localhost:5173/oauth2/redirect");
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
        String targetUrl = "http://localhost:5173/oauth2/redirect";
        
        System.out.println("OAuth2 Success - Force redirecting to frontend: " + targetUrl);

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        // Get user information
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        
        Optional<User> userOptional = userService.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found after OAuth2 authentication");
        }
        
        User user = userOptional.get();

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