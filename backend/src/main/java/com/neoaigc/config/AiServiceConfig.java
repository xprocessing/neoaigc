package com.neoaigc.config;

import com.neoaigc.service.AiService;
import com.neoaigc.service.AliyunBailianAiService;
import com.neoaigc.service.HunyuanAiService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI服务配置类，根据配置选择对应的AI服务提供商
 */
@Configuration
public class AiServiceConfig {

    /**
     * 默认AI服务，使用配置中指定的服务提供商
     */
    @Bean(name = "aiService")
    @ConditionalOnProperty(name = "ai.provider", havingValue = "tencent", matchIfMissing = true)
    public AiService defaultTencentAiService() {
        return new HunyuanAiService();
    }

    @Bean(name = "aiService")
    @ConditionalOnProperty(name = "ai.provider", havingValue = "aliyun")
    public AiService defaultAliyunAiService() {
        return new AliyunBailianAiService();
    }
}