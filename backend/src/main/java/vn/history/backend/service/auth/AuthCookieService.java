package vn.history.backend.service.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class AuthCookieService {

    public static final String ACCESS_COOKIE = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";

    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthCookieService(
            @Value("${app.auth.cookie-secure:false}") boolean cookieSecure,
            @Value("${app.auth.cookie-same-site:Lax}") String cookieSameSite
    ) {
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    public List<String> authCookies(AuthService.AuthResult result) {
        return List.of(
                accessCookie(result.accessToken(), result.accessExpiresAt()),
                refreshCookie(result.refreshToken(), result.refreshExpiresAt())
        );
    }

    public List<String> clearCookies() {
        return List.of(
                clearCookie(ACCESS_COOKIE, "/"),
                clearCookie(REFRESH_COOKIE, "/api/auth")
        );
    }

    public void addAuthCookies(HttpServletResponse response, AuthService.AuthResult result) {
        authCookies(result).forEach(cookie -> response.addHeader(HttpHeaders.SET_COOKIE, cookie));
    }

    private String accessCookie(String token, Instant expiresAt) {
        return ResponseCookie.from(ACCESS_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(maxAgeFrom(expiresAt))
                .build()
                .toString();
    }

    private String refreshCookie(String token, Instant expiresAt) {
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .sameSite(cookieSameSite)
                .maxAge(maxAgeFrom(expiresAt))
                .build()
                .toString();
    }

    private String clearCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path(path)
                .sameSite(cookieSameSite)
                .maxAge(0)
                .build()
                .toString();
    }

    private Duration maxAgeFrom(Instant expiresAt) {
        Instant now = Instant.now();
        if (expiresAt == null || expiresAt.isBefore(now)) {
            return Duration.ZERO;
        }
        return Duration.between(now, expiresAt);
    }
}
