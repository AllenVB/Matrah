import io
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from document_processor import DocumentProcessor
from tax_classifier import classify_items, compute_invoice_summary

# Hybrid OCR: OpenCV kalite kontrolü (opsiyonel bağımlılık)
try:
    from image_quality_checker import check_image_quality
    QUALITY_CHECK_ENABLED = True
except ImportError:
    QUALITY_CHECK_ENABLED = False

app = FastAPI(title="MATRAH AI Service — Akıllı Fatura Analiz API")

processor = DocumentProcessor()


# ─── Request / Response Models ────────────────────────────────

class AnalyzeRequest(BaseModel):
    image_url: str


class InvoiceItem(BaseModel):
    name: str
    tax_rate: int                  # 1, 10 veya 20
    label: str                     # "%20 KDV — Standart"
    is_deductible: bool            # KDV indirilebilir mi?


class VatBreakdown(BaseModel):
    rate_1: dict   = {"base": 0.0, "vat": 0.0}
    rate_10: dict  = {"base": 0.0, "vat": 0.0}
    rate_20: dict  = {"base": 0.0, "vat": 0.0}
    total_deductible_vat: float = 0.0
    total_non_deductible_vat: float = 0.0
    dominant_rate: int = 20


class AnalyzeResponse(BaseModel):
    # Temel fatura alanları
    totalAmount: Optional[float] = None
    vatAmount: Optional[float] = None
    taxRate: Optional[float] = None
    vendorName: Optional[str] = None
    category: Optional[str] = "OTHER"
    # Akıllı sınıflandırma
    items: list[InvoiceItem] = []
    vat_breakdown: Optional[VatBreakdown] = None
    # Kalite bilgisi
    quality_warning: Optional[str] = None
    blur_score: Optional[float] = None


# ─── Endpoints ────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_invoice(request: AnalyzeRequest):
    """
    GCS URL (gs:// veya https://storage.googleapis.com/) veya
    yerel URL (/api/uploads/...) üzerinden fatura analizi yapar.
    Backend'ten çağrılır (dosya zaten kaydedilmiş durumda).
    """
    image_url = request.image_url

    # ── 1. Yerel dosya yolu (/api/uploads/...) ──────────────────
    if image_url.startswith("/api/uploads/"):
        filename = image_url.replace("/api/uploads/", "")
        local_path = os.path.join("/tmp", "uploads", filename)

        if not os.path.exists(local_path):
            print(f"[ERROR] Yerel dosya bulunamadı: {local_path}")
            raise HTTPException(
                status_code=404,
                detail=f"Yüklenen dosya bulunamadı: {filename}. "
                       "Backend ve ai-service aynı volume'ü paylaşmalıdır."
            )

        ext = os.path.splitext(filename)[1].lower()
        mime_type = "application/pdf" if ext == ".pdf" else "image/jpeg"
        if ext in (".png", ".gif", ".webp", ".tiff", ".tif"):
            mime_type = f"image/{ext.lstrip('.')}"

        try:
            with open(local_path, "rb") as f:
                file_bytes = f.read()
            data = processor.analyze_invoice_from_bytes(file_bytes, mime_type)
            return _build_response(data)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fatura analiz hatası: {str(e)}")

    # ── 2. GCS URL dönüşümü (https → gs://) ────────────────────
    gcs_uri = image_url
    if gcs_uri.startswith("https://storage.googleapis.com/"):
        parts = gcs_uri.replace("https://storage.googleapis.com/", "").split("/", 1)
        if len(parts) == 2:
            gcs_uri = f"gs://{parts[0]}/{parts[1]}"

    # ── 3. GCS analizi ─────────────────────────────────────────
    try:
        data = processor.analyze_invoice_from_gcs(gcs_uri)
        return _build_response(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GCS fatura analiz hatası: {str(e)}")


@app.post("/analyze-upload", response_model=AnalyzeResponse)
async def analyze_uploaded_file(file: UploadFile = File(...)):
    """
    Doğrudan dosya yüklenerek analiz yapılır.
    Önce görüntü kalitesi kontrol edilir (Hybrid OCR).
    """
    image_bytes = await file.read()

    # 1. Hybrid OCR: Kalite kontrolü
    if QUALITY_CHECK_ENABLED:
        is_ok, message, blur_score = check_image_quality(image_bytes)
        if not is_ok:
            raise HTTPException(
                status_code=400,
                detail={"error": "low_quality", "message": message, "blur_score": blur_score}
            )

    # 2. Document AI analizi
    try:
        data = processor.analyze_invoice_from_bytes(image_bytes)
        response = _build_response(data)
        if QUALITY_CHECK_ENABLED:
            _, _, blur_score = check_image_quality(image_bytes)
            response.blur_score = round(blur_score, 1)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analiz hatası: {str(e)}")


def _build_response(data: dict) -> AnalyzeResponse:
    """Ham AI verisinden zenginleştirilmiş yanıt oluşturur."""

    # Temel dönüşümler
    def to_float(val):
        if val is None:
            return None
        try:
            return float(str(val).replace(",", "."))
        except (ValueError, TypeError):
            return None

    total = to_float(data.get("total_amount"))
    vat = to_float(data.get("vat_amount"))
    tax_rate = to_float(data.get("tax_rate"))
    vendor = data.get("vendor_name")
    category = data.get("category", "OTHER")

    # Fiş üzerindeki kalem adları varsa sınıflandır
    raw_items: list[str] = data.get("items", [])
    classified = classify_items(raw_items) if raw_items else []

    # KDV dökümü
    vat_summary = None
    if classified and total:
        summary = compute_invoice_summary(classified, total)
        vat_summary = VatBreakdown(**summary)
        # En baskın KDV oranını ana taxRate olarak yaz
        if not tax_rate:
            tax_rate = float(summary["dominant_rate"])

    return AnalyzeResponse(
        totalAmount=total,
        vatAmount=vat,
        taxRate=tax_rate,
        vendorName=vendor,
        category=category,
        items=[InvoiceItem(**i) for i in classified],
        vat_breakdown=vat_summary,
        quality_warning=data.get("quality_warning"),
    )


@app.get("/health")
def health_check():
    return {
        "status": "up",
        "service": "matrah-ai-service",
        "quality_check": QUALITY_CHECK_ENABLED,
    }
