# KeaFlow — Arquitetura de Microserviços

**Versão:** 1.0  
**Empresa:** KeaLabs  
**Projeto:** KeaFlow — Motor de Orçamentos + IA Comercial  

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Atual — Monolito](#2-arquitetura-atual--monolito)
3. [Arquitetura Alvo — Microserviços](#3-arquitetura-alvo--microserviços)
4. [Serviços](#4-serviços)
   - 4.1 Gateway
   - 4.2 Quotes Service
   - 4.3 Chat Service
   - 4.4 Notifications Service
5. [Contratos de API](#5-contratos-de-api)
6. [Comunicação entre Serviços](#6-comunicação-entre-serviços)
7. [Estrutura de Pastas](#7-estrutura-de-pastas)
8. [Docker Compose](#8-docker-compose)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Plano de Migração](#10-plano-de-migração)
11. [Decisões Técnicas](#11-decisões-técnicas)

---

## 1. Visão Geral

O KeaFlow é um sistema de orçamentos inteligentes para a KeaLabs, composto por:

- **Motor de precificação** para 4 tipos de serviço (WEB, Mini Site, BI, AI Agent)
- **Agente comercial com IA** via Gemini 2.0 Flash
- **Dashboard em tempo real** via WebSocket
- **Geração de payloads** prontos para Gemini e Asaas

A migração para microserviços permite que cada domínio seja **deployado, escalado e mantido de forma independente**, sem afetar os demais.

---

## 2. Arquitetura Atual — Monolito

```
keaflow/
├── src/
│   ├── controllers/        ← BuilderController
│   ├── strategies/         ← WebPricing, BIPricing, MiniSite, AIAgent
│   ├── services/           ← PricingEngine
│   ├── store/              ← QuoteStore (in-memory Map)
│   ├── patterns/           ← ProposalFactory, QuoteObserver
│   ├── routes/             ← quote.routes, chat.routes
│   └── server.ts           ← Fastify + Socket.io na porta 3333
└── web/                    ← React + Vite (porta 5173)
```

**Problemas do monolito em escala:**

| Problema | Impacto |
|---|---|
| Chat e Quotes no mesmo processo | Pico de conversas derruba os orçamentos |
| WebSocket acoplado ao servidor HTTP | Impossível escalar horizontalmente |
| Store em memória | Dados perdidos ao reiniciar |
| Deploy único | Qualquer mudança exige redeploy completo |

---

## 3. Arquitetura Alvo — Microserviços

```
                        ┌─────────────────────────────────────┐
                        │           CLIENTE (Browser)          │
                        │         React + Vite — :5173         │
                        └──────────────────┬──────────────────┘
                                           │ HTTP + WebSocket
                                           ▼
                        ┌─────────────────────────────────────┐
                        │           API GATEWAY               │
                        │        Fastify — porta 3000          │
                        │  Roteamento · Auth · Rate Limit      │
                        └────┬──────────────┬─────────────────┘
                             │              │
              ┌──────────────▼──┐      ┌────▼──────────────┐
              │  QUOTES SERVICE │      │   CHAT SERVICE    │
              │   porta 3001    │      │    porta 3002     │
              │                 │      │                   │
              │ Pricing Engine  │      │  Gemini 2.0 Flash │
              │ ProposalFactory │      │  System Prompt    │
              │ Quote Store     │      │  Histórico        │
              └────────┬────────┘      └───────────────────┘
                       │ HTTP POST /events
                       ▼
              ┌─────────────────────┐
              │ NOTIFICATIONS SVC   │
              │     porta 3003      │
              │                     │
              │  Socket.io Server   │
              │  Sala: admins       │
              │  Eventos em tempo   │
              │  real               │
              └─────────────────────┘
```

---

## 4. Serviços

### 4.1 Gateway — porta 3000

**Responsabilidade:** Único ponto de entrada para o frontend. Roteia requisições para os serviços corretos, centraliza autenticação e rate limiting.

**Stack:** Node.js · Fastify · @fastify/http-proxy

**Rotas e destinos:**

| Método | Rota | Destino |
|---|---|---|
| POST | /api/v1/quotes | quotes-service:3001 |
| GET | /api/v1/quotes | quotes-service:3001 |
| GET | /api/v1/quotes/:id | quotes-service:3001 |
| GET | /api/v1/quotes/:id/payload/gemini | quotes-service:3001 |
| GET | /api/v1/quotes/:id/payload/asaas | quotes-service:3001 |
| PATCH | /api/v1/quotes/:id/status | quotes-service:3001 |
| DELETE | /api/v1/quotes | quotes-service:3001 |
| POST | /api/v1/chat | chat-service:3002 |
| WS | / | notifications-service:3003 |

**Implementação:**

```ts
// gateway/src/server.ts
import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';

const app = Fastify();

app.register(proxy, {
  upstream: process.env.QUOTES_URL,   // http://quotes:3001
  prefix: '/api/v1/quotes',
  rewritePrefix: '/api/v1/quotes',
});

app.register(proxy, {
  upstream: process.env.CHAT_URL,     // http://chat:3002
  prefix: '/api/v1/chat',
  rewritePrefix: '/api/v1/chat',
});

app.listen({ port: 3000, host: '0.0.0.0' });
```

**Dependências:**
```json
{
  "dependencies": {
    "fastify": "^5.x",
    "@fastify/cors": "^10.x",
    "@fastify/http-proxy": "^10.x"
  }
}
```

---

### 4.2 Quotes Service — porta 3001

**Responsabilidade:** Calcular preços, armazenar orçamentos e gerar payloads para Gemini e Asaas.

**Stack:** Node.js · Fastify · TypeScript

**Arquivos migrados do monolito (cópia direta):**

```
quotes-service/src/
├── strategies/
│   └── pricing.strategy.ts     ← copiar sem alteração
├── services/
│   └── pricing.engine.ts       ← copiar sem alteração
├── store/
│   └── quote.store.ts          ← copiar (fase 1) ou trocar por banco (fase 2)
├── patterns/
│   └── proposal.factory.ts     ← copiar sem alteração
├── controllers/
│   └── builder.controller.ts   ← ajustar notifyCreated/notifyUpdated
├── routes/
│   └── quote.routes.ts         ← copiar sem alteração
├── types.ts                    ← copiar sem alteração
└── server.ts                   ← porta 3001, sem Socket.io
```

**Única alteração — notificações via HTTP:**

```ts
// quotes-service/src/controllers/builder.controller.ts

// ANTES (monolito):
quoteObserver.notifyCreated(quote);

// DEPOIS (microserviço):
await fetch(`${process.env.NOTIFICATIONS_URL}/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'quote:created', data: quote }),
}).catch(() => {}); // falha silenciosa — não bloqueia o orçamento
```

**Variáveis de ambiente:**
```env
PORT=3001
NODE_ENV=production
NOTIFICATIONS_URL=http://notifications:3003
GEMINI_API_KEY=sua-chave
ASAAS_API_KEY=sua-chave
CORS_ORIGIN=http://gateway:3000
```

---

### 4.3 Chat Service — porta 3002

**Responsabilidade:** Receber mensagens do usuário, montar o system prompt com o perfil do agente e retornar a resposta do Gemini.

**Stack:** Node.js · Fastify · @google/generative-ai

**Arquivos migrados do monolito (cópia direta):**

```
chat-service/src/
├── routes/
│   └── chat.routes.ts    ← copiar sem alteração
└── server.ts             ← porta 3002
```

Este serviço é **completamente isolado** — não depende de nenhum outro serviço interno.

**Variáveis de ambiente:**
```env
PORT=3002
NODE_ENV=production
GEMINI_API_KEY=sua-chave
CORS_ORIGIN=http://gateway:3000
```

---

### 4.4 Notifications Service — porta 3003

**Responsabilidade:** Receber eventos dos outros serviços via HTTP e distribuir em tempo real para os clientes conectados via WebSocket.

**Stack:** Node.js · Fastify · Socket.io

**Implementação completa:**

```ts
// notifications-service/src/server.ts
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

const app = Fastify({ logger: false });
const httpServer = createServer(app.server);
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
});

await app.register(cors, { origin: process.env.CORS_ORIGIN ?? '*' });

// Recebe eventos dos outros microserviços
app.post('/events', async (req, reply) => {
  const { event, data } = req.body as { event: string; data: unknown };
  io.to('admins').emit(event, data);
  return reply.send({ ok: true });
});

// Clientes do frontend se conectam aqui
io.on('connection', (socket) => {
  socket.on('join:admins', () => socket.join('admins'));
  socket.on('disconnect', () => {});
});

const PORT = Number(process.env.PORT ?? 3003);
await app.ready();
httpServer.listen(PORT);
```

**Variáveis de ambiente:**
```env
PORT=3003
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
```

---

## 5. Contratos de API

### Evento interno — Quotes → Notifications

```
POST http://notifications:3003/events
```

```json
{
  "event": "quote:created",
  "data": {
    "id": "uuid-v4",
    "clientName": "Empresa XYZ",
    "serviceType": "WEB",
    "status": "PENDING",
    "pricing": {
      "setupValue": 5700.00,
      "monthlyValue": 619.90,
      "breakdown": {}
    },
    "createdAt": "2025-03-23T20:00:00.000Z"
  }
}
```

Eventos possíveis: `quote:created` · `quote:updated`

### WebSocket — Notifications → Frontend

```
ws://localhost:3003
```

| Emit (cliente) | Descrição |
|---|---|
| `join:admins` | Entra na sala de notificações |

| On (cliente) | Payload | Quando |
|---|---|---|
| `quote:created` | Quote | Novo orçamento criado |
| `quote:updated` | Quote | Status atualizado |

---

## 6. Comunicação entre Serviços

### Fase 1 — HTTP Direto (recomendado para início)

```
quotes-service ──POST /events──► notifications-service
```

**Prós:** simples, sem dependências extras, fácil de debugar  
**Contras:** se notifications cair, o evento se perde

### Fase 2 — Message Broker com Redis (recomendado para produção)

```
quotes-service ──PUBLISH──► Redis ──SUBSCRIBE──► notifications-service
```

**Prós:** eventos persistidos, tolerante a falhas, desacoplamento total  
**Contras:** mais uma infraestrutura para gerenciar

**Implementação com Redis:**

```ts
// quotes-service — publisher
import { createClient } from 'redis';
const pub = createClient({ url: process.env.REDIS_URL });
await pub.connect();
await pub.publish('keaflow:events', JSON.stringify({
  event: 'quote:created',
  data: quote,
}));

// notifications-service — subscriber
import { createClient } from 'redis';
const sub = createClient({ url: process.env.REDIS_URL });
await sub.connect();
await sub.subscribe('keaflow:events', (msg) => {
  const { event, data } = JSON.parse(msg);
  io.to('admins').emit(event, data);
});
```

---

## 7. Estrutura de Pastas

### Opção A — Repositórios separados (polyrepo)

```
github.com/kealabs/
├── keaflow-gateway/
├── keaflow-quotes/
├── keaflow-chat/
├── keaflow-notifications/
└── keaflow-web/
```

**Quando usar:** times diferentes por serviço, deploys totalmente independentes.

### Opção B — Monorepo com workspaces (recomendado)

```
kealabs/
├── packages/
│   ├── gateway/
│   │   ├── src/server.ts
│   │   └── package.json
│   ├── quotes-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── strategies/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── patterns/
│   │   │   ├── routes/
│   │   │   ├── types.ts
│   │   │   └── server.ts
│   │   └── package.json
│   ├── chat-service/
│   │   ├── src/
│   │   │   ├── routes/chat.routes.ts
│   │   │   └── server.ts
│   │   └── package.json
│   ├── notifications-service/
│   │   ├── src/server.ts
│   │   └── package.json
│   └── web/
│       ├── src/
│       └── package.json
├── package.json          ← workspaces config
├── docker-compose.yml
└── .env
```

**`package.json` raiz:**
```json
{
  "name": "kealabs",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "docker-compose up",
    "build": "npm run build --workspaces",
    "install:all": "npm install --workspaces"
  }
}
```

---

## 8. Docker Compose

```yaml
# docker-compose.yml
version: '3.9'

services:

  gateway:
    build: ./packages/gateway
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      QUOTES_URL: http://quotes:3001
      CHAT_URL: http://chat:3002
      CORS_ORIGIN: http://localhost:5173
    depends_on:
      - quotes
      - chat
    restart: unless-stopped

  quotes:
    build: ./packages/quotes-service
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      NODE_ENV: production
      NOTIFICATIONS_URL: http://notifications:3003
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      ASAAS_API_KEY: ${ASAAS_API_KEY}
    depends_on:
      - notifications
    restart: unless-stopped

  chat:
    build: ./packages/chat-service
    ports:
      - "3002:3002"
    environment:
      PORT: 3002
      NODE_ENV: production
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    restart: unless-stopped

  notifications:
    build: ./packages/notifications-service
    ports:
      - "3003:3003"
    environment:
      PORT: 3003
      NODE_ENV: production
      CORS_ORIGIN: http://localhost:5173
    restart: unless-stopped

  web:
    build: ./packages/web
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
      VITE_WS_URL: http://localhost:3003
    depends_on:
      - gateway
    restart: unless-stopped

# Fase 2 — descomente quando migrar para Redis
#  redis:
#    image: redis:7-alpine
#    ports:
#      - "6379:6379"
#    restart: unless-stopped
```

**Dockerfile padrão para cada serviço Node.js:**

```dockerfile
# Dockerfile (usado em gateway, quotes, chat, notifications)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**Dockerfile do frontend:**

```dockerfile
# packages/web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`nginx.conf` para SPA:**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 9. Variáveis de Ambiente

### `.env` raiz (compartilhado pelo docker-compose)

```env
# ─── Gemini ───────────────────────────────────────────────
GEMINI_API_KEY=sua-chave-gemini

# ─── Asaas ────────────────────────────────────────────────
ASAAS_API_KEY=sua-chave-asaas
ASAAS_BASE_URL=https://api.asaas.com/api/v3

# ─── Redis (fase 2) ───────────────────────────────────────
# REDIS_URL=redis://redis:6379
```

### Por serviço

| Variável | Gateway | Quotes | Chat | Notifications |
|---|:---:|:---:|:---:|:---:|
| PORT | ✅ | ✅ | ✅ | ✅ |
| NODE_ENV | ✅ | ✅ | ✅ | ✅ |
| CORS_ORIGIN | ✅ | — | — | ✅ |
| QUOTES_URL | ✅ | — | — | — |
| CHAT_URL | ✅ | — | — | — |
| NOTIFICATIONS_URL | — | ✅ | — | — |
| GEMINI_API_KEY | — | ✅ | ✅ | — |
| ASAAS_API_KEY | — | ✅ | — | — |
| REDIS_URL (fase 2) | — | ✅ | — | ✅ |

---

## 10. Plano de Migração

### Fase 1 — Extração do Chat Service
**Esforço:** baixo · **Risco:** zero (sem dependências internas)

- [ ] Criar `packages/chat-service/`
- [ ] Copiar `chat.routes.ts` e criar `server.ts` na porta 3002
- [ ] Atualizar `VITE_API_URL` do frontend para apontar para o gateway
- [ ] Criar gateway mínimo que roteia `/api/v1/chat` para chat-service
- [ ] Testar e deployar

### Fase 2 — Extração do Quotes Service
**Esforço:** médio · **Risco:** baixo

- [ ] Criar `packages/quotes-service/`
- [ ] Copiar todos os arquivos de pricing, store, factory e controller
- [ ] Substituir `quoteObserver.notify*` por `fetch` para notifications-service
- [ ] Criar `packages/notifications-service/` com Socket.io
- [ ] Atualizar gateway para rotear `/api/v1/quotes`
- [ ] Testar WebSocket end-to-end
- [ ] Deployar

### Fase 3 — Persistência (banco de dados)
**Esforço:** médio · **Risco:** médio

- [ ] Adicionar PostgreSQL ou MySQL ao docker-compose
- [ ] Substituir `QuoteStore` (Map em memória) por Prisma/Drizzle no quotes-service
- [ ] Criar migrations
- [ ] Testar e deployar

### Fase 4 — Message Broker
**Esforço:** médio · **Risco:** baixo

- [ ] Adicionar Redis ao docker-compose
- [ ] Substituir HTTP `/events` por `redis.publish` no quotes-service
- [ ] Substituir listener HTTP por `redis.subscribe` no notifications-service
- [ ] Testar tolerância a falhas
- [ ] Deployar

### Fase 5 — Autenticação no Gateway
**Esforço:** alto · **Risco:** médio

- [ ] Adicionar JWT ou API Key no gateway
- [ ] Proteger rotas administrativas (PATCH status, DELETE store)
- [ ] Adicionar rate limiting por IP
- [ ] Deployar

---

## 11. Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Linguagem | TypeScript | Consistência com o monolito atual |
| Framework HTTP | Fastify | Já em uso, alta performance, baixo overhead |
| WebSocket | Socket.io | Já em uso no frontend |
| Comunicação fase 1 | HTTP direto | Simples, sem dependências extras |
| Comunicação fase 2 | Redis Pub/Sub | Desacoplamento, tolerância a falhas |
| Banco de dados | PostgreSQL + Prisma | Tipagem forte, migrations, ORM maduro |
| Containerização | Docker + Compose | Ambiente reproduzível, fácil deploy |
| Monorepo | npm workspaces | Sem ferramentas extras, nativo do npm |
| Frontend | Nginx (produção) | Serve estáticos com alta performance |

---

*Documento gerado em: 2025 · KeaLabs Inovação*
