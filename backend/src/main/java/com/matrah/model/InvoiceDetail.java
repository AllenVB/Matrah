package com.matrah.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "invoice_details")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "vendor_name")
    private String vendorName;

    @Column(name = "tax_id") // Tedarikçinin VKN / TCKN
    private String taxId;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "vat_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExpenseCategory category = ExpenseCategory.OTHER;

    /**
     * KDV Kanunu Md.30 ve özel kural uygulanarak hesaplanan indirilebilir net
     * tutar.
     * Örn. Yakıt gideri toplamın sadece %70'i indirilebilir.
     */
    @Column(name = "deductible_amount", precision = 12, scale = 2)
    private BigDecimal deductibleAmount;

    /**
     * Kanunen Kabul Edilmeyen Gider (KKEG) kısmı.
     * totalAmount - deductibleAmount = kkegAmount
     */
    @Column(name = "kkeg_amount", precision = 12, scale = 2)
    private BigDecimal kkegAmount = BigDecimal.ZERO;

    /** true: Bu kalem vergiden düşülebilir. false: Tümüyle KKEG. */
    @Column(name = "is_deductible", nullable = false)
    private boolean isDeductible = true;

    /** Vergi analiz açıklaması — Frontend'te tooltip olarak gösterilir. */
    @Column(name = "deductibility_note", length = 512)
    private String deductibilityNote;
}
