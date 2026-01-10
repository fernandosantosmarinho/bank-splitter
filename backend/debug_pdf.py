import fitz  # PyMuPDF
import sys

def extract_text(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        print(f"--- Document has {len(doc)} pages ---")
        for i, page in enumerate(doc):
            print(f"\n--- PAGE {i+1} START ---")
            text = page.get_text("text")
            # Print only first 1000 chars to avoid spam, but enough to see headers/dates
            print(text[:2000]) 
            print(f"--- PAGE {i+1} END ---")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text("/Users/fernandomarinho/workspace/BANK-SPLITTER/files/Extracto_09-01-2026_170648_.pdf")
