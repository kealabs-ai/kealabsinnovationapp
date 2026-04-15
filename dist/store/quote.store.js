"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteStore = void 0;
const crypto_1 = require("crypto");
// Store em memória — substitui o banco nesta fase, mantém estado da sessão
class QuoteStore {
    store = new Map();
    create(dto, pricing) {
        const quote = {
            id: (0, crypto_1.randomUUID)(),
            clientName: dto.clientName,
            clientEmail: dto.clientEmail,
            clientCpfCnpj: dto.clientCpfCnpj,
            serviceType: dto.pricing.serviceType,
            status: 'PENDING',
            pricing,
            createdAt: new Date().toISOString(),
        };
        this.store.set(quote.id, quote);
        return quote;
    }
    findById(id) {
        return this.store.get(id);
    }
    findAll() {
        return Array.from(this.store.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    patch(id, data) {
        const quote = this.store.get(id);
        if (!quote)
            return undefined;
        const updated = { ...quote, ...data };
        this.store.set(id, updated);
        return updated;
    }
    clear() {
        this.store.clear();
    }
}
exports.quoteStore = new QuoteStore();
//# sourceMappingURL=quote.store.js.map