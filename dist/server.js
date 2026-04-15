"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const static_1 = __importDefault(require("@fastify/static"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const quote_routes_1 = require("./routes/quote.routes");
const chat_routes_1 = require("./routes/chat.routes");
const quote_observer_1 = require("./patterns/quote.observer");
const path_1 = __importDefault(require("path"));
const ORANGE = '\x1b[38;2;234;88;12m';
const SLATE = '\x1b[38;2;148;163;184m';
const RESET = '\x1b[0m';
const log = (msg) => console.log(`${ORANGE}[KeaFlow]${RESET} ${SLATE}${msg}${RESET}`);
async function bootstrap() {
    const webDist = path_1.default.join(__dirname, '..', 'web', 'dist');
    const app = (0, fastify_1.default)({ logger: false, ajv: { customOptions: { removeAdditional: true } } });
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
        : true;
    await app.register(cors_1.default, {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    await app.register(quote_routes_1.quoteRoutes, { prefix: '/api' });
    await app.register(chat_routes_1.chatRoutes, { prefix: '/api' });
    app.get('/health', () => ({
        status: 'ok',
        brand: 'KeaLabs',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    }));
    // Serve frontend estático — deve vir após as rotas de API
    await app.register(static_1.default, {
        root: webDist,
        prefix: '/',
        wildcard: false,
    });
    // SPA fallback — qualquer rota não encontrada retorna index.html
    app.setNotFoundHandler((_req, reply) => {
        reply.sendFile('index.html', webDist);
    });
    const httpServer = (0, http_1.createServer)(app.server);
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: process.env.CORS_ORIGIN ?? '*', methods: ['GET', 'POST'] },
    });
    quote_observer_1.quoteObserver.attach(io);
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
//# sourceMappingURL=server.js.map