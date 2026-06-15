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
import vn.history.backend.repository.RefreshTokensRepository;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.auth.TokenHasher;

import java.io.IOException;
import java.util.List;

@Component
public class RefreshTokenCookieAuthenticationFilter extends OncePerRequestFilter {

    private static final String REFRESH_COOKIE = "refresh_token";
    private static final List<SimpleGrantedAuthority> USER_AUTHORITIES =
            List.of(new SimpleGrantedAuthority("ROLE_USER"));

    private final RefreshTokensRepository refreshTokensRepository;
    private final UsersRepository usersRepository;

    public RefreshTokenCookieAuthenticationFilter(
            RefreshTokensRepository refreshTokensRepository,
            UsersRepository usersRepository
    ) {
        this.refreshTokensRepository = refreshTokensRepository;
        this.usersRepository = usersRepository;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        return !"/api/auth/refresh".equals(path) && !"/api/auth/logout".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticateFromRefreshToken(request);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateFromRefreshToken(HttpServletRequest request) {
        String token = refreshToken(request);
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            String tokenHash = TokenHasher.sha256Hex(token);
            refreshTokensRepository.findValidByHash(tokenHash)
                    .flatMap(row -> usersRepository.findById(row.userId()))
                    .ifPresent(user -> {
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

    private String refreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
