"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = chatRoutes;
const crypto_1 = require("crypto");
const generative_ai_1 = require("@google/generative-ai");
const sessions = new Map();
const messages = new Map();
let msgCounter = 1;
function buildSystemPrompt(session) {
    return `Você é ${session.agent_name}, ${session.agent_role} da KeaLabs.
Tom: ${session.agent_tone}
Serviços: Sites Web, Mini Sites, Business Intelligence, AI Agents.
Regras: Nunca invente preços. Respostas de no máximo 3 parágrafos. Sempre termine com uma pergunta ou próximo passo.`;
}
async function chatRoutes(app) {
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
    // ─── SESSIONS ─────────────────────────────────────────────────────────────
    app.get('/chat/sessions', async (_req, reply) => {
        return reply.send(Array.from(sessions.values()));
    });
    app.get('/chat/sessions/:id', async (req, reply) => {
        const s = sessions.get(req.params.id);
        if (!s)
            return reply.status(404).send({ error: 'Session not found' });
        return reply.send(s);
    });
    app.get('/chat/sessions/:id/messages', async (req, reply) => {
        return reply.send(messages.get(req.params.id) ?? []);
    });
    app.post('/chat/sessions', async (req, reply) => {
        const now = new Date().toISOString();
        const session = {
            id: (0, crypto_1.randomUUID)(),
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
    app.post('/chat/sessions/update', async (req, reply) => {
        const s = sessions.get(req.body.id);
        if (!s)
            return reply.status(404).send({ error: 'Session not found' });
        const updated = { ...s, ...req.body, updated_at: new Date().toISOString() };
        sessions.set(updated.id, updated);
        return reply.send(updated);
    });
    app.post('/chat/sessions/delete', async (req, reply) => {
        sessions.delete(req.body.id);
        messages.delete(req.body.id);
        return reply.send({ success: true });
    });
    // ─── MESSAGES ─────────────────────────────────────────────────────────────
    app.post('/chat/messages', async (req, reply) => {
        const { session_id, role, content } = req.body;
        const session = sessions.get(session_id);
        if (!session)
            return reply.status(404).send({ error: 'Session not found' });
        const sessionMsgs = messages.get(session_id) ?? [];
        // Salva mensagem do usuário
        const userMsg = { id: msgCounter++, session_id, role, content, sent_at: new Date().toISOString() };
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
                const aiMsg = { id: msgCounter++, session_id, role: 'model', content: text, sent_at: new Date().toISOString() };
                sessionMsgs.push(aiMsg);
                messages.set(session_id, sessionMsgs);
                return reply.send([userMsg, aiMsg]);
            }
            catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Gemini error';
                return reply.status(500).send({ error: errMsg });
            }
        }
        return reply.send([userMsg]);
    });
}
//# sourceMappingURL=chat.routes.js.map