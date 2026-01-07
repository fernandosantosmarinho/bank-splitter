from fpdf import FPDF
import random
from datetime import datetime, timedelta

class BankPDF(FPDF):
    def header(self):
        # Logo / Header
        self.set_font('Arial', 'B', 16)
        self.set_text_color(0, 51, 102) # Navy Blue
        self.cell(0, 10, 'GOLIATH NATIONAL BANK', 0, 1, 'L')
        self.set_font('Arial', '', 10)
        self.cell(0, 5, 'P.O. Box 44992, Wilmington, DE', 0, 1, 'L')
        self.ln(10)

    def footer(self):
        # Footer with page numbers and noise
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()} - Account Confidential - GNB N.A. Member FDIC', 0, 0, 'C')

def generate_transactions(count, start_balance):
    txs = []
    balance = start_balance
    vendors = [
        "UBER TRIP", "AMZN Mktp", "STARBUCKS STORE", "TARGET", "SHELL OIL", 
        "PAYPAL TRANSFER", "SPOTIFY PREMIUM", "WALMART SUPERCENTER", "APPLE STORE",
        "DIRECT DEPOSIT PAYROLL", "ZELLE PAYMENT TO JOHN", "NETFLIX.COM"
    ]
    
    current_date = datetime(2024, 1, 1)
    
    for _ in range(count):
        desc = random.choice(vendors)
        is_credit = "DEPOSIT" in desc or "PAYROLL" in desc
        
        if is_credit:
            amount = round(random.uniform(1000, 5000), 2)
            balance += amount
            amount_str = f"{amount:,.2f}"
            type_tx = "CR"
        else:
            amount = round(random.uniform(10, 200), 2)
            balance -= amount
            amount_str = f"-{amount:,.2f}"
            type_tx = "" # Standard debit usually has no marker or a minus
            
        txs.append({
            "date": current_date.strftime("%m/%d/%y"),
            "desc": desc + f" ID:{random.randint(10000,99999)}",
            "amount": amount_str,
            "balance": f"{balance:,.2f}"
        })
        
        # Advance date randomly
        current_date += timedelta(days=random.randint(0, 3))
        
    return txs

def create_complex_pdf():
    pdf = BankPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # --- SECTION 1: CHECKING ACCOUNT ---
    pdf.set_fill_color(220, 220, 220)
    pdf.set_font('Arial', 'B', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, "ACCOUNT SUMMARY - BUSINESS CHECKING (...8842)", 1, 1, 'L', fill=True)
    
    # Summary Box (Noise)
    pdf.set_font('Arial', '', 10)
    pdf.cell(100, 8, "Beginning Balance: $45,200.00", 0, 1)
    pdf.cell(100, 8, "Total Deposits: $12,000.00", 0, 1)
    pdf.cell(100, 8, "Total Withdrawals: $4,350.20", 0, 1)
    pdf.cell(100, 8, "Ending Balance: $52,849.80", 0, 1)
    pdf.ln(5)

    # Marketing Noise
    pdf.set_font('Arial', 'I', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(0, 5, "NEWS FOR YOU: Updates to your wire transfer agreement are coming effectively Feb 1st. Please visit gnb.com/updates for full legal disclosure.")
    pdf.ln(5)

    # Checking Transactions Table
    pdf.set_text_color(0, 0, 0)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(30, 8, "Date", 1)
    pdf.cell(90, 8, "Description", 1)
    pdf.cell(35, 8, "Amount", 1)
    pdf.cell(35, 8, "Balance", 1)
    pdf.ln()

    pdf.set_font('Arial', '', 10)
    transactions_checking = generate_transactions(15, 45200.00)
    
    for tx in transactions_checking:
        pdf.cell(30, 8, tx['date'], 1)
        pdf.cell(90, 8, tx['desc'], 1)
        pdf.cell(35, 8, tx['amount'], 1, 0, 'R')
        pdf.cell(35, 8, tx['balance'], 1, 0, 'R')
        pdf.ln()

    pdf.ln(20)

    # --- SECTION 2: CREDIT CARD ACCOUNT (Same PDF, different structure) ---
    pdf.set_font('Arial', 'B', 12)
    pdf.set_fill_color(220, 220, 220)
    pdf.cell(0, 10, "ACTIVITY SUMMARY - PLATINUM REWARDS CARD (...4021)", 1, 1, 'L', fill=True)
    
    # Summary Box
    pdf.set_font('Arial', '', 10)
    pdf.cell(100, 8, "Previous Balance: $1,200.50", 0, 1)
    pdf.cell(100, 8, "Payments: -$1,200.50", 0, 1)
    pdf.cell(100, 8, "New Charges: +$850.00", 0, 1)
    pdf.ln(5)

    # Credit Card Transactions Table
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(30, 8, "Post Date", 1)
    pdf.cell(90, 8, "Merchant Name", 1)
    pdf.cell(35, 8, "Amount", 1)
    pdf.cell(35, 8, "Ref Number", 1) # Extra column typical in CC statements
    pdf.ln()

    pdf.set_font('Arial', '', 10)
    transactions_cc = generate_transactions(10, 0)
    
    for tx in transactions_cc:
        pdf.cell(30, 8, tx['date'], 1)
        pdf.cell(90, 8, tx['desc'], 1)
        # Invert logic for CC (Positive is charge)
        amount_val = tx['amount'].replace("-", "")
        pdf.cell(35, 8, f"${amount_val}", 1, 0, 'R')
        pdf.cell(35, 8, str(random.randint(1000000, 9999999)), 1, 0, 'R')
        pdf.ln()

    output_filename = "complex_multi_account.pdf"
    pdf.output(output_filename)
    print(f"✅ Generated complex PDF: {output_filename}")

if __name__ == "__main__":
    create_complex_pdf()