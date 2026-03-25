import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { quoteRoutes } from './routes/quote.routes';
import { chatRoutes } from './routes/chat.routes';
import { quoteObserver } from './patterns/quote.observer';
import path from 'path';

const ORANGE = '\x1b[38;2;234;88;12m';
const SLATE  = '\x1b[38;2;148;163;184m';
const RESET  = '\x1b[0m';
const log = (msg: string) => console.log(`${ORANGE}[KeaFlow]${RESET} ${SLATE}${msg}${RESET}`);

async function bootstrap() {
  const webDist = path.join(__dirname, '..', 'web', 'dist');

  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  await app.register(quoteRoutes, { prefix: '/api/v1' });
  await app.register(chatRoutes,  { prefix: '/api/v1' });

  app.get('/health', () => ({
    status: 'ok',
    brand: 'KeaLabs',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  // Serve frontend estático — deve vir após as rotas de API
  await app.register(staticFiles, {
    root: webDist,
    prefix: '/',
    wildcard: false,
  });

  // SPA fallback — qualquer rota não encontrada retorna index.html
  app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html', webDist);
  });

  const httpServer = createServer(app.server);
  const io = new SocketServer(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN ?? '*', methods: ['GET', 'POST'] },
  });

  quoteObserver.attach(io);

  io.on('connection', (socket) => {
    log(`Socket conectado: ${socket.id}`);
    socket.on('join:admins', () => {
      socket.join('admins');
      log(`Socket ${socket.id} entrou na sala admins`);
    });
    socket.on('disconnect', () => log(`Socket desconectado: ${socket.id}`));
  });

  const PORT = Number(process.env.PORT ?? 3333);
  await app.ready();
  httpServer.listen(PORT, () => {
    log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    log(`📡 WebSocket ativo na mesma porta`);
    log(`💾 Modo: store em memória (sem banco)`);
    log(`🤖 IA: Gemini 2.5 Flash (payload pronto)`);
    log(`💳 Pagamentos: Asaas (payload pronto)`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
