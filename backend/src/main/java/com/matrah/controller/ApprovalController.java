package com.matrah.controller;

import com.matrah.dto.ApprovalDto;
import com.matrah.model.ApprovalStatus;
import com.matrah.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    private String email(Authentication auth) {
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "user@gmail.com";
    }

    /** Freelancer → Muhasebeciye onay isteği gönder */
    @PostMapping("/request")
    public ResponseEntity<ApprovalDto> requestApproval(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String accountantEmail = body.get("accountantEmail");
        if (accountantEmail == null || accountantEmail.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(approvalService.requestApproval(email(auth), accountantEmail));
    }

    /** Muhasebeci → Gelen bekleyen istekler */
    @GetMapping("/incoming")
    public ResponseEntity<List<ApprovalDto>> getIncoming(Authentication auth) {
        return ResponseEntity.ok(approvalService.getIncomingRequests(email(auth)));
    }

    /** Freelancer → Gönderilen istekleri izle */
    @GetMapping("/sent")
    public ResponseEntity<List<ApprovalDto>> getSent(Authentication auth) {
        return ResponseEntity.ok(approvalService.getSentRequests(email(auth)));
    }

    /** Muhasebeci → İsteği onayla / reddet / düzenleme iste */
    @PutMapping("/{id}/review")
    public ResponseEntity<ApprovalDto> review(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {

        String statusStr = body.getOrDefault("status", "APPROVED");
        String note = body.getOrDefault("note", "");

        ApprovalStatus decision;
        try {
            decision = ApprovalStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(approvalService.reviewRequest(id, decision, note, email(auth)));
    }
}
