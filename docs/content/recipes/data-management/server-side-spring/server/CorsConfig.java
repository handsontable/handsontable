package com.example.products;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows browsers on any origin to call /api/** endpoints.
 *
 * In production, replace `allowedOrigins("*")` with the actual frontend URL
 * to prevent cross-site request abuse.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry
            .addMapping("/api/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "PATCH", "DELETE");
    }
}
