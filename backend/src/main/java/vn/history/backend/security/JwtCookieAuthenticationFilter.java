package vn.history.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.auth.JwtService;
import vn.history.backend.service.auth.TokenBlacklistService;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
public class JwtCookieAuthenticationFilter extends OncePerRequestFilter {

    private static final String ACCESS_COOKIE = "access_token";
    private static final List<SimpleGrantedAuthority> USER_AUTHORITIES =
            List.of(new SimpleGrantedAuthority("ROLE_USER"));

    private final JwtService jwtService;
    private final UsersRepository usersRepository;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtCookieAuthenticationFilter(
            JwtService jwtService,
            UsersRepository usersRepository,
            TokenBlacklistService tokenBlacklistService
    ) {
        this.jwtService = jwtService;
        this.usersRepository = usersRepository;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticateFromCookie(request);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateFromCookie(HttpServletRequest request) {
        String token = accessToken(request);
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            var claims = jwtService.parseAccessToken(token, Instant.now());
            if (tokenBlacklistService.isBlacklisted(token, claims)) {
                SecurityContextHolder.clearContext();
                return;
            }
            usersRepository.findById(claims.userId()).ifPresent(user -> {
                var principal = new AuthenticatedUser(user.id(), user.email());
                var authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        USER_AUTHORITIES
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        } catch (RuntimeException e) {
            SecurityContextHolder.clearContext();
        }
    }

    private String accessToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (ACCESS_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
