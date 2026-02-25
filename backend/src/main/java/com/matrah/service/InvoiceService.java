package com.matrah.service;

import com.matrah.dto.InvoiceDto;
import com.matrah.dto.ManualInvoiceRequest;
import com.matrah.model.Invoice;
import com.matrah.model.InvoiceDetail;
import com.matrah.model.InvoiceStatus;
import com.matrah.model.User;
import com.matrah.repository.InvoiceRepository;
import com.matrah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final DocumentAIConnector documentAIConnector;
    private final TaxCalculator taxCalculator;
    private final NotificationService notificationService;

    /**
     * Faturayı kaydeder, anünda PENDING olarak döner, analizi arka planda yapar.
     */
    public InvoiceDto uploadAndProcessInvoice(MultipartFile file, String email) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = storageService.uploadFile(file);

        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setImageUrl(imageUrl);
        invoice.setStatus(InvoiceStatus.PENDING);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // AI analizi arka planda çalışışır; kullanıcı PENDING DTO alır ve WebSocket ile
        // bilgilendirilir
        processInvoiceAsync(savedInvoice.getId(), imageUrl, user.getId());

        return mapToDto(savedInvoice);
    }

    @Async
    public void processInvoiceAsync(Long invoiceId, String imageUrl, Long userId) {
        Invoice savedInvoice = invoiceRepository.findById(invoiceId).orElse(null);
        if (savedInvoice == null)
            return;

        try {
            var analysisResult = documentAIConnector.analyzeInvoice(imageUrl);

            // AI anlamlı bir fatura verisi döndürmediyse faturayı REDDET
            boolean isValidInvoice = analysisResult != null
                    && analysisResult.getTotalAmount() != null
                    && analysisResult.getTotalAmount().compareTo(java.math.BigDecimal.ONE) >= 0;

            if (!isValidInvoice) {
                savedInvoice.setStatus(InvoiceStatus.REJECTED);
                invoiceRepository.save(savedInvoice);
                notificationService.notifyInvoiceUpdated(userId, invoiceId, "REJECTED");
                return;
            }

            // Geçerli fatura verisi işleniyor
            com.matrah.model.InvoiceDetail detail = new com.matrah.model.InvoiceDetail();
            detail.setInvoice(savedInvoice);
            detail.setTotalAmount(analysisResult.getTotalAmount());
            detail.setVatAmount(analysisResult.getVatAmount() != null ? analysisResult.getVatAmount()
                    : java.math.BigDecimal.ZERO);
            detail.setTaxRate(
                    analysisResult.getTaxRate() != null ? analysisResult.getTaxRate() : java.math.BigDecimal.ZERO);
            detail.setVendorName(analysisResult.getVendorName());

            try {
                detail.setCategory(com.matrah.model.ExpenseCategory.valueOf(analysisResult.getCategory()));
            } catch (Exception e) {
                detail.setCategory(com.matrah.model.ExpenseCategory.OTHER);
            }

            // AI KDV bulamadı ama oran varsa hesaplamayı dene
            if (detail.getVatAmount().compareTo(java.math.BigDecimal.ZERO) == 0
                    && detail.getTaxRate().compareTo(java.math.BigDecimal.ZERO) > 0) {
                detail.setVatAmount(taxCalculator.calculateVatAmount(detail.getTotalAmount(), detail.getTaxRate()));
            }

            savedInvoice.addDetail(detail);
            savedInvoice.setStatus(InvoiceStatus.APPROVED);
            invoiceRepository.save(savedInvoice);

        } catch (Exception e) {
            System.err.println("Fatura AI analizi sırasında hata oluştu: " + e.getMessage());
            savedInvoice.setStatus(InvoiceStatus.REJECTED);
            invoiceRepository.save(savedInvoice);
        }

        // AI analizi tamamlandı, WebSocket ile bildir
        invoiceRepository.findById(invoiceId)
                .ifPresent(inv -> notificationService.notifyInvoiceUpdated(userId, invoiceId, inv.getStatus().name()));
    }

    /**
     * Manuel giriş ile fatura oluşturur.
     * Geçersiz verilerde 422 Unprocessable Entity fırlatır.
     */
    public InvoiceDto createManualInvoice(ManualInvoiceRequest req, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Tutarlılık kontrolü
        if (!req.isValid()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Geçersiz fatura: Satıcı adı, tutar veya KDV bilgisi tutarsız.");
        }

        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setImageUrl("/api/uploads/manual-entry.png"); // Manuel giriş işareti
        invoice.setStatus(InvoiceStatus.APPROVED);

        // KDV tutartarı girilmediyse oran üzerinden hesapla
        BigDecimal vatAmount = req.getVatAmount();
        if (vatAmount == null || vatAmount.compareTo(BigDecimal.ZERO) == 0) {
            vatAmount = taxCalculator.calculateVatAmount(req.getTotalAmount(), req.getTaxRate());
        }

        InvoiceDetail detail = new InvoiceDetail();
        detail.setInvoice(invoice);
        detail.setTotalAmount(req.getTotalAmount());
        detail.setVatAmount(vatAmount);
        detail.setTaxRate(req.getTaxRate());
        detail.setVendorName(req.getVendorName());
        detail.setCategory(req.getCategory());

        invoice.addDetail(detail);
        Invoice saved = invoiceRepository.save(invoice);
        return mapToDto(saved);
    }

    public List<InvoiceDto> getUserInvoices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return invoiceRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Mevcut bir faturasını günceller.
     * REJECTED olanlar da düzenlenerek APPROVED yapılabilir.
     */
    public InvoiceDto updateInvoice(Long invoiceId, ManualInvoiceRequest req, String email) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fatura bulunamadı"));

        // Sahiplik kontrolü
        if (!invoice.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu faturayu düzenleme yetkiniz yok");
        }

        if (!req.isValid()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Geçersiz veri: Satıcı adı, tutar veya KDV bilgisi tutarsız.");
        }

        BigDecimal vatAmount = req.getVatAmount();
        if (vatAmount == null || vatAmount.compareTo(BigDecimal.ZERO) == 0) {
            vatAmount = taxCalculator.calculateVatAmount(req.getTotalAmount(), req.getTaxRate());
        }

        // Mevcut detayı güncel veya yeni ekle
        InvoiceDetail detail;
        if (invoice.getDetails() != null && !invoice.getDetails().isEmpty()) {
            detail = invoice.getDetails().get(0);
        } else {
            detail = new InvoiceDetail();
            detail.setInvoice(invoice);
            invoice.addDetail(detail);
        }

        detail.setVendorName(req.getVendorName());
        detail.setTotalAmount(req.getTotalAmount());
        detail.setVatAmount(vatAmount);
        detail.setTaxRate(req.getTaxRate());
        detail.setCategory(req.getCategory());

        invoice.setStatus(InvoiceStatus.APPROVED);
        return mapToDto(invoiceRepository.save(invoice));
    }

    /**
     * Bir faturavyı siler.
     */
    public void deleteInvoice(Long invoiceId, String email) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fatura bulunamadı"));

        if (!invoice.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu faturavyı silme yetkiniz yok");
        }

        invoiceRepository.delete(invoice);
    }

    private InvoiceDto mapToDto(Invoice invoice) {
        String vendorName = null;
        java.math.BigDecimal totalAmount = null;
        java.math.BigDecimal vatAmount = null;
        java.math.BigDecimal taxRate = null;
        com.matrah.model.ExpenseCategory category = null;

        if (invoice.getDetails() != null && !invoice.getDetails().isEmpty()) {
            var detail = invoice.getDetails().get(0);
            vendorName = detail.getVendorName();
            totalAmount = detail.getTotalAmount();
            vatAmount = detail.getVatAmount();
            taxRate = detail.getTaxRate();
            category = detail.getCategory();
        }

        boolean isManual = invoice.getImageUrl() != null
                && invoice.getImageUrl().contains("manual-entry");

        return InvoiceDto.builder()
                .id(invoice.getId())
                .imageUrl(invoice.getImageUrl())
                .status(invoice.getStatus())
                .createdAt(invoice.getCreatedAt())
                .vendorName(vendorName)
                .totalAmount(totalAmount)
                .vatAmount(vatAmount)
                .taxRate(taxRate)
                .category(category)
                .manual(isManual)
                .build();
    }
}
