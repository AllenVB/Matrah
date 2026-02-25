package com.matrah.dto;

import com.matrah.model.ExpenseCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ManualInvoiceRequest {

    @NotBlank(message = "Satıcı adı (firma/kişi) boş olamaz")
    @Size(min = 2, max = 200, message = "Satıcı adı 2-200 karakter olmalıdır")
    private String vendorName;

    @NotNull(message = "Toplam tutar zorunludur")
    @DecimalMin(value = "0.01", message = "Toplam tutar 0'dan büyük olmalıdır")
    @DecimalMax(value = "9999999.99", message = "Tutar gerçekçi bir değer olmalıdır")
    private BigDecimal totalAmount;

    @NotNull(message = "KDV oranı zorunludur")
    @DecimalMin(value = "0", message = "KDV oranı negatif olamaz")
    @DecimalMax(value = "100", message = "KDV oranı %100'den büyük olamaz")
    private BigDecimal taxRate;

    // KDV tutarı otomatik hesaplanacaksa null bırakılabilir
    private BigDecimal vatAmount;

    @NotNull(message = "Kategori seçimi zorunludur")
    private ExpenseCategory category;

    @NotNull(message = "Fatura tarihi zorunludur")
    @PastOrPresent(message = "Fatura tarihi bugün veya geçmişte olmalıdır")
    private LocalDate invoiceDate;

    // Opsiyonel: ETTN, fatura no vb.
    private String invoiceNumber;
    private String taxId; // Satıcı VKN/TCKN (isteğe bağlı)

    /**
     * Basit tutarlılık doğrulaması:
     * - Eğer KDV tutarı girilmişse, toplam tutardan büyük olamaz.
     * - Satıcı adı rakamdan ibaret olamaz (örn: "123456" geçersiz).
     */
    public boolean isValid() {
        // Satıcı adı yalnızca rakam içeremez
        if (vendorName != null && vendorName.trim().matches("^[0-9]+$")) {
            return false;
        }
        // VAT girilmişse tutarlı olmalı
        if (vatAmount != null && totalAmount != null) {
            if (vatAmount.compareTo(totalAmount) > 0) {
                return false;
            }
        }
        // Toplam tutar çok küçük (sandık bozuğu değil fatura olmalı) - 1 TL minimum
        if (totalAmount != null && totalAmount.compareTo(BigDecimal.ONE) < 0) {
            return false;
        }
        return true;
    }
}
