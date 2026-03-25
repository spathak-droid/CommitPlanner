package com.weeklycommit.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "anthropic")
public class AnthropicConfig {

    private String apiKey = "";
    private String baseUrl = "";
    private String model = "claude-sonnet-4-20250514";
    private int maxTokens = 1024;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public int getMaxTokens() { return maxTokens; }
    public void setMaxTokens(int maxTokens) { this.maxTokens = maxTokens; }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Bean
    public AiConfig aiConfig() {
        return new AiConfig(apiKey, baseUrl, model, maxTokens, isEnabled());
    }

    public record AiConfig(String apiKey, String baseUrl, String model, int maxTokens, boolean enabled) {}
}
