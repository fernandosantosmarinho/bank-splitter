from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import uvicorn
import os

# 1. Carrega variáveis de ambiente
load_dotenv()

# 2. Importa o serviço de extração
from app.services.extractor import process_pdf_stream

# 3. Inicializa o App
app = FastAPI(
    title="BankSplitter API",
    description="High-performance Streaming API for financial document extraction",
    version="2.0.0"
)

# 4. Configuração de CORS (LIBERADO TOTAL PARA MVP)
# Isso evita dores de cabeça com Headers entre Vercel e Hugging Face
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Aceita qualquer origem
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROTAS ---

@app.get("/")
def health_check():
    """Verifica se o servidor está online."""
    return {
        "status": "online", 
        "service": "BankSplitter Engine", 
        "engine": "Docling + GPT-4o",
        "mode": "Streaming"
    }

@app.post("/api/v1/extract")
async def extract_data(file: UploadFile = File(...)):
    """
    Endpoint de Alta Performance: Recebe o arquivo e retorna um 
    Stream de dados (Server-Sent Events).
    """
    
    # DEBUG: Vamos ver no log o que está chegando
    print(f"📥 REQUEST RECEIVED:")
    print(f" - Filename: {file.filename}")
    print(f" - Content-Type: {file.content_type}")

    # Validação de Extensão (Mais robusta)
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    filename = file.filename.lower() if file.filename else ""
    
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        print("❌ Arquivo rejeitado pela validação de extensão.")
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Received: {filename}"
        )

    print(f"✅ Starting stream processing...")

    # Retorna o gerador como StreamingResponse
    return StreamingResponse(
        process_pdf_stream(file),
        media_type="text/event-stream"
    )

# --- INICIALIZAÇÃO ---
if __name__ == "__main__":
    # Pega a porta injetada pelo servidor (Hugging Face usa 7860)
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)