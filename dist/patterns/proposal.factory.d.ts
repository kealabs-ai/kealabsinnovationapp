import type { Quote, GeminiPitchPayload, AsaasCustomerPayload, AsaasChargePayload, IntegrationReadyPayload } from '../types';
export declare class ProposalFactory {
    static buildGeminiPayload(quote: Quote): GeminiPitchPayload;
    static buildAsaasCustomerPayload(quote: Quote): AsaasCustomerPayload;
    static buildAsaasChargePayload(quote: Quote): Omit<AsaasChargePayload, 'customer'>;
    static buildIntegrationPayload(quote: Quote): IntegrationReadyPayload;
}
//# sourceMappingURL=proposal.factory.d.ts.map