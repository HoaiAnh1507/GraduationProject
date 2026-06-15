package vn.history.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

@Configuration
@ConditionalOnProperty(name = "app.auth.google.enabled", havingValue = "true")
public class GoogleOAuth2ClientConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${app.auth.google.client-id:}") String clientId,
            @Value("${app.auth.google.client-secret:}") String clientSecret
    ) {
        return new InMemoryClientRegistrationRepository(
                CommonOAuth2Provider.GOOGLE
                        .getBuilder("google")
                        .clientId(requireConfigured(clientId, "app.auth.google.client-id"))
                        .clientSecret(requireConfigured(clientSecret, "app.auth.google.client-secret"))
                        .scope("openid", "email", "profile")
                        .build()
        );
    }

    private String requireConfigured(String value, String propertyName) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(propertyName + " must be configured when Google OAuth2 login is enabled");
        }
        return value.trim();
    }
}
