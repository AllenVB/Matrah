package com.matrah.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Fatura analizi veya onay durumu değiştiğinde WebSocket üzerinden
 * ilgili kullanıcıya bildirim gönderir.
 *
 * Frontend: /topic/invoices/{userId} kanalını dinler.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Fatura analizi tamamlandığında bildirim gönder.
     * 
     * @param userId    Kullanıcı ID
     * @param invoiceId Güncellenen fatura ID
     * @param status    "APPROVED" | "REJECTED"
     */
    public void notifyInvoiceUpdated(Long userId, Long invoiceId, String status) {
        String destination = "/topic/invoices/" + userId;
        Map<String, Object> payload = Map.of(
                "type", "INVOICE_UPDATED",
                "invoiceId", invoiceId,
                "status", status);
        messagingTemplate.convertAndSend(destination, payload);
    }

    /**
     * Muhasebeci onay kararı verdiğinde freelancer'a bildirim.
     * 
     * @param freelancerId
     * @param approvalId
     * @param status       "APPROVED" | "REJECTED" | "REVISION_NEEDED"
     */
    public void notifyApprovalDecision(Long freelancerId, Long approvalId, String status) {
        String destination = "/topic/approvals/" + freelancerId;
        Map<String, Object> payload = Map.of(
                "type", "APPROVAL_UPDATED",
                "approvalId", approvalId,
                "status", status);
        messagingTemplate.convertAndSend(destination, payload);
    }
}
