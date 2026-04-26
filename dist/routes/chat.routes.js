"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = chatRoutes;
const crypto_1 = require("crypto");
const generative_ai_1 = require("@google/generative-ai");
const sessions = new Map();
const messages = new Map();
let msgCounter = 1;
function buildSystemPrompt(session) {
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
            llm_model: req.body.llm_model ?? 'gemini-2.0-flash',
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
                    model: session.llm_model ?? 'gemini-2.0-flash',
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