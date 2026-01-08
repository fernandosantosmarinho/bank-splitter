from datetime import datetime
import hashlib

def generate_fitid(date, amount, desc):
    """Gera um ID único para a transação para evitar duplicatas no QuickBooks."""
    raw = f"{date}{amount}{desc}"
    return hashlib.md5(raw.encode()).hexdigest()

def format_date_qbo(date_str):
    """Converte YYYY-MM-DD para YYYYMMDD000000 (Formato OFX/QBO)."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d000000")
    except:
        return date_str.replace("-", "") + "000000"

def generate_qbo_content(account_data):
    """
    Gera o conteúdo de texto do arquivo .qbo (OFX format).
    """
    # 1. Cabeçalhos obrigatórios (não mexer, são padrão do Intuit)
    header = """OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
"""

    # Define o tipo de conta (Checking, Savings, CreditLine)
    # Tenta adivinhar pelo nome, default é CHECKING
    acct_type = "CHECKING"
    name_lower = account_data.get("account_name", "").lower()
    if "credit" in name_lower or "card" in name_lower:
        acct_type = "CREDITLINE"
    elif "saving" in name_lower:
        acct_type = "SAVINGS"

    # ID do Banco (3000 é o ID genérico do Wells Fargo que funciona em todos os QBs)
    bank_id = "3000"
    acct_id = account_data.get("account_number_partial", "123456")
    
    # Data atual
    now_str = datetime.now().strftime("%Y%m%d000000")

    # 2. Corpo do OFX
    body = f"""<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>{now_str}
<LANGUAGE>ENG
<INTU.BID>{bank_id}
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>{account_data.get("currency", "USD")}
<BANKACCTFROM>
<BANKID>{bank_id}
<ACCTID>{acct_id}
<ACCTTYPE>{acct_type}
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>{now_str}
<DTEND>{now_str}
"""

    # 3. Transações
    transactions_str = ""
    for tx in account_data.get("transactions", []):
        amount = tx.get("amount", 0)
        # QBO usa trntype: DEBIT, CREDIT, etc.
        # Simplificação: Se amount < 0 é DEBIT, > 0 é CREDIT
        trn_type = "DEBIT" if float(amount) < 0 else "CREDIT"
        
        # Formatar data
        dt_posted = format_date_qbo(tx.get("date", ""))
        
        # Gerar FITID único
        fitid = generate_fitid(tx.get("date"), amount, tx.get("description"))
        
        transactions_str += f"""<STMTTRN>
<TRNTYPE>{trn_type}
<DTPOSTED>{dt_posted}
<TRNAMT>{amount}
<FITID>{fitid}
<NAME>{tx.get("description", "Unknown").replace("&", "&amp;")}
</STMTTRN>
"""

    footer = """</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>0.00
<DTASOF>{now_str}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>"""

    # Corrige formatação para o footer
    # Se for Credit Card, a tag muda levemente (CREDITCARDMSGSRSV1), 
    # mas o formato BANKMSGSRSV1 geralmente é aceito para importação genérica.
    # Para manter simples e funcional no MVP, usamos estrutura bancária padrão.
    
    return header + body + transactions_str + footer.format(now_str=now_str)