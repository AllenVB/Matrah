package com.matrah.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AIAnalysisResponse {
    private BigDecimal totalAmount;
    private BigDecimal vatAmount;
    private BigDecimal taxRate;
    private String vendorName;
    private String category; // Mapped to ExpenseCategory later
}
