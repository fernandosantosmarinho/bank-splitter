# Usa uma imagem Python leve
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# 1. Instala dependências de sistema necessárias para OCR/Docling (GL e GLib)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Copia os requisitos
COPY requirements.txt .

# 3. Instala as dependências Python
# O flag --no-cache-dir ajuda a não estourar o disco
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 4. Copia o restante do código
COPY . .

# 5. Comando para iniciar o servidor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]