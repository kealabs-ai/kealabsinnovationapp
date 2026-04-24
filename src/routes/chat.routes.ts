import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatSession {
  id: string;
  client_id?: string;
  quote_id?: string;
  agent_name: string;
  agent_role: string;
  agent_tone: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  sent_at: string;
}

const sessions = new Map<string, ChatSession>();
const messages = new Map<string, ChatMessage[]>();
let msgCounter = 1;

function buildSystemPrompt(session: ChatSession): string {
  return `Você é ${session.agent_name}, ${session.agent_role} da KeaLabs — uma empresa de tecnologia especializada em desenvolvimento web, automações, inteligência de dados e agentes de IA.

## Identidade
- Nome: ${session.agent_name}
- Cargo: ${session.agent_role}
- Tom de comunicação: ${session.agent_tone}
- Empresa: KeaLabs (kealabs.cloud)

## Serviços e Preços
- **Site Web**: a partir de R$ 3.000 (inclui até 6 menus; menus extras R$ 300/cada; integração Asaas +R$ 1.000)
- **Mini Site**: a partir de R$ 1.200 (até 3 páginas; páginas extras R$ 200/cada; integração Instagram +R$ 600; botão WhatsApp +R$ 200)
- **Business Intelligence**: Excel R$ 2.000 | API R$ 3.500 | Database R$ 5.000 (complexidade avançada ×1,3)
- **AI Agent Free**: R$ 800 setup — Gemini Flash, 1 agente, 500 msgs/mês
- **AI Agent Starter**: R$ 1.800 setup + R$ 149/mês — até 3 agentes, 5k msgs/mês, memória por sessão
- **AI Agent Pro**: R$ 3.500 setup + R$ 349/mês — até 10 agentes, 50k msgs/mês, RAG + base vetorial
- **AI Agent Enterprise**: R$ 8.000 setup + R$ 799/mês — ilimitado, multi-modelo, SLA 99,9%
- **Módulos**: n8n Automation R$ 1.200 | WhatsApp Gateway R$ 900 | Agile Setup R$ 1.500 | Mentoria R$ 200/h
- **Hospedagem** (Hostinger): Single R$ 12,99/mês | Premium R$ 17,99/mês | Business R$ 26,99/mês | VPS Starter R$ 49,90/mês | VPS Pro R$ 89,90/mês | VPS Ultra R$ 149,90/mês
- Suporte mensal: 10% do valor do setup

## Como lidar com objeções
${session.agent_tone === 'consultive' ? 'Faça perguntas para entender a dor antes de apresentar solução. Valide a preocupação e reposicione o valor antes do preço.' : 'Reconheça a objeção, valide a preocupação do cliente e reposicione o valor antes do preço.'}

## Estilo de fechamento
Proponha sempre um próximo passo concreto: agendar uma call, enviar uma proposta personalizada ou iniciar um projeto piloto.

## Regras obrigatórias
- NUNCA invente preços fora da tabela acima
- Respostas objetivas, máximo 4 parágrafos
- Use markdown: **negrito** para valores e destaques, listas para comparações
- Sempre termine com uma pergunta ou próximo passo claro
- Se não souber algo, diga que vai verificar e sugira contato via kealabs.cloud`;
}

export async function chatRoutes(app: FastifyInstance) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

  // ─── SESSIONS ─────────────────────────────────────────────────────────────
  app.get('/chat/sessions', async (_req, reply) => {
    return reply.send(Array.from(sessions.values()));
  });

  app.get<{ Params: { id: string } }>('/chat/sessions/:id', async (req, reply) => {
    const s = sessions.get(req.params.id);
    if (!s) return reply.status(404).send({ error: 'Session not found' });
    return reply.send(s);
  });

  app.get<{ Params: { id: string } }>('/chat/sessions/:id/messages', async (req, reply) => {
    return reply.send(messages.get(req.params.id) ?? []);
  });

  app.post<{ Body: Partial<ChatSession> }>('/chat/sessions', async (req, reply) => {
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: randomUUID(),
      agent_name: req.body.agent_name ?? 'Kea',
      agent_role: req.body.agent_role ?? 'Consultora Comercial',
      agent_tone: req.body.agent_tone ?? 'consultive',
      client_id: req.body.client_id,
      quote_id: req.body.quote_id,
      created_at: now,
      updated_at: now,
    };
    sessions.set(session.id, session);
    messages.set(session.id, []);
    return reply.status(201).send(session);
  });

  app.post<{ Body: Partial<ChatSession> & { id: string } }>('/chat/sessions/update', async (req, reply) => {
    const s = sessions.get(req.body.id);
    if (!s) return reply.status(404).send({ error: 'Session not found' });
    const updated = { ...s, ...req.body, updated_at: new Date().toISOString() };
    sessions.set(updated.id, updated);
    return reply.send(updated);
  });

  app.post<{ Body: { id: string } }>('/chat/sessions/delete', async (req, reply) => {
    sessions.delete(req.body.id);
    messages.delete(req.body.id);
    return reply.send({ success: true });
  });

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  app.post<{ Body: { session_id: string; role: 'user' | 'model'; content: string } }>('/chat/messages', async (req, reply) => {
    const { session_id, role, content } = req.body;
    const session = sessions.get(session_id);
    if (!session) return reply.status(404).send({ error: 'Sessão não encontrada. Inicie uma nova conversa.' });

    const sessionMsgs = messages.get(session_id) ?? [];

    const userMsg: ChatMessage = { id: msgCounter++, session_id, role, content, sent_at: new Date().toISOString() };
    sessionMsgs.push(userMsg);
    messages.set(session_id, sessionMsgs);

    if (role === 'user') {
      if (!process.env.GEMINI_API_KEY) {
        return reply.status(500).send({ error: 'Chave da API Gemini não configurada no servidor.' });
      }
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: buildSystemPrompt(session),
        });

        const history = sessionMsgs.slice(0, -1).map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(content);
        const text = result.response.text();

        if (!text) return reply.status(500).send({ error: 'O modelo não retornou resposta. Tente novamente.' });

        const aiMsg: ChatMessage = { id: msgCounter++, session_id, role: 'model', content: text, sent_at: new Date().toISOString() };
        sessionMsgs.push(aiMsg);
        messages.set(session_id, sessionMsgs);

        return reply.send([userMsg, aiMsg]);
      } catch (err) {
        // Remove a mensagem do usuário do histórico para não poluir em caso de retry
        const idx = sessionMsgs.indexOf(userMsg);
        if (idx !== -1) sessionMsgs.splice(idx, 1);
        messages.set(session_id, sessionMsgs);

        const raw = err instanceof Error ? err.message : String(err);
        // Traduz erros comuns da API Gemini
        const friendly = raw.includes('API_KEY') || raw.includes('API key')
          ? 'Chave da API Gemini inválida ou sem permissão.'
          : raw.includes('quota') || raw.includes('RESOURCE_EXHAUSTED')
          ? 'Limite de requisições da API atingido. Tente em alguns instantes.'
          : raw.includes('SAFETY')
          ? 'Mensagem bloqueada por políticas de segurança do modelo.'
          : raw.includes('fetch') || raw.includes('network') || raw.includes('ENOTFOUND')
          ? 'Sem conexão com a API Gemini. Verifique a rede do servidor.'
          : `Erro ao processar resposta: ${raw}`;

        return reply.status(500).send({ error: friendly });
      }
    }

    return reply.send([userMsg]);
  });
}
