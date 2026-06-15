package vn.history.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import vn.history.backend.exception.UnauthorizedException;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AuthenticatedUser requireUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof AuthenticatedUser user)) {
            throw new UnauthorizedException("Authentication required");
        }

        return user;
    }

    public static long requireUserId() {
        return requireUser().id();
    }
}
