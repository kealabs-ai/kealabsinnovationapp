import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { PricingEngine } from '../services/pricing.engine';
import { quoteStore } from '../store/quote.store';
import { quoteObserver } from '../patterns/quote.observer';
import type { CreateQuoteDTO, QuoteStatus } from '../types';
import { generateProposalPdf } from '../services/pdf.service';
import type { PdfPayload } from '../services/pdf.service';

// Adapta Quote interno para o formato esperado pelo frontend
function toApiQuote(q: ReturnType<typeof quoteStore.findById>) {
  if (!q) return null;
  return {
    id: q.id,
    client_id: q.id,
    clientName: q.clientName,
    clientEmail: q.clientEmail,
    service_type: q.serviceType,
    status: q.status,
    setup_value: q.pricing.setupValue,
    monthly_value: q.pricing.monthlyValue,
    description: q.description,
    pricing: q.pricing,
    created_at: q.createdAt,
    updated_at: q.createdAt,
  };
}

export async function quoteRoutes(app: FastifyInstance) {

  // ─── CLIENTS (mapeados dos dados do quote) ────────────────────────────────
  app.get('/clients', async (_req, reply) => {
    const clients = quoteStore.findAll().map((q) => ({
      id: q.id,
      name: q.clientName,
      email: q.clientEmail,
      cpf_cnpj: q.clientCpfCnpj,
      created_at: q.createdAt,
      updated_at: q.createdAt,
    }));
    return reply.send(clients);
  });

  app.get<{ Params: { id: string } }>('/clients/:id', async (req, reply) => {
    const q = quoteStore.findById(req.params.id);
    if (!q) return reply.status(404).send({ error: 'Client not found' });
    return reply.send({ id: q.id, name: q.clientName, email: q.clientEmail, cpf_cnpj: q.clientCpfCnpj, created_at: q.createdAt, updated_at: q.createdAt });
  });

  app.post<{ Body: { name: string; email?: string; cpf_cnpj?: string; phone?: string } }>('/clients', async (req, reply) => {
    const { name, email, cpf_cnpj } = req.body;
    const id = randomUUID();
    const now = new Date().toISOString();
    return reply.status(201).send({ id, name, email, cpf_cnpj, created_at: now, updated_at: now });
  });

  app.post('/clients/update', async (_req, reply) => reply.send({ success: true }));
  app.post('/clients/delete', async (_req, reply) => reply.send({ success: true }));

  // ─── QUOTES ───────────────────────────────────────────────────────────────
  app.get('/quotes', async (_req, reply) => {
    return reply.send(quoteStore.findAll().map(toApiQuote));
  });

  app.get('/quotes/metrics/by-service', async (_req, reply) => {
    const all = quoteStore.findAll();
    const map: Record<string, number> = {};
    for (const q of all) map[q.serviceType] = (map[q.serviceType] ?? 0) + 1;
    return reply.send(Object.entries(map).map(([service_type, count]) => ({ service_type, count })));
  });

  app.get('/quotes/metrics/monthly', async (_req, reply) => {
    return reply.send([]);
  });

  app.get<{ Params: { id: string } }>('/quotes/:id', async (req, reply) => {
    const q = quoteStore.findById(req.params.id);
    if (!q) return reply.status(404).send({ error: 'Quote not found' });
    return reply.send(toApiQuote(q));
  });

  app.get<{ Params: { id: string } }>('/quotes/:id/history', async (req, reply) => {
    const q = quoteStore.findById(req.params.id);
    if (!q) return reply.status(404).send({ error: 'Quote not found' });
    return reply.send([{ id: 1, quote_id: q.id, from_status: null, to_status: q.status, changed_at: q.createdAt }]);
  });

  app.post<{ Body: CreateQuoteDTO }>('/quotes', async (req, reply) => {
    const dto = req.body;
    const pricing = PricingEngine.calculate(dto.pricing);
    const quote = quoteStore.create(dto, pricing);
    quoteObserver.notifyCreated(quote);
    return reply.status(201).send(toApiQuote(quote));
  });

  app.post<{ Body: { id: string; status: QuoteStatus; note?: string } }>('/quotes/update-status', async (req, reply) => {
    const { id, status } = req.body;
    const updated = quoteStore.patch(id, { status });
    if (!updated) return reply.status(404).send({ error: 'Quote not found' });
    quoteObserver.notifyUpdated(updated);
    return reply.send(toApiQuote(updated));
  });

  app.post<{ Body: { id: string; asaas_customer_id: string; asaas_charge_id: string } }>('/quotes/update-asaas', async (req, reply) => {
    const { id } = req.body;
    const q = quoteStore.findById(id);
    if (!q) return reply.status(404).send({ error: 'Quote not found' });
    return reply.send(toApiQuote(q));
  });

  app.post<{ Body: { id: string } }>('/quotes/delete', async (req, reply) => {
    quoteStore.patch(req.body.id, {});
    return reply.send({ success: true });
  });

  app.post<{ Body: PdfPayload }>('/quotes/pdf', async (req, reply) => {
    const pdfBuffer = await generateProposalPdf(req.body);
    reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="proposta-${req.body.clientName.replace(/\s+/g, '-').toLowerCase() || 'kealabs'}.pdf"`)
      .send(pdfBuffer);
  });

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  const settingsStore = new Map<string, string>();

  app.get('/settings', async (_req, reply) => {
    const rows = Array.from(settingsStore.entries()).map(([setting_key, setting_value]) => ({
      setting_key, setting_value, updated_at: new Date().toISOString(),
    }));
    return reply.send(rows);
  });

  app.get<{ Params: { key: string } }>('/settings/:key', async (req, reply) => {
    const val = settingsStore.get(req.params.key);
    if (val === undefined) return reply.status(404).send({ error: 'Setting not found' });
    return reply.send({ setting_key: req.params.key, setting_value: val, updated_at: new Date().toISOString() });
  });

  app.post<{ Body: { setting_key: string; setting_value: string } }>('/settings/upsert', async (req, reply) => {
    settingsStore.set(req.body.setting_key, req.body.setting_value);
    return reply.send({ setting_key: req.body.setting_key, setting_value: req.body.setting_value, updated_at: new Date().toISOString() });
  });

  app.post<{ Body: { setting_key: string } }>('/settings/delete', async (req, reply) => {
    settingsStore.delete(req.body.setting_key);
    return reply.send({ success: true });
  });

  // ─── PROSPECTS ──────────────────────────────────────────────────────────────
  const prospectsStore = new Map<string, Record<string, unknown>>();

  app.get('/prospects', async (_req, reply) => {
    return reply.send(Array.from(prospectsStore.values()));
  });

  app.post<{ Body: Record<string, unknown> }>('/prospects', async (req, reply) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const prospect = { ...req.body, id, created_at: now };
    prospectsStore.set(id, prospect);
    return reply.status(201).send(prospect);
  });

  app.post<{ Body: Record<string, unknown> & { id: string } }>('/prospects/update', async (req, reply) => {
    const { id } = req.body;
    const existing = prospectsStore.get(id);
    if (!existing) return reply.status(404).send({ error: 'Prospect not found' });
    const updated = { ...existing, ...req.body };
    prospectsStore.set(id, updated);
    return reply.send(updated);
  });

  app.post<{ Body: { id: string } }>('/prospects/delete', async (req, reply) => {
    prospectsStore.delete(req.body.id);
    return reply.send({ success: true });
  });

  // ─── AGENTS ───────────────────────────────────────────────────────────────
  const defaultAgent = {
    id: 'default',
    name: 'Kea',
    company: 'KeaLabs',
    role: 'Consultora Comercial',
    tone: 'consultive',
    services: 'Sites Web, Mini Sites com Instagram, Business Intelligence, AI Agents',
    objections: 'Reconheça a objeção, valide a preocupação do cliente e reposicione o valor antes do preço.',
    closing_style: 'Proponha um próximo passo concreto: agendar uma call, enviar uma proposta ou iniciar um projeto piloto.',
    system_prompt: '',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  let agentStore = { ...defaultAgent };

  app.get('/agents', async (_req, reply) => reply.send([agentStore]));
  app.get('/agents/active', async (_req, reply) => reply.send(agentStore));
  app.get<{ Params: { id: string } }>('/agents/:id', async (_req, reply) => reply.send(agentStore));

  app.post('/agents', async (req, reply) => {
    agentStore = { ...agentStore, ...(req.body as object), id: randomUUID(), updated_at: new Date().toISOString() };
    return reply.status(201).send(agentStore);
  });

  app.post('/agents/update', async (req, reply) => {
    agentStore = { ...agentStore, ...(req.body as object), updated_at: new Date().toISOString() };
    return reply.send(agentStore);
  });

  app.post('/agents/delete', async (_req, reply) => {
    agentStore = { ...defaultAgent };
    return reply.send({ success: true });
  });
}
