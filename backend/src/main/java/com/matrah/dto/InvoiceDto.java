package com.matrah.dto;

import com.matrah.model.ExpenseCategory;
import com.matrah.model.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceDto {
    private Long id;
    private String imageUrl;
    private InvoiceStatus status;
    private LocalDateTime createdAt;
    // Fatura detay alanı
    private String vendorName;
    private BigDecimal totalAmount;
    private BigDecimal vatAmount;
    private BigDecimal taxRate;
    private ExpenseCategory category;
    private boolean manual; // elle girildi mi
}
