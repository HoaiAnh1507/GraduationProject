package vn.history.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class GoogleOAuth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final String failureUrl;

    public GoogleOAuth2AuthenticationFailureHandler(
            @Value("${app.frontend.oauth2-failure-url:http://localhost:5173/login?oauth2=failed}") String failureUrl
    ) {
        this.failureUrl = failureUrl;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        response.sendRedirect(failureUrl);
    }
}
