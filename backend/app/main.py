from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn
import os

# 1. Load Environment Variables
load_dotenv()

# 2. Import Services
from app.services.extractor import process_pdf_file

# 3. Initialize App
app = FastAPI(
    title="BankSplitter API",
    description="API to split and convert bank statements into CSV",
    version="1.0.0"
)

# 4. CORS Configuration (Allows Frontend to talk to Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---

@app.get("/")
def health_check():
    """Health Check Endpoint to verify server status."""
    return {"status": "online", "service": "BankSplitter Backend"}

@app.post("/api/v1/extract")
async def extract_data(file: UploadFile = File(...)):
    """
    Main Endpoint: Receives a PDF, processes it securely, and returns structured JSON.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    print(f"📥 Receiving file: {file.filename}")
    
    result = await process_pdf_file(file)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

# --- SERVER STARTUP ---
if __name__ == "__main__":
    # Pega a porta do ambiente ou usa 8000 se for local
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)