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
  return `Você é ${session.agent_name}, ${session.agent_role} da KeaLabs.
Tom: ${session.agent_tone}
Serviços: Sites Web, Mini Sites, Business Intelligence, AI Agents.
Regras: Nunca invente preços. Respostas de no máximo 3 parágrafos. Sempre termine com uma pergunta ou próximo passo.`;
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
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    const sessionMsgs = messages.get(session_id) ?? [];

    // Salva mensagem do usuário
    const userMsg: ChatMessage = { id: msgCounter++, session_id, role, content, sent_at: new Date().toISOString() };
    sessionMsgs.push(userMsg);
    messages.set(session_id, sessionMsgs);

    // Se for mensagem do usuário, chama Gemini e retorna resposta do modelo
    if (role === 'user') {
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

        const aiMsg: ChatMessage = { id: msgCounter++, session_id, role: 'model', content: text, sent_at: new Date().toISOString() };
        sessionMsgs.push(aiMsg);
        messages.set(session_id, sessionMsgs);

        return reply.send({ user: userMsg, model: aiMsg });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Gemini error';
        return reply.status(500).send({ error: errMsg });
      }
    }

    return reply.send({ user: userMsg, model: null });
  });
}
