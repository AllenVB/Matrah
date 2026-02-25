package com.matrah.service;

import com.matrah.model.ExpenseCategory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class TaxCalculator {

    public BigDecimal calculateDeductibleAmount(ExpenseCategory category, BigDecimal totalAmount) {
        if (totalAmount == null)
            return BigDecimal.ZERO;

        // Örnek iş kuralları (Mevzuata göre güncellenebilir)
        return switch (category) {
            case IT_SERVICES, OFFICE, EDUCATION, RENT, UTILITY ->
                totalAmount; // %100 indirilebilir
            case FUEL, TRAVEL, VEHICLE_MAINTENANCE ->
                totalAmount.multiply(new BigDecimal("0.70")); // %70 indirilebilir
            case FOOD ->
                totalAmount.multiply(new BigDecimal("0.50")); // Temsil ağırlama limit
            case ENTERTAINMENT ->
                BigDecimal.ZERO; // Tümüyle KKEG
            case HEALTH ->
                totalAmount; // Tamamı indirilebilir (belge şartıyla)
            default ->
                totalAmount.multiply(new BigDecimal("0.30"));
        };
    }

    public BigDecimal calculateVatAmount(BigDecimal totalAmount, BigDecimal taxRate) {
        if (totalAmount == null || taxRate == null)
            return BigDecimal.ZERO;

        // İçyüzde KDV Hesaplama Örneği: KDV = (Toplam Tutar / (1 + (Oran / 100))) *
        // (Oran / 100)
        BigDecimal rate = taxRate.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal divisor = rate.add(BigDecimal.ONE);
        BigDecimal netAmount = totalAmount.divide(divisor, 2, RoundingMode.HALF_UP);

        return totalAmount.subtract(netAmount);
    }
}
