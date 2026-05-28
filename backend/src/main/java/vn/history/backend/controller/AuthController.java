package vn.history.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.auth.AuthResponse;
import vn.history.backend.dto.auth.LoginRequest;
import vn.history.backend.dto.auth.RegisterRequest;
import vn.history.backend.service.auth.AuthService;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String ACCESS_COOKIE = "access_token";
    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;
    private final boolean cookieSecure;
    private final String cookieSameSite;

    public AuthController(
            AuthService authService,
            @Value("${app.auth.cookie-secure:false}") boolean cookieSecure,
            @Value("${app.auth.cookie-same-site:Lax}") String cookieSameSite
    ) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
        this.cookieSameSite = cookieSameSite;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest httpReq
    ) {
        var result = authService.register(req, userAgent(httpReq), clientIp(httpReq));
        return withCookies(result, ResponseEntity.ok(result.response()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest httpReq
    ) {
        var result = authService.login(req, userAgent(httpReq), clientIp(httpReq));
        return withCookies(result, ResponseEntity.ok(result.response()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletRequest httpReq
    ) {
        var result = authService.refresh(refreshToken, userAgent(httpReq), clientIp(httpReq));
        return withCookies(result, ResponseEntity.ok(result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = REFRESH_COOKIE, required = false) String refreshToken
    ) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, clearCookie(ACCESS_COOKIE, "/"))
            .header(HttpHeaders.SET_COOKIE, clearCookie(REFRESH_COOKIE, "/api/auth"))
                .build();
    }

    private ResponseEntity<AuthResponse> withCookies(AuthService.AuthResult result, ResponseEntity<AuthResponse> response) {
        return ResponseEntity.status(response.getStatusCode())
                .header(HttpHeaders.SET_COOKIE, accessCookie(result.accessToken(), result.accessExpiresAt()))
                .header(HttpHeaders.SET_COOKIE, refreshCookie(result.refreshToken(), result.refreshExpiresAt()))
                .body(response.getBody());
    }

    private String accessCookie(String token, Instant expiresAt) {
        Duration maxAge = maxAgeFrom(expiresAt);
        return ResponseCookie.from(ACCESS_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite(cookieSameSite)
                .maxAge(maxAge)
                .build()
                .toString();
    }

    private String refreshCookie(String token, Instant expiresAt) {
        Duration maxAge = maxAgeFrom(expiresAt);
        return ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .sameSite(cookieSameSite)
                .maxAge(maxAge)
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

    private String userAgent(HttpServletRequest req) {
        return req.getHeader("User-Agent");
    }

    private String clientIp(HttpServletRequest req) {
        return req.getRemoteAddr();
    }

    private Duration maxAgeFrom(Instant expiresAt) {
        Instant now = Instant.now();
        if (expiresAt == null || expiresAt.isBefore(now)) {
            return Duration.ZERO;
        }
        return Duration.between(now, expiresAt);
    }
}
