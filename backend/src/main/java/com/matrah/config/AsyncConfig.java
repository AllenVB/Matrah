package com.matrah.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Spring @Async desteğini etkinleştirir.
 * InvoiceService.processInvoiceAsync() bu sayede ayrı bir thread'de çalışır.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Varsayılan SimpleAsyncTaskExecutor kullanılır.
    // Üretim ortamında ThreadPoolTaskExecutor yapılandırılabilir.
}
