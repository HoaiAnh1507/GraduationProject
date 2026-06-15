package vn.history.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.history.backend.dto.auth.ProfileResponse;
import vn.history.backend.exception.UnauthorizedException;
import vn.history.backend.repository.UsersRepository;
import vn.history.backend.security.SecurityUtils;

@RestController
@RequestMapping("/api")
public class MeController {

    private final UsersRepository usersRepository;

    public MeController(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    @GetMapping("/me")
    public ProfileResponse me() {
        var user = usersRepository.findById(SecurityUtils.requireUserId())
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
