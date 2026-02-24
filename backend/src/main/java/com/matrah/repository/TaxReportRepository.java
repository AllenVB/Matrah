package com.matrah.repository;

import com.matrah.model.TaxReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxReportRepository extends JpaRepository<TaxReport, Long> {
    List<TaxReport> findByUserId(Long userId);
}
