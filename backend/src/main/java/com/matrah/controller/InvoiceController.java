package com.matrah.controller;

import com.matrah.dto.InvoiceDto;
import com.matrah.dto.ManualInvoiceRequest;
import com.matrah.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

                String userEmail = email(authentication);
                InvoiceDto dto = invoiceService.uploadAndProcessInvoice(file, userEmail);
                return ResponseEntity.ok(dto);
        }

        /**
         * PDF veya e-Fatura XML yükleme — Görüntüden farklı pipeline kullanır.
         * PDF: Document AI üzerinden işlenir.
         * XML: EInvoiceXmlParser ile parse edilir (GCS gerekmez).
         */
        @PostMapping("/upload-doc")
        public ResponseEntity<InvoiceDto> uploadDocument(
                        @RequestParam("file") MultipartFile file,
                        Authentication authentication) throws IOException {

                String userEmail = email(authentication);
                InvoiceDto dto = invoiceService.uploadDocument(file, userEmail);
                return ResponseEntity.ok(dto);
        }

        @PostMapping("/manual")
        public ResponseEntity<InvoiceDto> createManualInvoice(
                        @Valid @RequestBody ManualInvoiceRequest request,
                        Authentication authentication) {

                String userEmail = (authentication != null && authentication.isAuthenticated())
                                ? authentication.getName()
                                : "user@gmail.com";
                InvoiceDto dto = invoiceService.createManualInvoice(request, userEmail);
                return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        }

        @GetMapping
        public ResponseEntity<List<InvoiceDto>> getUserInvoices(Authentication authentication) {
                String userEmail = (authentication != null && authentication.isAuthenticated())
                                ? authentication.getName()
                                : "user@gmail.com";
                return ResponseEntity.ok(invoiceService.getUserInvoices(userEmail));
        }

        @PutMapping("/{id}")
        public ResponseEntity<InvoiceDto> updateInvoice(
                        @PathVariable Long id,
                        @Valid @RequestBody ManualInvoiceRequest request,
                        Authentication authentication) {

                String userEmail = (authentication != null && authentication.isAuthenticated())
                                ? authentication.getName()
                                : "user@gmail.com";
                return ResponseEntity.ok(invoiceService.updateInvoice(id, request, userEmail));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteInvoice(
                        @PathVariable Long id,
                        Authentication authentication) {

                String userEmail = (authentication != null && authentication.isAuthenticated())
                                ? authentication.getName()
                                : "user@gmail.com";
                invoiceService.deleteInvoice(id, userEmail);
                return ResponseEntity.noContent().build();
        }
}
