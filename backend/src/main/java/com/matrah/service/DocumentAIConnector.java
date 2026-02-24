package com.matrah.service;

import com.matrah.dto.AIAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class DocumentAIConnector {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000/analyze}")
    private String aiServiceUrl;

    public DocumentAIConnector() {
        this.restTemplate = new RestTemplate();
    }

    public AIAnalysisResponse analyzeInvoice(String imageUrl) {
        // Python (FastAPI) servisine gönderilecek request
        Map<String, String> requestBody = Map.of("image_url", imageUrl);

        try {
            ResponseEntity<AIAnalysisResponse> response = restTemplate.postForEntity(
                    aiServiceUrl,
                    requestBody,
                    AIAnalysisResponse.class);
            return response.getBody();
        } catch (Exception e) {
            // Log error
            System.err.println("Document AI servis çağrısı başarısız: " + e.getMessage());
            return null; // Veya custom bir AutoAnalysisException fırlatılabilir
        }
    }
}
