import type { FastifyRequest, FastifyReply } from 'fastify';
import { PricingEngine } from '../services/pricing.engine';
import { ProposalFactory } from '../patterns/proposal.factory';
import { quoteStore } from '../store/quote.store';
import { quoteObserver } from '../patterns/quote.observer';
import type { CreateQuoteDTO } from '../types';

export class BuilderController {
  // POST /quotes — calcula, armazena em memória e retorna payload pronto para integrações
  async create(req: FastifyRequest<{ Body: CreateQuoteDTO }>, reply: FastifyReply) {
    const dto = req.body;
    const pricing = PricingEngine.calculate(dto.pricing);
    const quote = quoteStore.create(dto, pricing);

    quoteObserver.notifyCreated(quote);

    const integrationPayload = ProposalFactory.buildIntegrationPayload(quote);

    return reply.status(201).send({ success: true, data: integrationPayload });
  }

  // GET /quotes — lista todos os quotes da sessão atual
  async list(_req: FastifyRequest, reply: FastifyReply) {
    return reply.send({ success: true, data: quoteStore.findAll() });
  }

  // GET /quotes/:id — retorna quote + payload de integração completo
  async findOne(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const quote = quoteStore.findById(req.params.id);
    if (!quote) return reply.status(404).send({ success: false, message: 'Quote não encontrado' });

    return reply.send({
      success: true,
      data: ProposalFactory.buildIntegrationPayload(quote),
    });
  }

  // GET /quotes/:id/payload/gemini — payload isolado para o endpoint Gemini
  async geminiPayload(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const quote = quoteStore.findById(req.params.id);
    if (!quote) return reply.status(404).send({ success: false, message: 'Quote não encontrado' });

    return reply.send({ success: true, data: ProposalFactory.buildGeminiPayload(quote) });
  }

  // GET /quotes/:id/payload/asaas — payload isolado para o endpoint Asaas
  async asaasPayload(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const quote = quoteStore.findById(req.params.id);
    if (!quote) return reply.status(404).send({ success: false, message: 'Quote não encontrado' });

    return reply.send({
      success: true,
      data: {
        customer: ProposalFactory.buildAsaasCustomerPayload(quote),
        charge: ProposalFactory.buildAsaasChargePayload(quote),
      },
    });
  }

  // PATCH /quotes/:id/status — atualiza status no store em memória
  async updateStatus(
    req: FastifyRequest<{ Params: { id: string }; Body: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; description?: string } }>,
    reply: FastifyReply,
  ) {
    const updated = quoteStore.patch(req.params.id, req.body);
    if (!updated) return reply.status(404).send({ success: false, message: 'Quote não encontrado' });

    quoteObserver.notifyUpdated(updated);
    return reply.send({ success: true, data: updated });
  }

  // DELETE /quotes — limpa o store da sessão
  async clearStore(_req: FastifyRequest, reply: FastifyReply) {
    quoteStore.clear();
    return reply.send({ success: true, message: 'Store limpo' });
  }
}

export const builderController = new BuilderController();
