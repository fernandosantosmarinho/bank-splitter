import os
import json
import base64
import tempfile
import fitz  # PyMuPDF
import asyncio
import re
from openai import OpenAI
from fastapi import UploadFile
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, AcceleratorOptions, AcceleratorDevice
from app.services.qbo_generator import generate_qbo_content

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_ID = "gpt-4o-mini" 

def generate_file_preview(file_path: str, is_pdf: bool) -> str:
    try:
        if is_pdf:
            doc = fitz.open(file_path)
            page = doc.load_page(0)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.0, 1.0))
            img_data = pix.tobytes("png")
            doc.close()
            return f"data:image/png;base64,{base64.b64encode(img_data).decode('utf-8')}"
        else:
            with open(file_path, "rb") as img_file:
                return f"data:image/jpeg;base64,{base64.b64encode(img_file.read()).decode('utf-8')}"
    except:
        return ""

def sanitize_transactions(transactions):
    """
    Limpeza determinística (Python puro) para corrigir o que a IA deixou passar.
    """
    clean_txs = []
    
    # Palavras proibidas (Linhas de saldo/transporte/sumários)
    # ATUALIZADO: Inclui termos em Inglês e Português
    BLACKLIST = [
        # Português
        "SALDO INICIAL", "SALDO FINAL", "SALDO DISPONIVEL", 
        "A TRANSPORTAR", "TRANSPORTE", "TOTAL", "CARTOES", 
        "PAGAMENTO DE VENCIMENTO", "RESUMO",
        
        # Inglês - Sumários
        "OPENING BALANCE", "CLOSING BALANCE", "BALANCE FORWARD",
        "NEW BALANCE", "PREVIOUS BALANCE", "AVAILABLE CREDIT",
        "PAYMENT DUE", "AMOUNT DUE", "TOTAL DUE",
        "PAYMENT, CREDITS", "PURCHASES", "CASH ADVANCES",
        "INTEREST CHARGED", "FEES CHARGED", "TOTAL OF PAYMENTS",
        "BEGINNING BALANCE", "ENDING BALANCE", "TOTAL DEPOSITS",
        "TOTAL WITHDRAWALS", "NET DEPOSITS", "GROSS WITHDRAWALS",
        
        # Inglês - Limites e Informações de Conta (NOVOS)
        "CREDIT LIMIT", "CASH ACCESS LINE", "PAST DUE AMOUNT",
        "BALANCE OVER THE CREDIT LIMIT", "ANNUAL PERCENTAGE RATE",
        "DAYS IN BILLING PERIOD", "AVERAGE DAILY BALANCE"
    ]

    for tx in transactions:
        desc = tx.get("description", "").upper()
        # Remove espaços extras e caracteres estranhos
        desc = desc.strip()
        
        amount = tx.get("amount", 0)
        
        # 1. Filtro de Lixo
        is_junk = False
        for bad_word in BLACKLIST:
            # Verifica se a descrição CONTÉM a palavra proibida ou É IGUAL a ela
            if bad_word in desc:
                is_junk = True
                break
        
        if is_junk:
            continue
        
        # Se o valor for 0, geralmente é lixo ou erro
        if amount == 0:
            continue

        # 2. Correção de Sinal (Enforce Debit = Negative)
        tx_type = tx.get("type", "debit").lower()
        
        if "debit" in tx_type and amount > 0:
            tx["amount"] = -amount
        
        if "credit" in tx_type and amount < 0:
            tx["amount"] = abs(amount)

        clean_txs.append(tx)
        
    return clean_txs

async def analyze_chunk_async(text_chunk: str, chunk_index: int):
    prompt = """
    ROLE: Expert Bank Data Extractor.
    TASK: Extract transaction lines from the provided text into JSON.
    
    CRITICAL RULES:
    1. EXTRACT columns: Date, Description, Amount, Type (credit/debit).
    2. DATE HANDLING (HEURISTIC):
       - The document uses "MM.DD" format (e.g., "12.30" = Dec 30th).
       - YEAR INFERENCE RULES:
         - If Month is 10, 11, or 12 -> Assume Year 2025.
         - If Month is 01, 02, or 03 -> Assume Year 2026.
       - LOGIC STICKY: If a row has no date, USE THE DATE FROM THE PREVIOUS ROW.
       - DO NOT HALLUCINATE DATES.
    3. EUROPEAN FORMAT: Handle "1.000,00" as 1000.00.
    4. IGNORE: Do not extract rows that are purely headers, footers, or page numbers.
    5. ACCOUNT:
       - Extract Account Name/Number if visible.
       - If NOT visible, return "Unknown".
    
    OUTPUT JSON STRUCTURE:
    { 
      "accounts": [ 
        { 
          "account_name": "string", 
          "account_number_partial": "string (digits only)", 
          "currency": "EUR", 
          "transactions": [
            {"date": "YYYY-MM-DD", "description": "text", "amount": 0.00, "type": "credit/debit"}
          ] 
        } 
      ] 
    }
    """
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: client.chat.completions.create(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": "You are a precise data cleaner."},
                {"role": "user", "content": f"{prompt}\n\nDATA CHUNK #{chunk_index}:\n{text_chunk}"}
            ],
            response_format={"type": "json_object"},
            temperature=0
        ))
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ Error in chunk {chunk_index}: {e}")
        return {"accounts": []}

