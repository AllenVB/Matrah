package com.matrah.service;

import com.matrah.dto.ApprovalDto;
import com.matrah.model.*;
import com.matrah.repository.ApprovalRequestRepository;
import com.matrah.repository.InvoiceRepository;
import com.matrah.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalRequestRepository approvalRepo;
    private final UserRepository userRepo;
    private final InvoiceRepository invoiceRepo;

    /**
     * Freelancer, muhasebecisine onay isteği gönderir.
     */
    public ApprovalDto requestApproval(String freelancerEmail, String accountantEmail) {
        User freelancer = userRepo.findByEmail(freelancerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı"));

        // Aynı muhasebeciye bekleyen istek varsa yeniden oluşturma
        boolean pendingExists = approvalRepo
                .findByAccountantEmailAndStatus(accountantEmail, ApprovalStatus.PENDING)
                .stream()
                .anyMatch(r -> r.getFreelancer().getId().equals(freelancer.getId()));

        if (pendingExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu muhasebeciye zaten bekleyen bir onay isteğiniz var.");
        }

        // Muhasebeci sisteme kayıtlı mı?
        User accountant = userRepo.findByEmail(accountantEmail).orElse(null);

        ApprovalRequest req = new ApprovalRequest();
        req.setFreelancer(freelancer);
        req.setAccountant(accountant);
        req.setAccountantEmail(accountantEmail);
        req.setStatus(ApprovalStatus.PENDING);

        return toDto(approvalRepo.save(req), freelancer);
    }

    /**
     * Muhasebecinin gelen isteklerini listeler.
     */
    public List<ApprovalDto> getIncomingRequests(String accountantEmail) {
        return approvalRepo.findByAccountantEmailOrderByCreatedAtDesc(accountantEmail)
                .stream()
                .map(r -> toDto(r, r.getFreelancer()))
                .collect(Collectors.toList());
    }

    /**
     * Freelancerin gönderdiği istekleri listeler.
     */
    public List<ApprovalDto> getSentRequests(String freelancerEmail) {
        User freelancer = userRepo.findByEmail(freelancerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kullanıcı bulunamadı"));

        return approvalRepo.findByFreelancerIdOrderByCreatedAtDesc(freelancer.getId())
                .stream()
                .map(r -> toDto(r, freelancer))
                .collect(Collectors.toList());
    }

    /**
     * Muhasebeci, isteği inceler ve karar verir.
     */
    public ApprovalDto reviewRequest(Long approvalId, ApprovalStatus decision,
            String note, String accountantEmail) {
        ApprovalRequest req = approvalRepo.findById(approvalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "İstek bulunamadı"));

        if (!req.getAccountantEmail().equals(accountantEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu isteği inceleme yetkiniz yok");
        }

        if (req.getStatus() != ApprovalStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu istek zaten incelendi");
        }

        req.setStatus(decision);
        req.setAccountantNote(note);
        req.setReviewedAt(LocalDateTime.now());

        return toDto(approvalRepo.save(req), req.getFreelancer());
    }

    private ApprovalDto toDto(ApprovalRequest req, User freelancer) {
        // Freelancer'ın onaylanmış faturaların toplam indirilecek KDV'si
        BigDecimal totalDeductibleVat = BigDecimal.ZERO;
        int invoiceCount = 0;

        var invoices = invoiceRepo.findByUserId(freelancer.getId());
        invoiceCount = (int) invoices.stream().filter(i -> i.getStatus() == InvoiceStatus.APPROVED).count();
        // Detaylardan indirilecek KDV toplamı (basit hesap)
        for (var inv : invoices) {
            if (inv.getStatus() == InvoiceStatus.APPROVED && inv.getDetails() != null) {
                for (var d : inv.getDetails()) {
                    if (d.getVatAmount() != null) {
                        totalDeductibleVat = totalDeductibleVat.add(d.getVatAmount());
                    }
                }
            }
        }

        return ApprovalDto.builder()
                .id(req.getId())
                .freelancerId(freelancer.getId())
                .freelancerEmail(freelancer.getEmail())
                .accountantEmail(req.getAccountantEmail())
                .status(req.getStatus())
                .accountantNote(req.getAccountantNote())
                .createdAt(req.getCreatedAt())
                .reviewedAt(req.getReviewedAt())
                .invoiceCount(invoiceCount)
                .totalDeductibleVat(totalDeductibleVat)
                .build();
    }
}
