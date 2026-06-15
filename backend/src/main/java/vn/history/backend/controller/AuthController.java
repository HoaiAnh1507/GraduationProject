package vn.history.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.auth.AuthResponse;
import vn.history.backend.dto.auth.LoginRequest;
import vn.history.backend.dto.auth.RegisterRequest;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.service.LoginRateLimiter;
import vn.history.backend.service.auth.AuthCookieService;
import vn.history.backend.service.auth.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final LoginRateLimiter loginRateLimiter;
    private final AuthCookieService authCookieService;

    public AuthController(
            AuthService authService,
            LoginRateLimiter loginRateLimiter,
            AuthCookieService authCookieService
    ) {
        this.authService = authService;
        this.loginRateLimiter = loginRateLimiter;
        this.authCookieService = authCookieService;
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
        String ip = clientIp(httpReq);
        loginRateLimiter.assertAllowed(ip);
        try {
            var result = authService.login(req, userAgent(httpReq), ip);
            loginRateLimiter.clear(ip);
            return withCookies(result, ResponseEntity.ok(result.response()));
        } catch (UnauthorizedException e) {
            loginRateLimiter.recordFailure(ip);
            throw e;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(value = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletRequest httpReq
    ) {
        var result = authService.refresh(refreshToken, userAgent(httpReq), clientIp(httpReq));
        return withCookies(result, ResponseEntity.ok(result.response()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(value = AuthCookieService.REFRESH_COOKIE, required = false) String refreshToken,
            @CookieValue(value = AuthCookieService.ACCESS_COOKIE, required = false) String accessToken
    ) {
        authService.logout(refreshToken, accessToken);
        ResponseEntity.HeadersBuilder<?> builder = ResponseEntity.noContent();
        authCookieService.clearCookies().forEach(cookie -> builder.header(HttpHeaders.SET_COOKIE, cookie));
        return builder.build();
    }

    private ResponseEntity<AuthResponse> withCookies(AuthService.AuthResult result, ResponseEntity<AuthResponse> response) {
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(response.getStatusCode());
        authCookieService.authCookies(result).forEach(cookie -> builder.header(HttpHeaders.SET_COOKIE, cookie));
        return builder.body(response.getBody());
    }

    private String userAgent(HttpServletRequest req) {
        return req.getHeader("User-Agent");
    }

    private String clientIp(HttpServletRequest req) {
        String forwardedFor = req.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int comma = forwardedFor.indexOf(',');
            return comma >= 0 ? forwardedFor.substring(0, comma).trim() : forwardedFor.trim();
        }
        String realIp = req.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return req.getRemoteAddr();
    }

}
