package vn.history.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI(
            @Value("${spring.application.name:backend}") String appName
    ) {
        return new OpenAPI()
                .info(new Info()
                        .title(appName + " API")
                        .description("Backend API for History RAG Hybrid Search project")
                        .version("v1")
                        .license(new License().name("UNLICENSED"))
                );
    }
}
