package com.matrah.dto;

import com.matrah.model.InvoiceStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceDto {
    private Long id;
    private String imageUrl;
    private InvoiceStatus status;
    private LocalDateTime createdAt;
    // Detaylar eklenebilir.
}
