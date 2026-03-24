# Deploy KeaFlow — Hostinger

## Arquitetura de produção

```
Hostinger
├── VPS / Node.js Hosting  →  Backend (Fastify) na porta 3333
└── Hospedagem Compartilhada / Static  →  Frontend (React build)
```

---

## 1. Backend — VPS ou Node.js Hosting

### 1.1 Preparar o build local

```bash
# Na raiz do projeto
npm run build          # compila TypeScript → dist/
```

### 1.2 Arquivos para enviar ao servidor

Envie via FTP (FileZilla) ou Git:

```
keaflow/
├── dist/          ← build do TypeScript
├── node_modules/  ← ou rode npm install no servidor
├── package.json
├── .env           ← copie de .env.production e preencha as chaves
```

> ⚠️ NUNCA envie o `.env` com chaves reais para o Git. Use o painel da Hostinger para definir variáveis de ambiente.

### 1.3 Variáveis de ambiente no painel Hostinger

No painel VPS ou Node.js Hosting, configure:

| Variável         | Valor                                      |
|------------------|--------------------------------------------|
| PORT             | 3333                                       |
| NODE_ENV         | production                                 |
| GEMINI_API_KEY   | sua-chave-real                             |
| ASAAS_API_KEY    | sua-chave-real                             |
| ASAAS_BASE_URL   | https://api.asaas.com/api/v3               |
| CORS_ORIGIN      | https://seudominio.com,https://www.seudominio.com |

### 1.4 Instalar dependências e iniciar

```bash
npm install --omit=dev
npm start              # node dist/server.js
```

### 1.5 Manter o processo vivo com PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name keaflow
pm2 save
pm2 startup            # configura reinício automático
```

### 1.6 Nginx como proxy reverso (recomendado)

Se a Hostinger fornecer acesso ao Nginx, configure um subdomínio `api.seudominio.com`:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Depois ative SSL gratuito pelo painel da Hostinger (Let's Encrypt).

---

## 2. Frontend — Hospedagem Compartilhada

### 2.1 Configurar a URL do backend

Edite `web/.env.production`:

```env
VITE_API_URL=https://api.seudominio.com/api/v1
```

### 2.2 Gerar o build

```bash
cd web
npm run build          # gera web/dist/
```

### 2.3 Enviar para a Hostinger

Via FTP (FileZilla) ou Gerenciador de Arquivos do hPanel:

- Conecte no servidor
- Navegue até `public_html/` (ou subpasta do domínio)
- Envie **todo o conteúdo** de `web/dist/` para lá

### 2.4 Configurar redirecionamento SPA

Crie o arquivo `public_html/.htaccess`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

Isso garante que rotas como `/builder`, `/chat`, `/settings` funcionem ao recarregar a página.

---

## 3. Fluxo completo de deploy

```bash
# 1. Build de tudo
npm run build:all

# 2. Enviar dist/ do backend para o VPS via FTP/SSH
# 3. Enviar web/dist/ para public_html/ via FTP

# No servidor (SSH):
pm2 restart keaflow
```

---

## 4. Checklist final

- [ ] `.env` configurado no servidor com chaves reais
- [ ] `CORS_ORIGIN` aponta para o domínio do frontend
- [ ] `VITE_API_URL` aponta para o subdomínio do backend
- [ ] SSL ativo nos dois domínios (https)
- [ ] `.htaccess` criado no `public_html/`
- [ ] PM2 configurado para reinício automático
