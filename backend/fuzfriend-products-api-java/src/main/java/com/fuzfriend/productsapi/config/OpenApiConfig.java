package com.fuzfriend.productsapi.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiInfo() {
        return new OpenAPI()
                .info(new Info()
                        .title("Fuzfriend Products API (Java)")
                        .description("Spring Boot port of the .NET Products API. Search, filter, sort, and paginate products.")
                        .version("v1")
                        .contact(new Contact().name("Fuzfriend").url("https://example.com"))
                        .license(new License().name("MIT")))
                .externalDocs(new ExternalDocumentation()
                        .description("Repo")
                        .url("https://github.com/nickpeachey/fuzfriend"));
    }
}
