import type { FastifyInstance } from 'fastify';
import { builderController } from '../controllers/builder.controller';

export async function quoteRoutes(app: FastifyInstance) {
  const c = builderController;

  app.post('/quotes', c.create.bind(c));
  app.get('/quotes', c.list.bind(c));
  app.delete('/quotes', c.clearStore.bind(c));

  app.get('/quotes/:id', c.findOne.bind(c));
  app.get('/quotes/:id/payload/gemini', c.geminiPayload.bind(c));
  app.get('/quotes/:id/payload/asaas', c.asaasPayload.bind(c));
  app.patch('/quotes/:id/status', c.updateStatus.bind(c));
}
