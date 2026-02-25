package com.matrah.repository;

import com.matrah.model.ApprovalRequest;
import com.matrah.model.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    List<ApprovalRequest> findByFreelancerIdOrderByCreatedAtDesc(Long freelancerId);

    List<ApprovalRequest> findByAccountantEmailOrderByCreatedAtDesc(String accountantEmail);

    List<ApprovalRequest> findByAccountantEmailAndStatus(String accountantEmail, ApprovalStatus status);
}
