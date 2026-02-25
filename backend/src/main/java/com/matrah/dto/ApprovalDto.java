package com.matrah.dto;

import com.matrah.model.ApprovalStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ApprovalDto {
    private Long id;
    private Long freelancerId;
    private String freelancerEmail;
    private String accountantEmail;
    private ApprovalStatus status;
    private String accountantNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    // Freelancer'ın fatura özeti
    private int invoiceCount;
    private java.math.BigDecimal totalDeductibleVat;
}