def merge_and_clean_accounts(all_results: list) -> list:
    """
    GLOBAL DOMINANT MERGE ("GOD MODE"):
    1. Identifica a identidade 'Dominante' (Melhor Nome/Número encontrado em qualquer chunk).
    2. Força ABSOLUTAMENTE TODAS as transações de TODOS os chunks para essa única conta.
    3. Objetivo: Garantir 1 arquivo de saída com 100% das transações.
    """
    all_transactions = []
    
    # Identificadores Dominantes
    dominant_name = "Account"
    dominant_number = "0000"
    dominant_currency = "EUR"
    
    # 1. First Pass: Collect Identity & Transactions
    for chunk in all_results:
        if not chunk or "accounts" not in chunk:
            continue
            
        for acc in chunk["accounts"]:
            # Tenta melhorar a identidade dominante
            candidate_name = acc.get("account_name", "").strip()
            # Se o nome atual for melhor (maior e não genérico), pega.
            if len(candidate_name) > len(dominant_name) and candidate_name.lower() not in ["account", "main account", "unknown", "string"]:
                dominant_name = candidate_name
            
            candidate_num = str(acc.get("account_number_partial", "")).strip()
            clean_num = "".join(filter(str.isdigit, candidate_num))
            if len(clean_num) > len("".join(filter(str.isdigit, dominant_number))):
                dominant_number = candidate_num
                
            # Collect transactions
            if "transactions" in acc:
                all_transactions.extend(acc["transactions"])

    # 2. Deduplicação e Limpeza
    unique_txs = []
    seen_sigs = set()
    
    for tx in all_transactions:
        # Assinatura: Data + Valor + Descrição (primeiros 20 caracteres)
        sig = f"{tx.get('date')}|{tx.get('amount')}|{str(tx.get('description', ''))[:20]}"
        
        if sig not in seen_sigs:
            unique_txs.append(tx)
            seen_sigs.add(sig)

    if not unique_txs:
        return []

    # 3. Create THE Single Account
    final_account = {
        "account_name": dominant_name,
        "account_number_partial": dominant_number,
        "currency": dominant_currency,
        "transactions": sanitize_transactions(unique_txs)
    }

    # 4. Final Sort
    try:
        final_account["transactions"].sort(key=lambda x: x.get("date", ""))
    except:
        pass
        
    final_account["qbo_content"] = generate_qbo_content(final_account)
    
    return [final_account]

async def process_pdf_stream(file: UploadFile):
    content = await file.read()
    filename = file.filename.lower()
    is_pdf = filename.endswith(".pdf")
    
    suffix = ".pdf" if is_pdf else ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Initialize final_accounts immediately to avoid UnboundLocalError
        final_accounts = []
        
        preview_b64 = generate_file_preview(tmp_path, is_pdf)
        yield f"data: {json.dumps({'type': 'init', 'preview': preview_b64})}\n\n"

        if not is_pdf:
            # Image Logic
            yield f"data: {json.dumps({'type': 'status', 'text': 'Scanning image...'})}\n\n"
            
            # Encode image to base64
            with open(tmp_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Detailed Image Prompt with Schema
            prompt = """
            Extract all transaction details from this image.
            Return ONLY valid JSON with this structure:
            { 
              "accounts": [ 
                { 
                  "account_name": "string (Bank Name or 'Unknown')", 
                  "account_number_partial": "string (digits only)", 
                  "currency": "EUR", 
                  "transactions": [
                    {"date": "YYYY-MM-DD", "description": "text", "amount": 0.00, "type": "credit/debit"}
                  ] 
                } 
              ] 
            }
            CRITICAL RULES:
            - Infer year as 2025 unless specified.
            - If it is a CHECK/CHEQUE:
               - Description = "Cheque " + Cheque Number + " - " + Payee Name
               - Amount = The amount on the check
               - Type = 'debit' usually (money leaving account)
            - Handle European standard formats.
            """

            response = await asyncio.get_event_loop().run_in_executor(None, lambda: client.chat.completions.create(
                model=MODEL_ID,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0
            ))
            
            vision_result = json.loads(response.choices[0].message.content)
            final_accounts = merge_and_clean_accounts([vision_result])
            
        else:
            yield f"data: {json.dumps({'type': 'status', 'text': 'Reading document structure...'})}\n\n"
            
            pipeline_options = PdfPipelineOptions()
            pipeline_options.do_ocr = True
            pipeline_options.do_table_structure = True 
            pipeline_options.accelerator_options = AcceleratorOptions(num_threads=4, device=AcceleratorDevice.CPU)

            converter = DocumentConverter(
                format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
            )
            
            conv_result = await asyncio.get_event_loop().run_in_executor(None, lambda: converter.convert(tmp_path))
            full_md = conv_result.document.export_to_markdown()

            # --- PARALLEL OVERALPPING CHUNKS ---
            MAX_CHARS = 4000  # ~1 Page safe size
            OVERLAP = 500     # Overlap to catch boundary transactions
            
            text_parts = []
            start = 0
            while start < len(full_md):
                end = start + MAX_CHARS
                text_parts.append(full_md[start:end])
                start += (MAX_CHARS - OVERLAP)
            
            yield f"data: {json.dumps({'type': 'status', 'text': f'Analyzing {len(text_parts)} segments in parallel...'})}\n\n"
            
            tasks = [analyze_chunk_async(part, idx) for idx, part in enumerate(text_parts)]
            
            all_chunk_results = []
            for task in asyncio.as_completed(tasks):
                chunk_data = await task
                all_chunk_results.append(chunk_data)
                # Opcional: Yield status update (mas as_completed é rápido)
            
            yield f"data: {json.dumps({'type': 'status', 'text': 'Cleaning and merging data...'})}\n\n"
            
            # The "God Mode" Merger handles the rest
            final_accounts = merge_and_clean_accounts(all_chunk_results)

        yield f"data: {json.dumps({'type': 'chunk', 'accounts': final_accounts})}\n\n"

    except Exception as e:
        print(f"Server Error: {e}")
        # Explicit trace for debugging if needed
        import traceback
        traceback.print_exc()
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    finally:
        if os.path.exists(tmp_path): os.remove(tmp_path)