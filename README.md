<<<<<<< HEAD
# kealabsinnovationapp
Sistema de interno da empresa
=======
# KeaFlow — Ecossistema de Orçamentos Inteligente

> KeaLabs · Dark Mode + Orange-600 · Powered by Gemini 2.5 Flash

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Real-time**: Socket.io
- **ORM**: Prisma (MySQL)
- **IA**: Google Gemini 2.5 Flash
- **Pagamentos**: Asaas API

## Design Patterns

| Pattern    | Implementação                                      |
|------------|----------------------------------------------------|
| Strategy   | `WebPricingStrategy` / `BIPricingStrategy`         |
| Factory    | `ProposalFactory`                                  |
| Observer   | `QuoteEventEmitter` → Socket.io `quote:updated`    |
| Singleton  | `PrismaClient` / `GeminiService`                   |

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env .env.local
# Editar DATABASE_URL, GEMINI_API_KEY, ASAAS_API_KEY

# 3. Gerar cliente Prisma e migrar banco
npm run db:generate
npm run db:migrate

# 4. Iniciar em desenvolvimento
npm run dev
```

## API Endpoints

### Criar Orçamento WEB
```http
POST /api/v1/quotes
Content-Type: application/json

{
  "clientName": "Empresa XYZ",
  "clientEmail": "contato@empresa.com",
  "pricing": {
    "serviceType": "WEB",
    "menuCount": 8,
    "includeAsaasIntegration": true,
    "modules": {
      "n8nAutomation": true,
      "whatsappGateway": true,
      "hosting": "premium"
    }
  }
}
```

### Criar Orçamento B.I.
```http
POST /api/v1/quotes
Content-Type: application/json

{
  "clientName": "Empresa ABC",
  "pricing": {
    "serviceType": "BI",
    "source": "database",
    "complexity": "advanced",
    "modules": {
      "agileSetup": true,
      "agileMentoringHours": 10,
      "hosting": "business"
    }
  }
}
```

### Aprovar e Gerar Cobrança
```http
PATCH /api/v1/quotes/:id/approve
```

### Listar Orçamentos
```http
GET /api/v1/quotes
```

## WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3333');
socket.emit('join:admins');

socket.on('quote:created', (quote) => console.log('Novo orçamento:', quote));
socket.on('quote:updated', (quote) => console.log('Orçamento atualizado:', quote));
```

## Lógica de Cálculo

### WEB
- Base: R$ 3.000 (até 6 menus)
- Menu extra: + R$ 300/menu
- Integração Asaas: + R$ 1.000

### B.I.
- Excel: R$ 2.000 | API: R$ 3.500 | Database: R$ 5.000
- Complexidade avançada: × 1.3

### Módulos
- n8n Automation: + R$ 1.200
- WhatsApp Gateway: + R$ 900
- Agile Setup: + R$ 1.500
- Mentoria Ágil: + R$ 200/hora

### Recorrência
- Suporte mensal: 10% do setup total
- Hospedagem: Single R$ 12,99 | Premium R$ 17,99 | Business R$ 26,99
>>>>>>> e79714a (chore: initialize keaflow project)
