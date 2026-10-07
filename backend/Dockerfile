FROM python:3.12-slim

WORKDIR /app

# Sistem bağımlılıkları (curl ile sağlık kontrolü vb.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Gereksinim dosyasını kopyala ve paketleri yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodları kopyala
COPY . .

# FastAPI portu
EXPOSE 8000

# Varsayılan çalıştırma komutu (docker-compose ile override edilebilir)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
