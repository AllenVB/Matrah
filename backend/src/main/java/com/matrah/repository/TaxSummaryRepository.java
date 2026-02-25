package com.matrah.repository;

import com.matrah.model.TaxSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaxSummaryRepository extends JpaRepository<TaxSummary, Long> {
    Optional<TaxSummary> findByUserIdAndMonthAndYear(Long userId, int month, int year);
}
