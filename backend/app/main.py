from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import uvicorn
import os

# 1. Carrega variáveis de ambiente
load_dotenv()

# 2. Importa o serviço de extração com suporte a Streaming
from app.services.extractor import process_pdf_stream

# 3. Inicializa o App
app = FastAPI(
    title="BankSplitter API",
    description="High-performance Streaming API for financial document extraction",
    version="2.0.0"
)

# 4. Configuração de CORS (Segurança para o navegador permitir a conexão)
# Adicione aqui suas URLs oficiais
origins = [
    "http://localhost:3000",
    "https://bank-splitter.vercel.app",
    "https://bank-splitter-mvp.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
        "engine": "Docling + o4-mini",
        "mode": "Parallel Streaming"
    }

@app.post("/api/v1/extract")
async def extract_data(file: UploadFile = File(...)):
    """
    Endpoint de Alta Performance: Recebe o arquivo e retorna um 
    Stream de dados (Server-Sent Events) para processamento em tempo real.
    """
    
    # Validação de Extensão
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    filename = file.filename.lower()
    
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail="File type not supported. Please use PDF or Images."
        )

    print(f"📥 Starting stream for: {file.filename}")

    # Retorna o gerador process_pdf_stream como um StreamingResponse
    # Isso permite que o frontend receba os arquivos um por um
    return StreamingResponse(
        process_pdf_stream(file),
        media_type="text/event-stream"
    )

# --- INICIALIZAÇÃO ---
if __name__ == "__main__":
    # Pega a porta injetada pelo servidor (Hugging Face usa 7860, Railway usa PORT)
    port = int(os.environ.get("PORT", 8000))
    
    # Roda o servidor Uvicorn
    # Em produção, o reload deve ser False para maior estabilidade
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)