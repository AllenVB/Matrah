package com.matrah.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.matrah.model.Invoice;
import com.matrah.model.InvoiceDetail;
import com.matrah.model.User;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfGenerator {

    public byte[] generateTaxReport(User user, List<Invoice> invoices) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Başlık
            document.add(new Paragraph("MATRAH Sistesi - Vergi ve Gider Raporu").setBold().setFontSize(18));
            document.add(new Paragraph("Kullanici: " + user.getEmail()));
            document.add(new Paragraph("Vergi No: " + user.getTaxId()));
            document.add(new Paragraph("Rapor Tarihi: " + java.time.LocalDate.now()));
            document.add(new Paragraph("\n"));

            // Tablo Oluşturma
            float[] columnWidths = { 1, 3, 2, 2, 2, 2 };
            Table table = new Table(UnitValue.createPercentArray(columnWidths)).useAllAvailableWidth();

            table.addHeaderCell("No");
            table.addHeaderCell("Tedarikci");
            table.addHeaderCell("Kategori");
            table.addHeaderCell("KDV Orani (%)");
            table.addHeaderCell("KDV Tutari (TL)");
            table.addHeaderCell("Toplam (TL)");

            java.math.BigDecimal totalKdv = java.math.BigDecimal.ZERO;
            java.math.BigDecimal totalAmount = java.math.BigDecimal.ZERO;

            int count = 1;
            for (Invoice inv : invoices) {
                for (InvoiceDetail detail : inv.getDetails()) {
                    table.addCell(String.valueOf(count++));
                    table.addCell(detail.getVendorName() != null ? detail.getVendorName() : "Bilinmiyor");
                    table.addCell(detail.getCategory() != null ? detail.getCategory().name() : "-");
                    table.addCell(detail.getTaxRate() != null ? detail.getTaxRate().toString() : "0");
                    table.addCell(detail.getVatAmount() != null ? detail.getVatAmount().toString() : "0");
                    table.addCell(detail.getTotalAmount() != null ? detail.getTotalAmount().toString() : "0");

                    if (detail.getVatAmount() != null)
                        totalKdv = totalKdv.add(detail.getVatAmount());
                    if (detail.getTotalAmount() != null)
                        totalAmount = totalAmount.add(detail.getTotalAmount());
                }
            }

            document.add(table);
            document.add(new Paragraph("\nGenel Toplam KDV: " + totalKdv + " TL").setBold());
            document.add(new Paragraph("Genel Toplam Gider: " + totalAmount + " TL").setBold());

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            System.err.println("PDF uretilirken hata olustu: " + e.getMessage());
            return new byte[0];
        }
    }
}
