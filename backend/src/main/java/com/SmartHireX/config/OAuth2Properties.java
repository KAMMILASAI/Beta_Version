package com.SmartHireX.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.oauth2")
public class OAuth2Properties {
    private String authorizedRedirectUris;
    private int cookieExpireSeconds;

    public String getAuthorizedRedirectUris() {
        return authorizedRedirectUris;
    }

    public void setAuthorizedRedirectUris(String authorizedRedirectUris) {
        this.authorizedRedirectUris = authorizedRedirectUris;
    }

    public int getCookieExpireSeconds() {
        return cookieExpireSeconds;
    }

    public void setCookieExpireSeconds(int cookieExpireSeconds) {
        this.cookieExpireSeconds = cookieExpireSeconds;
    }
}
