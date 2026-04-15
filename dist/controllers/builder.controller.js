"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builderController = exports.BuilderController = void 0;
const pricing_engine_1 = require("../services/pricing.engine");
const proposal_factory_1 = require("../patterns/proposal.factory");
const quote_store_1 = require("../store/quote.store");
const quote_observer_1 = require("../patterns/quote.observer");
class BuilderController {
    // POST /quotes — calcula, armazena em memória e retorna payload pronto para integrações
    async create(req, reply) {
        const dto = req.body;
        const pricing = pricing_engine_1.PricingEngine.calculate(dto.pricing);
        const quote = quote_store_1.quoteStore.create(dto, pricing);
        quote_observer_1.quoteObserver.notifyCreated(quote);
        const integrationPayload = proposal_factory_1.ProposalFactory.buildIntegrationPayload(quote);
        return reply.status(201).send({ success: true, data: integrationPayload });
    }
    // GET /quotes — lista todos os quotes da sessão atual
    async list(_req, reply) {
        return reply.send({ success: true, data: quote_store_1.quoteStore.findAll() });
    }
    // GET /quotes/:id — retorna quote + payload de integração completo
    async findOne(req, reply) {
        const quote = quote_store_1.quoteStore.findById(req.params.id);
        if (!quote)
            return reply.status(404).send({ success: false, message: 'Quote não encontrado' });
        return reply.send({
            success: true,
            data: proposal_factory_1.ProposalFactory.buildIntegrationPayload(quote),
        });
    }
    // GET /quotes/:id/payload/gemini — payload isolado para o endpoint Gemini
    async geminiPayload(req, reply) {
        const quote = quote_store_1.quoteStore.findById(req.params.id);
        if (!quote)
            return reply.status(404).send({ success: false, message: 'Quote não encontrado' });
        return reply.send({ success: true, data: proposal_factory_1.ProposalFactory.buildGeminiPayload(quote) });
    }
    // GET /quotes/:id/payload/asaas — payload isolado para o endpoint Asaas
    async asaasPayload(req, reply) {
        const quote = quote_store_1.quoteStore.findById(req.params.id);
        if (!quote)
            return reply.status(404).send({ success: false, message: 'Quote não encontrado' });
        return reply.send({
            success: true,
            data: {
                customer: proposal_factory_1.ProposalFactory.buildAsaasCustomerPayload(quote),
                charge: proposal_factory_1.ProposalFactory.buildAsaasChargePayload(quote),
            },
        });
    }
    // PATCH /quotes/:id/status — atualiza status no store em memória
    async updateStatus(req, reply) {
        const updated = quote_store_1.quoteStore.patch(req.params.id, req.body);
        if (!updated)
            return reply.status(404).send({ success: false, message: 'Quote não encontrado' });
        quote_observer_1.quoteObserver.notifyUpdated(updated);
        return reply.send({ success: true, data: updated });
    }
    // DELETE /quotes — limpa o store da sessão
    async clearStore(_req, reply) {
        quote_store_1.quoteStore.clear();
        return reply.send({ success: true, message: 'Store limpo' });
    }
}
exports.BuilderController = BuilderController;
exports.builderController = new BuilderController();
//# sourceMappingURL=builder.controller.js.map