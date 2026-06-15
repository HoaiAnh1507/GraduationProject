package vn.history.backend.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import vn.history.backend.dto.auth.AuthResponse;
import vn.history.backend.dto.auth.LoginRequest;
import vn.history.backend.dto.auth.RegisterRequest;
import vn.history.backend.exception.ConflictException;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.LocalCredentialsRepository;
import vn.history.backend.repository.RefreshTokensRepository;
import vn.history.backend.repository.UsersRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Base64;

@Service
public class AuthService {

    private final UsersRepository usersRepository;
    private final LocalCredentialsRepository localCredentialsRepository;
    private final RefreshTokensRepository refreshTokensRepository;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final BCryptPasswordEncoder passwordEncoder;

    private final Duration accessTokenTtl;
    private final Duration refreshTokenTtl;
    private final ZoneId timeZone;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UsersRepository usersRepository,
            LocalCredentialsRepository localCredentialsRepository,
            RefreshTokensRepository refreshTokensRepository,
            JwtService jwtService,
            TokenBlacklistService tokenBlacklistService,
            @Value("${app.auth.access-token-minutes:15}") long accessTokenMinutes,
                @Value("${app.auth.refresh-token-days:7}") long refreshTokenDays,
                @Value("${APP_DB_TIMEZONE:Asia/Ho_Chi_Minh}") String timeZoneId
    ) {
        this.usersRepository = usersRepository;
        this.localCredentialsRepository = localCredentialsRepository;
        this.refreshTokensRepository = refreshTokensRepository;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.accessTokenTtl = Duration.ofMinutes(accessTokenMinutes);
        this.refreshTokenTtl = Duration.ofDays(refreshTokenDays);
        this.timeZone = ZoneId.of(timeZoneId == null || timeZoneId.isBlank() ? "Asia/Ho_Chi_Minh" : timeZoneId);
    }

    public AuthResult register(RegisterRequest req, String userAgent, String ip) {
        if (usersRepository.findByEmail(req.email()).isPresent()) {
            throw new ConflictException("Email already registered");
        }

        try {
            long userId = usersRepository.insertUser(req.email(), req.displayName(), req.username());
            String passwordHash = passwordEncoder.encode(req.password());
            localCredentialsRepository.insert(userId, passwordHash);

            var user = usersRepository.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("User not found after insert"));
            return issueTokens(user, userAgent, ip);
        } catch (DuplicateKeyException e) {
            throw new ConflictException("Email already registered");
        }
    }

    public AuthResult login(LoginRequest req, String userAgent, String ip) {
        var userOpt = usersRepository.findByEmail(req.email());
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password");
        }

        var user = userOpt.get();
        String passwordHash = localCredentialsRepository.findPasswordHashByUserId(user.id())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), passwordHash)) {
            throw new UnauthorizedException("Invalid email or password");
        }

        return issueTokens(user, userAgent, ip);
    }

    public AuthResult refresh(String refreshToken, String userAgent, String ip) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }

        String tokenHash = TokenHasher.sha256Hex(refreshToken);
        var tokenRow = refreshTokensRepository.findValidByHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid or expired"));

        refreshTokensRepository.updateLastUsed(tokenRow.id());
        refreshTokensRepository.revoke(tokenRow.id());

        var user = usersRepository.findById(tokenRow.userId())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return issueTokens(user, userAgent, ip);
    }

    public void logout(String refreshToken, String accessToken) {
        tokenBlacklistService.blacklistAccessToken(accessToken);

        if (refreshToken != null && !refreshToken.isBlank()) {
            String tokenHash = TokenHasher.sha256Hex(refreshToken);
            refreshTokensRepository.findValidByHash(tokenHash)
                    .ifPresent(row -> refreshTokensRepository.revoke(row.id()));
        }
    }

    private AuthResult issueTokens(UsersRepository.UserRow user, String userAgent, String ip) {
        Instant now = Instant.now();
        String accessToken = jwtService.createAccessToken(user.id(), user.email(), now, accessTokenTtl);

        String refreshToken = generateRefreshToken();
        String refreshHash = TokenHasher.sha256Hex(refreshToken);
        Instant refreshExpiresAt = now.plus(refreshTokenTtl);

        String ipHash = ip == null ? null : TokenHasher.sha256Hex(ip);
        refreshTokensRepository.insert(user.id(), refreshHash, refreshExpiresAt, userAgent, ipHash);

        AuthResponse response = new AuthResponse(
                user.id(),
                user.email(),
                user.displayName(),
            OffsetDateTime.ofInstant(now.plus(accessTokenTtl), timeZone)
        );
        return new AuthResult(response, accessToken, refreshToken, now.plus(accessTokenTtl), refreshExpiresAt);
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record AuthResult(
            AuthResponse response,
            String accessToken,
            String refreshToken,
            Instant accessExpiresAt,
            Instant refreshExpiresAt
    ) {
    }
}
