package com.matrah.service;

import com.matrah.dto.AIAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Python FastAPI ai-service ile iletişimi sağlar.
 * RestTemplate, Spring tarafından yönetilir ve Jackson ObjectMapper
 * ayarları otomatik olarak uygulanır.
 */
@Slf4j
@Service
public class DocumentAIConnector {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000/analyze}")
    private String aiServiceUrl;

    /** RestTemplate, AppConfig üzerinden inject edilir. */
    public DocumentAIConnector(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Fatura görüntüsünü AI servisine göndererek analiz sonucunu döner.
     *
     * @param imageUrl Kaydedilen dosyanın URL'i (/api/uploads/... veya gs://...)
     * @return AIAnalysisResponse; hata durumunda null döner
     */
    public AIAnalysisResponse analyzeInvoice(String imageUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("image_url", imageUrl);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            AIAnalysisResponse response = restTemplate.postForObject(
                    aiServiceUrl,
                    request,
                    AIAnalysisResponse.class);
            log.debug("AI analiz yanıtı alındı — url: {}, totalAmount: {}",
                    imageUrl, response != null ? response.getTotalAmount() : "null");
            return response;
        } catch (RestClientException e) {
            log.error("AI servis çağrısı başarısız — url: {}, hata: {}", aiServiceUrl, e.getMessage());
            return null;
        }
    }
}
