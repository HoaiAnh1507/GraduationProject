package vn.history.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import vn.history.backend.service.auth.AuthCookieService;
import vn.history.backend.service.auth.AuthService;

import java.io.IOException;

@Component
public class GoogleOAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final String successUrl;

    public GoogleOAuth2AuthenticationSuccessHandler(
            AuthService authService,
            AuthCookieService authCookieService,
            @Value("${app.frontend.oauth2-success-url:http://localhost:5173/}") String successUrl
    ) {
        this.authService = authService;
        this.authCookieService = authCookieService;
        this.successUrl = successUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        if (!(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            throw new ServletException("Unsupported OAuth2 principal");
        }

        AuthService.GoogleProfile profile = new AuthService.GoogleProfile(
                stringAttribute(oauth2User, "sub"),
                stringAttribute(oauth2User, "email"),
                stringAttribute(oauth2User, "name"),
                stringAttribute(oauth2User, "picture"),
                booleanAttribute(oauth2User, "email_verified")
        );

        var result = authService.loginWithGoogle(profile, userAgent(request), clientIp(request));
        authCookieService.addAuthCookies(response, result);
        clearTemporaryOAuth2Session(request);
        response.sendRedirect(successUrl);
    }

    private String stringAttribute(OAuth2User oauth2User, String name) {
        Object value = oauth2User.getAttributes().get(name);
        return value == null ? null : value.toString();
    }

    private boolean booleanAttribute(OAuth2User oauth2User, String name) {
        Object value = oauth2User.getAttributes().get(name);
        if (value instanceof Boolean bool) {
            return bool;
        }
        return value != null && Boolean.parseBoolean(value.toString());
    }

    private void clearTemporaryOAuth2Session(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
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
