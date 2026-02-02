# 🌐 Guia Completo: Configuração DNS - banktobook.com

## 📋 Estrutura Atual vs. Desejada

### **Estrutura Atual**
```
Frontend:  https://bank-splitter.vercel.app
Backend:   http://65.20.103.196:8080/api/v1
Extractor: Hugging Face
```

### **Estrutura Desejada**
```
Frontend:  https://banktobook.com
           https://www.banktobook.com
Backend:   https://api.banktobook.com/v1
Extractor: Hugging Face (sem mudanças)
```

---

## 🎯 PARTE 1: Configurar DNS na Namecheap

### **Passo 1: Acessar Advanced DNS**
1. No dashboard da Namecheap, clique em **"Advanced DNS"** (aba superior)
2. Você verá a seção "HOST RECORDS"

### **Passo 2: Adicionar os Registros DNS**

Adicione os seguintes registros DNS (clique em "ADD NEW RECORD"):

#### **A) Frontend - Vercel**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `CNAME` | `www` | `cname.vercel-dns.com.` | Automatic |
| `A` | `@` | `76.76.21.21` | Automatic |

> **Nota**: O IP `76.76.21.21` é um dos IPs da Vercel. Vamos configurar o domínio custom na Vercel depois.

#### **B) Backend API - Sua VM**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `A` | `api` | `65.20.103.196` | Automatic |

#### **C) Email (Opcional, mas recomendado)**

Se você quiser usar email com este domínio no futuro:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `MX` | `@` | `mail.banktobook.com` | Automatic |

### **Passo 3: Remover Registros Conflitantes**

⚠️ **IMPORTANTE**: Remova qualquer registro de "URL Redirect" ou "CNAME" que aponte para `www.banktobook.com` que já exista.

### **Resultado Final dos Registros DNS**

Sua tabela de DNS deve ficar assim:

```
Type    Host    Value                       TTL
────────────────────────────────────────────────────
A       @       76.76.21.21                 Automatic
CNAME   www     cname.vercel-dns.com.       Automatic
A       api     65.20.103.196               Automatic
```

---

## 🚀 PARTE 2: Configurar Vercel (Frontend)

### **Passo 1: Adicionar Domínio Custom na Vercel**

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `bank-splitter`
3. Vá em **Settings** → **Domains**
4. Clique em **"Add Domain"**
5. Adicione os seguintes domínios (um de cada vez):
   - `banktobook.com`
   - `www.banktobook.com`

### **Passo 2: Verificar DNS na Vercel**

A Vercel vai verificar automaticamente os registros DNS. Pode levar alguns minutos.

Status esperado:
- ✅ `banktobook.com` - Valid Configuration
- ✅ `www.banktobook.com` - Valid Configuration

### **Passo 3: Configurar Redirect**

Na Vercel, configure para que `www.banktobook.com` redirecione para `banktobook.com`:

1. Em **Settings** → **Domains**
2. Clique nos 3 pontinhos ao lado de `www.banktobook.com`
3. Selecione **"Redirect to banktobook.com"**

### **Passo 4: Aguardar SSL**

A Vercel vai provisionar automaticamente um certificado SSL (HTTPS). Isso leva de 1-5 minutos.

---

## 🔧 PARTE 3: Configurar Backend API (VM)

### **Opção A: Usar Nginx como Reverse Proxy (RECOMENDADO)**

Esta é a melhor opção porque:
- ✅ Adiciona HTTPS (SSL/TLS)
- ✅ Melhora segurança
- ✅ Permite cache
- ✅ URL limpa: `https://api.banktobook.com/v1`

#### **Passo 1: Instalar Nginx na VM**

```bash
# Conectar na VM
ssh root@65.20.103.196

# Instalar Nginx
sudo apt update
sudo apt install nginx -y

# Verificar se está rodando
sudo systemctl status nginx
```

#### **Passo 2: Configurar Nginx**

