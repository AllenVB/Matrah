package com.matrah.service;

import com.matrah.model.*;
import com.matrah.repository.InvoiceRepository;
import com.matrah.repository.TaxSummaryRepository;
import com.matrah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Türk Vergi Mevzuatına göre fatura kalemlerini analiz eden servis.
 *
 * <ul>
 * <li>Yakıt / Araç Bakım: %70 indirilebilir, %30 KKEG (VUK Md.)</li>
 * <li>Yemek sınırı: 330 TL/gün (2026) — aşan kısım isDeductible=false</li>
 * <li>Genç Girişimci İstisnası: INDIVIDUAL için yıllık 400.000 TL muafiyet</li>
 * <li>KDV takibi: Her fatura onayında ödenecek KDV güncellenir</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TaxAnalysisService {

    // 2026 yemek gider sınırı
    private static final BigDecimal FOOD_DAILY_LIMIT = new BigDecimal("330.00");
    // Yakıt/Araç için indirilebilir oran
    private static final BigDecimal VEHICLE_DEDUCTIBLE_RATE = new BigDecimal("0.70");
    // Genç girişimci yıllık muafiyet tutarı (INDIVIDUAL - 2026)
    private static final BigDecimal YOUNG_ENTREPRENEUR_EXEMPTION = new BigDecimal("400000.00");
    // Standart KDV oranları
    private static final int[] STANDARD_VAT_RATES = { 1, 10, 20 };

    private final InvoiceRepository invoiceRepository;
    private final TaxSummaryRepository taxSummaryRepository;
    private final UserRepository userRepository;
    private final TaxCalculator taxCalculator;

    // ─────────────────────────────────────────────────────────
    // 1. Gider Analizi — InvoiceDetail bazında
    // ─────────────────────────────────────────────────────────

    /**
     * Fatura detayını analiz eder; isDeductible, kkegAmount ve
     * deductibilityNote alanlarını doldurur.
     *
     * @param detail Analiz edilecek fatura detayı
     * @param user   Fatura sahibi kullanıcı
     * @return Güncellenmiş detail (kaydedilmez, servis üzerinden yapılır)
     */
    public InvoiceDetail analyze(InvoiceDetail detail, User user) {
        if (detail == null)
            throw new IllegalArgumentException("InvoiceDetail boş olamaz");
        if (detail.getTotalAmount() == null || detail.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            detail.setDeductible(false);
            detail.setDeductibilityNote("Tutar geçersiz — KDV indirimi uygulanamaz.");
            return detail;
        }

        return switch (detail.getCategory()) {
            case FUEL, VEHICLE_MAINTENANCE -> applyVehicleCap(detail);
            case FOOD -> applyFoodLimit(detail);
            case ENTERTAINMENT -> applyEntertainmentRule(detail);
            default -> fullyDeductible(detail);
        };
    }

    // ─────────────────────────────────────────────────────────
    // 2. KDV Takibi — Fatura onaylandığında çağrılır
    // ─────────────────────────────────────────────────────────

    /**
     * Fatura onaylandığında ilgili ayın TaxSummary'sini günceller.
     * Ödenecek KDV = Tahsil Edilen KDV − Ödenen KDV
     */
    public void updateVatTracking(Invoice invoice) {
        if (invoice.getStatus() != InvoiceStatus.APPROVED)
            return;
        if (invoice.getDetails() == null || invoice.getDetails().isEmpty())
            return;

        User user = invoice.getUser();
        LocalDate invoiceDate = invoice.getCreatedAt().toLocalDate();
        int month = invoiceDate.getMonthValue();
        int year = invoiceDate.getYear();

        TaxSummary summary = taxSummaryRepository
                .findByUserIdAndMonthAndYear(user.getId(), month, year)
                .orElseGet(() -> createEmptySummary(user, month, year));

        for (InvoiceDetail detail : invoice.getDetails()) {
            BigDecimal vatAmount = detail.getVatAmount() != null ? detail.getVatAmount() : BigDecimal.ZERO;
            // Alınan fatura → ödenen KDV → indirilecek KDV
            summary.setPaidVat(summary.getPaidVat().add(vatAmount));
            summary.setTotalExpense(summary.getTotalExpense().add(detail.getTotalAmount()));
            summary.setTotalDeductibleExpense(
                    summary.getTotalDeductibleExpense().add(
                            detail.getDeductibleAmount() != null ? detail.getDeductibleAmount()
                                    : detail.getTotalAmount()));
            summary.setTotalKkeg(summary.getTotalKkeg().add(
                    detail.getKkegAmount() != null ? detail.getKkegAmount() : BigDecimal.ZERO));
        }

        // Ödenecek net KDV yeniden hesapla
        summary.setNetVatPayable(summary.getCollectedVat().subtract(summary.getPaidVat()));

        // Vergi matrahı ve tahmini vergi
        summary.setTaxBase(summary.getTotalIncome().subtract(summary.getTotalDeductibleExpense()));
        summary.setEstimatedTax(computeEstimatedTax(summary, user));

        taxSummaryRepository.save(summary);
        log.info("TaxSummary güncellendi — user:{} {}/{} netVAT:{}",
                user.getId(), month, year, summary.getNetVatPayable());
    }

    // ─────────────────────────────────────────────────────────
    // 3. KDV Oranı Normalizasyonu
    // ─────────────────────────────────────────────────────────

    /**
     * Okunan KDV oranını en yakın Türk standart oranına yuvarlar (%1, %10, %20).
     * Formül: rate = (vatAmount / (totalAmount - vatAmount)) * 100
     */
    public BigDecimal normalizeVatRate(BigDecimal totalAmount, BigDecimal vatAmount) {
        if (vatAmount == null || vatAmount.compareTo(BigDecimal.ZERO) == 0)
            return BigDecimal.ZERO;
        if (totalAmount == null || totalAmount.compareTo(vatAmount) <= 0)
            return BigDecimal.valueOf(20);

        BigDecimal netAmount = totalAmount.subtract(vatAmount);
        BigDecimal computed = vatAmount.divide(netAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        int rate = computed.intValue();
        int closest = STANDARD_VAT_RATES[0];
        int minDiff = Math.abs(rate - STANDARD_VAT_RATES[0]);

        for (int r : STANDARD_VAT_RATES) {
            int diff = Math.abs(rate - r);
            if (diff < minDiff) {
                minDiff = diff;
                closest = r;
            }
        }

        log.debug("KDV oranı normalize edildi: hesaplanan={}% → standart={}%", rate, closest);
        return BigDecimal.valueOf(closest);
    }

    // ─────────────────────────────────────────────────────────
    // 4. Aylık TaxSummary DTO için sorgu metodu
    // ─────────────────────────────────────────────────────────

    public TaxSummary getMonthlySummary(String userEmail, int month, int year) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı"));
        return taxSummaryRepository.findByUserIdAndMonthAndYear(user.getId(), month, year)
                .orElseGet(() -> createEmptySummary(user, month, year));
    }

    // ─────────────────────────────────────────────────────────
    // Private Helpers
    // ─────────────────────────────────────────────────────────

    /** Yakıt / Araç bakım: %70 indirilebilir, %30 KKEG */
    private InvoiceDetail applyVehicleCap(InvoiceDetail d) {
        BigDecimal deductible = d.getTotalAmount().multiply(VEHICLE_DEDUCTIBLE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal kkeg = d.getTotalAmount().subtract(deductible);
        d.setDeductibleAmount(deductible);
        d.setKkegAmount(kkeg);
        d.setDeductible(true);
        d.setDeductibilityNote(String.format(
                "Yakıt/Araç bakım gideri: Toplam %.2f TL'nin yalnızca %%70'i (%.2f TL) indirilebilir. " +
                        "Kalan %.2f TL KKEG olarak ayrıldı (VUK hükmü).",
                d.getTotalAmount(), deductible, kkeg));
        return d;
    }

    /** Yemek: 330 TL/gün sınırı — aşan kısım isDeductible=false */
    private InvoiceDetail applyFoodLimit(InvoiceDetail d) {
        if (d.getInvoiceDate() == null) {
            return fullyDeductible(d);
        }
        if (d.getTotalAmount().compareTo(FOOD_DAILY_LIMIT) <= 0) {
            d.setDeductibleAmount(d.getTotalAmount());
            d.setDeductible(true);
            d.setDeductibilityNote("Yemek gideri: 330 TL günlük sınır içinde — tamamı indirilebilir.");
        } else {
            BigDecimal excess = d.getTotalAmount().subtract(FOOD_DAILY_LIMIT);
            d.setDeductibleAmount(FOOD_DAILY_LIMIT);
            d.setKkegAmount(excess);
            d.setDeductible(true);
            d.setDeductibilityNote(String.format(
                    "Yemek gideri günlük 330 TL sınırını aşıyor. " +
                            "330 TL indirilebilir, aşan %.2f TL KKEG (2026 Tarifesi).",
                    excess));
        }
        return d;
    }

    /** Eğlence/temsil: Tümüyle KKEG */
    private InvoiceDetail applyEntertainmentRule(InvoiceDetail d) {
        d.setDeductible(false);
        d.setDeductibleAmount(BigDecimal.ZERO);
        d.setKkegAmount(d.getTotalAmount());
        d.setDeductibilityNote("Temsil/eğlence giderleri KDV Kanunu Md.30/d gereği vergiden düşülemez.");
        return d;
    }

    /** Tamamı indirilebilir kategoriler */
    private InvoiceDetail fullyDeductible(InvoiceDetail d) {
        d.setDeductible(true);
        d.setDeductibleAmount(d.getTotalAmount());
        d.setKkegAmount(BigDecimal.ZERO);
        if (d.getDeductibilityNote() == null) {
            d.setDeductibilityNote("Bu gider tamamıyla KDV indirimine uygundur.");
        }
        return d;
    }

    /** Tahmini vergi hesabı — INDIVIDUAL için Genç Girişimci muafiyeti */
    private BigDecimal computeEstimatedTax(TaxSummary summary, User user) {
        BigDecimal taxBase = summary.getTaxBase().max(BigDecimal.ZERO);

        if (user.getCompanyType() == CompanyType.INDIVIDUAL) {
            // Genç Girişimci İstisnası: yıllık 400.000 TL muafiyet
            taxBase = taxBase.subtract(YOUNG_ENTREPRENEUR_EXEMPTION).max(BigDecimal.ZERO);
            log.debug("INDIVIDUAL muafiyeti uygulandı: kalan matrah={}", taxBase);
        }

        // Basitleştirilmiş Gelir Vergisi tarifesi (2026)
        // Gerçek üretim implementasyonu dilimlere göre hesaplamalıdır.
        BigDecimal taxRate;
        if (taxBase.compareTo(new BigDecimal("110000")) <= 0) {
            taxRate = new BigDecimal("0.15");
        } else if (taxBase.compareTo(new BigDecimal("230000")) <= 0) {
            taxRate = new BigDecimal("0.20");
        } else if (taxBase.compareTo(new BigDecimal("870000")) <= 0) {
            taxRate = new BigDecimal("0.27");
        } else if (taxBase.compareTo(new BigDecimal("3000000")) <= 0) {
            taxRate = new BigDecimal("0.35");
        } else {
            taxRate = new BigDecimal("0.40");
        }

        return taxBase.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
    }

    private TaxSummary createEmptySummary(User user, int month, int year) {
        TaxSummary s = new TaxSummary();
        s.setUser(user);
        s.setMonth(month);
        s.setYear(year);
        return s;
    }
}
