package com.matrah.service;

import com.matrah.dto.AIAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Türk e-Fatura (UBL 2.1) XML formatını parse eder.
 * GİB formatına uygun alanları okur.
 *
 * Desteklenen formatlar:
 * - e-Fatura (GİB/UBL 2.1):
 * urn:oasis:names:specification:ubl:schema:xsd:Invoice-2
 * - e-Arşiv fatura XML çıktısı
 */
@Slf4j
@Service
public class EInvoiceXmlParser {

    // UBL 2.1 namespace'leri
    private static final String NS_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    private static final String NS_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";

    /**
     * XML byte array'ini AI analiz sonucuna dönüştürür.
     *
     * @param xmlBytes e-Fatura XML içeriği
     * @return AIAnalysisResponse (Document AI ile aynı format)
     */
    public AIAnalysisResponse parse(byte[] xmlBytes) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            // XXE güvenlik önlemi
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

            Document doc = factory.newDocumentBuilder()
                    .parse(new ByteArrayInputStream(xmlBytes));
            doc.getDocumentElement().normalize();

            AIAnalysisResponse resp = new AIAnalysisResponse();

            // ── Satıcı adı (Supplier)
            resp.setVendorName(extractSupplierName(doc));

            // ── Toplam tutar
            resp.setTotalAmount(extractDecimal(doc, "PayableAmount"));
            if (resp.getTotalAmount() == null) {
                resp.setTotalAmount(extractDecimal(doc, "TaxInclusiveAmount"));
            }

            // ── KDV tutarı
            resp.setVatAmount(extractTaxAmount(doc));

            // ── KDV oranı
            resp.setTaxRate(extractTaxRate(doc));

            // ── KDV oranı yoksa matematiksel olarak hesapla
            if (resp.getTaxRate() == null && resp.getTotalAmount() != null && resp.getVatAmount() != null) {
                BigDecimal total = resp.getTotalAmount();
                BigDecimal vat = resp.getVatAmount();
                if (total.compareTo(vat) > 0 && vat.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal net = total.subtract(vat);
                    BigDecimal rate = vat.divide(net, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                    // En yakın standart orana yuvarla
                    int computed = rate.intValue();
                    int[] standards = { 1, 10, 20 };
                    int closest = 20;
                    int minDiff = Integer.MAX_VALUE;
                    for (int s : standards) {
                        int diff = Math.abs(computed - s);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = s;
                        }
                    }
                    resp.setTaxRate(BigDecimal.valueOf(closest));
                    log.debug("KDV oranı XML'den hesaplandı: {}", closest);
                }
            }

            // ── Kategori: XML'den çıkarılamaz, varsayılan OTHER
            resp.setCategory("OTHER");

            log.info("e-Fatura XML başarıyla parse edildi — satıcı: {}, toplam: {}",
                    resp.getVendorName(), resp.getTotalAmount());
            return resp;

        } catch (Exception e) {
            log.error("e-Fatura XML parse hatası: {}", e.getMessage());
            return null;
        }
    }

    // ─── Private Helpers ─────────────────────────────────────

    private String extractSupplierName(Document doc) {
        // UBL: /Invoice/AccountingSupplierParty/Party/PartyLegalEntity/RegistrationName
        try {
            NodeList nodes = doc.getElementsByTagNameNS(NS_CBC, "RegistrationName");
            if (nodes.getLength() > 0)
                return nodes.item(0).getTextContent().trim();

            nodes = doc.getElementsByTagNameNS(NS_CBC, "Name");
            if (nodes.getLength() > 0)
                return nodes.item(0).getTextContent().trim();
        } catch (Exception e) {
            log.warn("Satıcı adı okunamadı: {}", e.getMessage());
        }
        return null;
    }

    private BigDecimal extractDecimal(Document doc, String tagName) {
        try {
            NodeList nodes = doc.getElementsByTagNameNS(NS_CBC, tagName);
            if (nodes.getLength() > 0) {
                String text = nodes.item(0).getTextContent().trim().replace(",", ".");
                return new BigDecimal(text);
            }
        } catch (Exception e) {
            log.warn("{} okunamadı: {}", tagName, e.getMessage());
        }
        return null;
    }

    private BigDecimal extractTaxAmount(Document doc) {
        try {
            // /Invoice/TaxTotal/TaxAmount
            NodeList taxTotals = doc.getElementsByTagNameNS(NS_CAC, "TaxTotal");
            if (taxTotals.getLength() > 0) {
                Element taxTotal = (Element) taxTotals.item(0);
                NodeList amounts = taxTotal.getElementsByTagNameNS(NS_CBC, "TaxAmount");
                if (amounts.getLength() > 0) {
                    return new BigDecimal(amounts.item(0).getTextContent().trim().replace(",", "."));
                }
            }
        } catch (Exception e) {
            log.warn("KDV tutarı okunamadı: {}", e.getMessage());
        }
        return null;
    }

    private BigDecimal extractTaxRate(Document doc) {
        try {
            // /Invoice/TaxTotal/TaxSubtotal/TaxCategory/Percent
            NodeList percents = doc.getElementsByTagNameNS(NS_CBC, "Percent");
            if (percents.getLength() > 0) {
                return new BigDecimal(percents.item(0).getTextContent().trim().replace(",", "."));
            }
        } catch (Exception e) {
            log.warn("KDV oranı okunamadı: {}", e.getMessage());
        }
        return null;
    }
}