Crie o arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/banktobook-api
```

Cole esta configuração:

```nginx
server {
    listen 80;
    server_name api.banktobook.com;

    # Redirecionar HTTP para HTTPS (depois de configurar SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

#### **Passo 3: Ativar a Configuração**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/banktobook-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### **Passo 4: Instalar SSL com Let's Encrypt (HTTPS)**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d api.banktobook.com

# Seguir as instruções:
# - Digite seu email
# - Aceite os termos
# - Escolha "2" para redirecionar HTTP para HTTPS
```

O Certbot vai automaticamente:
- ✅ Gerar certificado SSL
- ✅ Configurar HTTPS
- ✅ Configurar renovação automática

#### **Passo 5: Verificar Firewall**

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

### **Opção B: Apenas Mudar a Porta (NÃO RECOMENDADO)**

Se você não quiser usar Nginx, pode apenas:

1. Mudar sua API para rodar na porta 80
2. Mas você **NÃO terá HTTPS** (inseguro!)
3. Browsers modernos bloqueiam chamadas HTTP de sites HTTPS

⚠️ **NÃO USE ESTA OPÇÃO** - Sua API ficará insegura!

---

## 🔐 PARTE 4: Atualizar Configurações do Frontend

### **Passo 1: Atualizar Variáveis de Ambiente na Vercel**

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `bank-splitter`
3. Vá em **Settings** → **Environment Variables**
4. Atualize/adicione:

```env
NEXT_PUBLIC_API_URL=https://api.banktobook.com/v1
```

### **Passo 2: Atualizar Código (se necessário)**

Verifique se há URLs hardcoded no código:

```bash
cd /Users/fernandomarinho/workspace/BANK-SPLITTER/frontend
grep -r "65.20.103.196" .
grep -r "bank-splitter" .
```

Se encontrar, substitua por:
- `https://api.banktobook.com/v1`
- `banktobook.com`

### **Passo 3: Fazer Deploy**

```bash
git add -A
git commit -m "chore: update API URL to api.banktobook.com"
git push origin main
```

A Vercel vai fazer deploy automaticamente.

---

## 🔑 PARTE 5: Atualizar Clerk (Autenticação)

### **Passo 1: Atualizar URLs no Clerk Dashboard**

1. Acesse: https://dashboard.clerk.com
2. Selecione seu projeto
3. Vá em **Paths** ou **URLs**
4. Atualize:
   - **Home URL**: `https://banktobook.com`
   - **Sign-in URL**: `https://banktobook.com/sign-in`
   - **Sign-up URL**: `https://banktobook.com/sign-up`
   - **After sign-in**: `https://banktobook.com/dashboard`
   - **After sign-up**: `https://banktobook.com/dashboard`

### **Passo 2: Adicionar Domínio Permitido**

Em **Allowed Origins** ou **CORS**, adicione:
- `https://banktobook.com`
- `https://www.banktobook.com`

---

## 💳 PARTE 6: Atualizar Stripe

### **Passo 1: Atualizar Webhooks**

1. Acesse: https://dashboard.stripe.com/webhooks
2. Edite o webhook existente
3. Atualize a URL para:
   ```
   https://banktobook.com/api/stripe/webhook
   ```

### **Passo 2: Atualizar URLs de Retorno**

No código do Stripe (já deve estar usando variáveis de ambiente):

```typescript
// Verificar em: frontend/lib/stripe-server.ts
success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`
```

Adicione na Vercel:
```env
NEXT_PUBLIC_APP_URL=https://banktobook.com
```

---

## ✅ PARTE 7: Checklist de Verificação

### **DNS (Namecheap)**
- [ ] Registro A para `@` → `76.76.21.21`
- [ ] Registro CNAME para `www` → `cname.vercel-dns.com.`
- [ ] Registro A para `api` → `65.20.103.196`
- [ ] Aguardar propagação DNS (pode levar até 48h, geralmente 1-2h)

### **Vercel**
- [ ] Domínio `banktobook.com` adicionado
- [ ] Domínio `www.banktobook.com` adicionado
- [ ] SSL ativo (cadeado verde)
- [ ] Redirect de www → apex configurado
- [ ] Variável `NEXT_PUBLIC_API_URL` atualizada
- [ ] Variável `NEXT_PUBLIC_APP_URL` atualizada
- [ ] Deploy realizado

### **Backend (VM)**
- [ ] Nginx instalado
- [ ] Configuração do reverse proxy criada
- [ ] SSL com Let's Encrypt instalado
- [ ] Firewall configurado (portas 80, 443)
- [ ] API respondendo em `https://api.banktobook.com/v1`

### **Integrações**
- [ ] Clerk URLs atualizadas
- [ ] Stripe webhook URL atualizada
- [ ] Stripe success/cancel URLs atualizadas

### **Testes**
- [ ] `https://banktobook.com` carrega corretamente
- [ ] `https://www.banktobook.com` redireciona para `https://banktobook.com`
- [ ] Login funciona
- [ ] Upload de arquivo funciona
- [ ] API responde: `curl https://api.banktobook.com/v1/health`
- [ ] Checkout Stripe funciona
- [ ] Webhook Stripe funciona

---

## 🚨 Troubleshooting

### **Problema: DNS não propaga**
```bash
# Verificar DNS
nslookup banktobook.com
nslookup api.banktobook.com

# Verificar de diferentes servidores
dig @8.8.8.8 banktobook.com
dig @1.1.1.1 api.banktobook.com
```

### **Problema: Vercel não valida domínio**
- Aguarde 5-10 minutos
- Verifique se os registros DNS estão corretos
- Tente remover e adicionar o domínio novamente

### **Problema: SSL não funciona na API**
```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --dry-run

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

### **Problema: CORS errors**
Adicione no Nginx:
```nginx
add_header 'Access-Control-Allow-Origin' 'https://banktobook.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
```

---

## 📊 Tempo Estimado

| Tarefa | Tempo |
|--------|-------|
| Configurar DNS | 10 min |
| Configurar Vercel | 5 min |
| Instalar Nginx + SSL | 15 min |
| Atualizar Clerk | 5 min |
| Atualizar Stripe | 5 min |
| Testes | 10 min |
| **TOTAL** | **~50 min** |

**Propagação DNS**: 1-48 horas (geralmente 1-2h)

---

## 🎯 Ordem de Execução Recomendada

1. ✅ **DNS na Namecheap** (fazer PRIMEIRO)
2. ⏳ **Aguardar 30 min** (tomar um café ☕)
3. ✅ **Configurar Vercel**
4. ✅ **Configurar Nginx + SSL na VM**
5. ✅ **Atualizar variáveis de ambiente**
6. ✅ **Atualizar Clerk**
7. ✅ **Atualizar Stripe**
8. ✅ **Fazer deploy**
9. ✅ **Testar tudo**

---

## 📞 Precisa de Ajuda?

Se encontrar algum problema, me avise e eu te ajudo a debugar! 🚀

**Boa sorte com o deploy!** 🎉
