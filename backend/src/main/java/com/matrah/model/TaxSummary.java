package com.matrah.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Kullanıcının aylık/yıllık vergi özetini tutar.
 * KDV takibi + Gelir Vergisi matrahı hesabı burada saklanır.
 */
@Entity
@Table(name = "tax_summaries", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "month", "year" }))
@Getter
@Setter
@NoArgsConstructor
public class TaxSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer month; // 1-12

    @Column(nullable = false)
    private Integer year;

    // ─── Gelir ───────────────────────────────────────────────
    /** Toplam gelir (brüt) */
    @Column(name = "total_income", precision = 14, scale = 2)
    private BigDecimal totalIncome = BigDecimal.ZERO;

    /** Tahsil edilen KDV (satışlar üzerinden) */
    @Column(name = "collected_vat", precision = 14, scale = 2)
    private BigDecimal collectedVat = BigDecimal.ZERO;

    // ─── Gider ────────────────────────────────────────────────
    /** Toplam onaylı gider tutarı */
    @Column(name = "total_expense", precision = 14, scale = 2)
    private BigDecimal totalExpense = BigDecimal.ZERO;

    /** Vergiden düşülebilir toplam gider */
    @Column(name = "total_deductible_expense", precision = 14, scale = 2)
    private BigDecimal totalDeductibleExpense = BigDecimal.ZERO;

    /** KKEG (Kanunen Kabul Edilmeyen Gider) toplamı */
    @Column(name = "total_kkeg", precision = 14, scale = 2)
    private BigDecimal totalKkeg = BigDecimal.ZERO;

    /** Ödenen KDV (alınan faturalar üzerinden) */
    @Column(name = "paid_vat", precision = 14, scale = 2)
    private BigDecimal paidVat = BigDecimal.ZERO;

    // ─── Vergi Hesabı ─────────────────────────────────────────
    /**
     * Ödenecek / İade Edilecek KDV.
     * = collectedVat - paidVat (negatif ise iade hakkı doğar)
     */
    @Column(name = "net_vat_payable", precision = 14, scale = 2)
    private BigDecimal netVatPayable = BigDecimal.ZERO;

    /**
     * Gelir Vergisi Matrahı.
     * = totalIncome - totalDeductibleExpense
     * INDIVIDUAL için yıllık 400.000 TL'ye kadar muafiyet uygulanır.
     */
    @Column(name = "tax_base", precision = 14, scale = 2)
    private BigDecimal taxBase = BigDecimal.ZERO;

    /**
     * Tahmini Gelir/Kurumlar Vergisi.
     * Gelir Vergisi tarifesi veya %25 Kurumlar Vergisi oranı ile hesaplanır.
     */
    @Column(name = "estimated_tax", precision = 14, scale = 2)
    private BigDecimal estimatedTax = BigDecimal.ZERO;
}
