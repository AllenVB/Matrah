package com.matrah.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

/**
 * Spring @Async desteğini etkinleştirir.
 * InvoiceService.processInvoiceAsync() bu sayede ayrı bir thread'de çalışır.
 * RestTemplate bean'i de burada tanımlanır (DocumentAIConnector tarafından
 * kullanılır).
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Varsayılan SimpleAsyncTaskExecutor kullanılır.
    // Üretim ortamında ThreadPoolTaskExecutor yapılandırılabilir.

    /**
     * Spring-yönetimli RestTemplate — Jackson ObjectMapper ayarları
     * otomatik olarak uygulanır; DocumentAIConnector'a inject edilir.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
