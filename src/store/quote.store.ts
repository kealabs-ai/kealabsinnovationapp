import { randomUUID } from 'crypto';
import type { Quote, CreateQuoteDTO, PricingResult, QuoteStatus } from '../types';

// Store em memória — substitui o banco nesta fase, mantém estado da sessão
class QuoteStore {
  private store = new Map<string, Quote>();

  create(dto: CreateQuoteDTO, pricing: PricingResult): Quote {
    const quote: Quote = {
      id: randomUUID(),
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

  findById(id: string): Quote | undefined {
    return this.store.get(id);
  }

  findAll(): Quote[] {
    return Array.from(this.store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  patch(id: string, data: Partial<Pick<Quote, 'status' | 'description'>>): Quote | undefined {
    const quote = this.store.get(id);
    if (!quote) return undefined;
    const updated = { ...quote, ...data };
    this.store.set(id, updated);
    return updated;
  }

  clear(): void {
    this.store.clear();
  }
}

export const quoteStore = new QuoteStore();
