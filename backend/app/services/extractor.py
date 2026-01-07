import os
import json
import tempfile
from docling.document_converter import DocumentConverter
from openai import OpenAI
from fastapi import UploadFile

# Initialize OpenAI Client (Make sure env is loaded in main.py)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def process_pdf_file(file: UploadFile) -> dict:
    """
    Receives an uploaded file, saves it temporarily, 
    converts to Markdown, and extracts data via LLM.
    """
    
    # 1. Save UploadFile to a temporary file (Docling needs a file path)
    # Criamos um arquivo temporário porque o Docling precisa ler do disco
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        # 2. Convert PDF to Markdown using Docling
        print(f"📄 Processing file: {file.filename}...")
        converter = DocumentConverter()
        result = converter.convert(tmp_path)
        markdown_text = result.document.export_to_markdown()
        
        # 3. Send to AI
        extracted_data = analyze_with_gpt(markdown_text)
        
        return extracted_data

    except Exception as e:
        print(f"❌ Critical Error: {e}")
        return {"error": str(e)}
    finally:
        # Cleanup: Delete the temp file to protect privacy
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
            print("🧹 Temporary file cleaned up.")

def analyze_with_gpt(markdown_text: str) -> dict:
    """
    Core Logic: Sends Markdown to GPT-4o-mini for structured extraction.
    """
    print("🧠 Sending to GPT-4o-mini...")
    
    prompt = """
    You are an expert in Bank Data Extraction.
    Analyze the provided document text (Markdown) which may contain OCR errors.
    
    GOAL: Extract the DETAILED TRANSACTION LEDGER (line-by-line purchases/deposits).
    
    CRITICAL RULES:
    1. IGNORE "Account Summary" or "Opening/Closing Balance" sections. Do NOT extract totals/summaries as transactions.
    2. Only extract individual line items (Date, Description, Amount).
    3. Look for tabular data with headers like "Date", "Description", "Amount", "Reference".
    4. Detect multiple accounts if present.
    5. Return 'transactions' as a list: {date: "YYYY-MM-DD", description: "Text", amount: float, type: "credit/debit"}.
    6. Amounts: Negative for money leaving the account (debits/purchases), Positive for deposits.
    
    REQUIRED JSON OUTPUT:
    {
        "file_summary": "Brief description (e.g. 'Chase Credit Card Statement - Jan 2019')",
        "accounts": [
            {
                "account_name": "Name or Type",
                "account_number_partial": "Last 4 digits",
                "currency": "USD",
                "transactions": [] 
            }
        ]
    }
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a Data Extraction API. Output JSON only."},
                {"role": "user", "content": f"INSTRUCTIONS:\n{prompt}\n\nDOCUMENT:\n{markdown_text[:120000]}"} 
                # Limitamos a 120k caracteres para não estourar o contexto em PDFs gigantes
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ OpenAI Error: {e}")
        return {"error": "Failed to analyze data with AI"}