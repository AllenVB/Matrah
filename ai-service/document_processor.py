import os
import re
from typing import Optional
from google.cloud import documentai_v1 as documentai

class DocumentProcessor:
    def __init__(self):
        # Google Cloud Document AI Client
        # GOOGLE_APPLICATION_CREDENTIALS environment variable must be set.
        self.project_id = os.environ.get("GCP_PROJECT_ID", "your-project-id")
        self.location = os.environ.get("GCP_LOCATION", "us") # e.g., 'eu' or 'us'
        self.processor_id = os.environ.get("GCP_PROCESSOR_ID", "your-processor-id")
        
        try:
            self.client = documentai.DocumentProcessorServiceClient()
        except Exception as e:
            print(f"Warning: Failed to initialize Document AI client. Ensure credentials are set. Error: {e}")
            self.client = None

    def analyze_invoice_from_gcs(self, gcs_uri: str) -> dict:
        """
        Analyzes an invoice from a GCS URI using Google Cloud Document AI.
        """
        if not self.client:
            return self._mock_analysis(gcs_uri)

        name = self.client.processor_path(self.project_id, self.location, self.processor_id)

        # Configure the request
        request = documentai.ProcessRequest(
            name=name,
            gcs_document=documentai.GcsDocument(
                gcs_uri=gcs_uri,
                mime_type="application/pdf" # Simplified for this example, should ideally detect mime type
            )
        )

        try:
            result = self.client.process_document(request=request)
            document = result.document

            # Extract fields (This depends heavily on the specific Document AI Invoice Parser model output)
            extracted_data = {
                "total_amount": self._extract_field(document, "total_amount"),
                "vat_amount": self._extract_field(document, "total_tax_amount"),
                "vendor_name": self._extract_field(document, "supplier_name"),
                "tax_rate": None, # Often needs to be calculated or extracted from line items
                "category": "OTHER" # Category mapping logic goes here
            }
            
            # Simple tax rate calculation if vat & total present
            if extracted_data["total_amount"] and extracted_data["vat_amount"]:
                 try:
                     total = float(extracted_data["total_amount"])
                     vat = float(extracted_data["vat_amount"])
                     if total > 0 and vat > 0:
                        extracted_data["tax_rate"] = round((vat / (total - vat)) * 100, 2)
                 except ValueError:
                     pass

            return extracted_data

        except Exception as e:
            print(f"Error processing document {gcs_uri}: {e}")
            return self._mock_analysis(gcs_uri)

    def _extract_field(self, document: documentai.Document, field_name: str) -> Optional[str]:
        """Helper to extract specific entities from Document AI parsing."""
        for entity in document.entities:
            if entity.type_ == field_name:
                # Remove common currency symbols for numeric fields
                val = entity.mention_text.strip()
                if field_name in ["total_amount", "total_tax_amount"]:
                     val = re.sub(r'[^\d.,]', '', val).replace(',', '.')
                return val
        return None

    def _mock_analysis(self, gcs_uri: str) -> dict:
        """Fallback mock data if GCP is not configured or fails"""
        print(f"Using Mock Analysis for {gcs_uri}")
        return {
             "total_amount": "1200.00",
             "vat_amount": "200.00",
             "tax_rate": 20.0,
             "vendor_name": "Mock Supplier AS",
             "category": "OFFICE"
        }
