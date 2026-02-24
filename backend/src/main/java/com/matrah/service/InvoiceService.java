package com.matrah.service;

import com.matrah.dto.InvoiceDto;
import com.matrah.model.Invoice;
import com.matrah.model.InvoiceStatus;
import com.matrah.model.User;
import com.matrah.repository.InvoiceRepository;
import com.matrah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    public InvoiceDto uploadAndProcessInvoice(MultipartFile file, String email) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. GCS'e yükle
        String imageUrl = storageService.uploadFile(file);

        // 2. Veritabanında PENDING taslak oluştur
        Invoice invoice = new Invoice();
        invoice.setUser(user);
        invoice.setImageUrl(imageUrl);
        invoice.setStatus(InvoiceStatus.PENDING);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 3. AI Analizine Gönderim (asenkron veya senkron - sonraki adımda uygulanacak)
        try {
            var analysisResult = documentAIConnector.analyzeInvoice(imageUrl);
            if (analysisResult != null) {
                com.matrah.model.InvoiceDetail detail = new com.matrah.model.InvoiceDetail();
                detail.setInvoice(savedInvoice);
                detail.setTotalAmount(analysisResult.getTotalAmount() != null ? analysisResult.getTotalAmount()
                        : java.math.BigDecimal.ZERO);
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
                savedInvoice.setStatus(InvoiceStatus.APPROVED); // Veya inceleme için PENDING bırakılabilir.
                invoiceRepository.save(savedInvoice); // Cascade ile detail da kaydedilir.
            }
        } catch (Exception e) {
            System.err.println("Fatura AI analizi sırasında hata oluştu: " + e.getMessage());
        }

        return mapToDto(savedInvoice);
    }

    public List<InvoiceDto> getUserInvoices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return invoiceRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private InvoiceDto mapToDto(Invoice invoice) {
        return InvoiceDto.builder()
                .id(invoice.getId())
                .imageUrl(invoice.getImageUrl())
                .status(invoice.getStatus())
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
