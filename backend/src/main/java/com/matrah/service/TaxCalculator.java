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
            case IT_SERVICES, OFFICE -> totalAmount.multiply(new BigDecimal("1.00")); // %100 düşülebilir
            case FUEL, TRAVEL -> totalAmount.multiply(new BigDecimal("0.70")); // Binek araç için %70 gider
                                                                               // gösterilebilir
            case FOOD -> totalAmount.multiply(new BigDecimal("0.50")); // Temsil ağırlama için %50 (Örnektir)
            case OTHER -> totalAmount.multiply(new BigDecimal("0.30"));
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
