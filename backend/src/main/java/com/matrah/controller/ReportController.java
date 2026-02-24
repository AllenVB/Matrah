package com.matrah.controller;

import com.matrah.model.Invoice;
import com.matrah.model.User;
import com.matrah.repository.InvoiceRepository;
import com.matrah.repository.UserRepository;
import com.matrah.service.PdfGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final PdfGenerator pdfGenerator;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadTaxReport(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Invoice> userInvoices = invoiceRepository.findByUserId(user.getId());

        byte[] pdfBytes = pdfGenerator.generateTaxReport(user, userInvoices);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "matrah_vergi_raporu.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
