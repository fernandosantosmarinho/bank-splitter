# Usa uma imagem Python leve
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# 1. Instala dependências de sistema
# MUDANÇA AQUI: Trocamos 'libgl1-mesa-glx' por 'libgl1'
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Copia os requisitos
COPY requirements.txt .

# 3. Instala PyTorch versão CPU (Leve/Rápido)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 4. Instala o resto das dependências
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copia o código
COPY . .

# 6. Comando para iniciar
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]