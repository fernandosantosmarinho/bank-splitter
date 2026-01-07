import os
import json
from docling.document_converter import DocumentConverter
from openai import OpenAI
from dotenv import load_dotenv

# Load API Key
load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("❌ ERROR: OPENAI_API_KEY not found in .env file.")
    exit()

client = OpenAI(api_key=OPENAI_API_KEY)

def pdf_to_markdown(pdf_path):
    """
    Uses Docling to convert visual PDF into structured Markdown.
    """
    print(f"📄 1. Reading PDF with Docling: {pdf_path}...")
    try:
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        # Export to Markdown (preserves table structure better than raw text)
        return result.document.export_to_markdown()
    except Exception as e:
        print(f"❌ Error converting PDF: {e}")
        return None

def analyze_and_split(markdown_text):
    """
    Sends the Markdown to GPT-4o to identify and split multiple accounts.
    """
    print("🧠 2. Sending to GPT-4o-mini to analyze account structure...")
    
    prompt = """
    You are an expert in Bank Data Extraction and Accounting.
    Analyze the text of this bank statement (provided in Markdown format).
    
    YOUR GOAL: Identify if there are multiple bank accounts or credit cards within this single document.
    
    RULES:
    1. Look for patterns like "Account Number: XXXX", "Checking Account", "Savings Account", "Credit Card Ending in...".
    2. If there is more than one account, separate the transactions for each one.
    3. Extract a JSON list where each item is a distinct account found.
    4. Format dates as YYYY-MM-DD and amounts as floats (negative for debits/expenses).
    
    REQUIRED JSON OUTPUT FORMAT:
    {
        "has_multiple_accounts": true/false,
        "accounts_found_count": 2,
        "accounts": [
            {
                "account_name": "Chase Checking",
                "account_number_last4": "1234",
                "currency": "USD",
                "transactions": [
                    {"date": "2024-01-01", "description": "Deposit", "amount": 1000.00, "type": "credit"},
                    {"date": "2024-01-02", "description": "Walmart Store", "amount": -50.00, "type": "debit"}
                ]
            }
        ]
    }
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a precise data extractor API using JSON mode."},
                {"role": "user", "content": f"INSTRUCTIONS:\n{prompt}\n\nDOCUMENT CONTENT:\n{markdown_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        return None

# --- TEST EXECUTION ---
if __name__ == "__main__":
    # Nome do arquivo PDF que você deve colocar na pasta 'backend' para testar
    target_pdf = "sample_statement.pdf" 
    
    if not os.path.exists(target_pdf):
        print(f"⚠️  WARNING: File '{target_pdf}' not found in the current directory.")
        print("   -> Please download a sample bank statement and rename it to 'sample_statement.pdf' to test.")
    else:
        # 1. Convert PDF to Markdown
        md_content = pdf_to_markdown(target_pdf)
        
        if md_content:
            # 2. Extract Data
            structured_data = analyze_and_split(md_content)
            
            if structured_data:
                # 3. Show Result
                print("\n✅ EXTRACTION RESULT:")
                print(json.dumps(structured_data, indent=2))
                
                # Validation Logic
                count = len(structured_data.get("accounts", []))
                if count > 1:
                    print(f"\n🎉 SUCCESS! Detected {count} different accounts in this PDF.")
                    print("   -> The 'Splitter' logic is working.")
                else:
                    print(f"\nℹ️  Only {count} account detected. (Try with a multi-account PDF to see the magic).")