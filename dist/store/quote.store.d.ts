import type { Quote, CreateQuoteDTO, PricingResult } from '../types';
declare class QuoteStore {
    private store;
    create(dto: CreateQuoteDTO, pricing: PricingResult): Quote;
    findById(id: string): Quote | undefined;
    findAll(): Quote[];
    patch(id: string, data: Partial<Pick<Quote, 'status' | 'description'>>): Quote | undefined;
    clear(): void;
}
export declare const quoteStore: QuoteStore;
export {};
//# sourceMappingURL=quote.store.d.ts.map