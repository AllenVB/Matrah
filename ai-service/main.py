from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from document_processor import DocumentProcessor

app = FastAPI(title="MATRAH AI Service - Document AI API")

# Initialize the GCP processor
processor = DocumentProcessor()

class AnalyzeRequest(BaseModel):
    image_url: str

class AnalyzeResponse(BaseModel):
    totalAmount: float | None = None
    vatAmount: float | None = None
    taxRate: float | None = None
    vendorName: str | None = None
    category: str | None = None

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_invoice(request: AnalyzeRequest):
    """
    Endpoint that receives a GCS URL, processes it via Document AI,
    and returns the structured data.
    """
    gcs_uri = request.image_url
    
    # Document AI requires gcs_uri format: gs://bucket-name/path/to/file
    # If standard url is passed (https://storage.googleapis.com/...), convert it:
    if gcs_uri.startswith("https://storage.googleapis.com/"):
        parts = gcs_uri.replace("https://storage.googleapis.com/", "").split("/", 1)
        if len(parts) == 2:
            gcs_uri = f"gs://{parts[0]}/{parts[1]}"
            
    try:
        data = processor.analyze_invoice_from_gcs(gcs_uri)
        
        # Convert extracted string values to floats for DTO matching
        def to_float(val):
            if val is None: return None
            try: return float(val)
            except ValueError: return None

        return AnalyzeResponse(
            totalAmount=to_float(data.get("total_amount")),
            vatAmount=to_float(data.get("vat_amount")),
            taxRate=to_float(data.get("tax_rate")),
            vendorName=data.get("vendor_name"),
            category=data.get("category", "OTHER")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze document: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "up", "service": "matrah-ai-service"}
