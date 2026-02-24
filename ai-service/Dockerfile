FROM python:3.11-slim

WORKDIR /app

# Gereksinimlerin kopyalanması ve kurulum
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodların kopyalanması
COPY . .

# Google Application Credentials vb. docker-compose ile verilmelidir.
ENV GCP_PROJECT_ID=your-project-id
ENV GCP_LOCATION=us
ENV GCP_PROCESSOR_ID=your-processor-id

EXPOSE 8000

# uvicorn ile sunucunun çalıştırılması
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
