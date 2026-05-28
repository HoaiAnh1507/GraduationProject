package vn.history.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.auth.ProfileResponse;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.service.auth.JwtService;

import java.time.Instant;

@RestController
@RequestMapping("/api")
public class MeController {

    private static final String ACCESS_COOKIE = "access_token";

    private final JwtService jwtService;
    private final UsersRepository usersRepository;

    public MeController(JwtService jwtService, UsersRepository usersRepository) {
        this.jwtService = jwtService;
        this.usersRepository = usersRepository;
    }

    @GetMapping("/me")
    public ProfileResponse me(@CookieValue(value = ACCESS_COOKIE, required = false) String accessToken) {
        JwtService.AccessTokenClaims claims;
        try {
            claims = jwtService.parseAccessToken(accessToken, Instant.now());
        } catch (IllegalStateException e) {
            throw new UnauthorizedException("Invalid access token");
        }

        var user = usersRepository.findById(claims.userId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return new ProfileResponse(
                user.id(),
                user.email(),
                user.displayName(),
                user.username(),
                user.createdAt(),
                user.updatedAt()
        );
    }
}
