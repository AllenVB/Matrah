package com.matrah.controller;

import com.matrah.model.TaxSummary;
import com.matrah.service.TaxAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tax")
@RequiredArgsConstructor
public class TaxSummaryController {

    private final TaxAnalysisService taxAnalysisService;

    private String getEmail(Authentication auth) {
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "user@gmail.com";
    }

    /**
     * Belirtilen ay ve yılın vergi özetini döner.
     * GET /api/tax/summary?month=2&year=2026
     */
    @GetMapping("/summary")
    public ResponseEntity<TaxSummary> getMonthlySummary(
            @RequestParam int month,
            @RequestParam int year,
            Authentication auth) {

        return ResponseEntity.ok(taxAnalysisService.getMonthlySummary(getEmail(auth), month, year));
    }
}
