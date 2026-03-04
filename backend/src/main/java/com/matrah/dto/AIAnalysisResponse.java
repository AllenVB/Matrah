package com.matrah.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;

/**
 * AI servisinden (Python FastAPI) dönen JSON yanıtını deserialize eder.
 * Python AnalyzeResponse modeli camelCase kullandığından @JsonProperty
 * annotasyonları ile birebir eşleştirme garantilenir.
 */
@Data
public class AIAnalysisResponse {

    @JsonProperty("totalAmount")
    private BigDecimal totalAmount;

    @JsonProperty("vatAmount")
    private BigDecimal vatAmount;

    @JsonProperty("taxRate")
    private BigDecimal taxRate;

    @JsonProperty("vendorName")
    private String vendorName;

    /** ExpenseCategory enum değeriyle eşleştirilir (InvoiceService'de). */
    @JsonProperty("category")
    private String category;

    /** AI fallback kullanıldıysa uyarı mesajı */
    @JsonProperty("quality_warning")
    private String qualityWarning;
}
