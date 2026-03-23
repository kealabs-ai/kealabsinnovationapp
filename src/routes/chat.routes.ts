import type { FastifyInstance } from 'fastify';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AgentProfile {
  name: string;
  company: string;
  tone: string;
  role: string;
  systemPrompt: string;
  services: string;
  objections: string;
  closingStyle: string;
}

interface ChatBody {
  profile: AgentProfile;
  history: ChatMessage[];
  message: string;
}

function buildSystemPrompt(p: AgentProfile): string {
  return `Você é ${p.name}, ${p.role} da ${p.company}.

TOM DE COMUNICAÇÃO: ${p.tone}

SERVIÇOS QUE VOCÊ OFERECE:
${p.services}

COMO LIDAR COM OBJEÇÕES:
${p.objections}

ESTILO DE FECHAMENTO:
${p.closingStyle}

${p.systemPrompt ? `INSTRUÇÕES ADICIONAIS:\n${p.systemPrompt}\n` : ''}
REGRAS IMPORTANTES:
- Nunca invente preços — diga que vai gerar um orçamento personalizado
- Seja conciso: respostas de no máximo 3 parágrafos
- Sempre termine com uma pergunta ou próximo passo
- Não saia do papel de ${p.role} da ${p.company}`;
}

export async function chatRoutes(app: FastifyInstance) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

  app.post<{ Body: ChatBody }>('/chat', async (req, reply) => {
    const { profile, history, message } = req.body;

    if (!message?.trim()) {
      return reply.status(400).send({ error: 'message is required' });
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: buildSystemPrompt(profile),
      });

      const chat = model.startChat({
        history: history.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      const result = await chat.sendMessage(message);
      const text = result.response.text();

      return reply.send({ reply: text });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gemini error';
      return reply.status(500).send({ error: msg });
    }
  });
}
