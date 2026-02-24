package com.matrah.controller;

import com.matrah.dto.InvoiceDto;
import com.matrah.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/upload")
    public ResponseEntity<InvoiceDto> uploadInvoice(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        String userEmail = authentication.getName();
        InvoiceDto dto = invoiceService.uploadAndProcessInvoice(file, userEmail);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<List<InvoiceDto>> getUserInvoices(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(invoiceService.getUserInvoices(userEmail));
    }
}
