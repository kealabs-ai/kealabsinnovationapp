"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalFactory = void 0;
class ProposalFactory {
    static buildGeminiPayload(quote) {
        return {
            model: 'gemini-2.5-flash-preview-09-2025',
            prompt: `
Você é um especialista em vendas consultivas da KeaLabs, empresa de tecnologia premium.
Gere um pitch comercial profissional e persuasivo em português para o cliente "${quote.clientName}".

Escopo:
- Tipo de serviço: ${quote.serviceType}
- Valor de Setup: R$ ${quote.pricing.setupValue.toFixed(2)}
- Mensalidade: R$ ${quote.pricing.monthlyValue.toFixed(2)}
- Módulos contratados: ${JSON.stringify(quote.pricing.breakdown)}

Escreva 3 parágrafos curtos destacando: o problema resolvido, a solução KeaLabs e o ROI esperado.
Tom: profissional, confiante e orientado a resultados. Máximo 200 palavras.
      `.trim(),
            context: {
                clientName: quote.clientName,
                serviceType: quote.serviceType,
                setupValue: quote.pricing.setupValue,
                monthlyValue: quote.pricing.monthlyValue,
                breakdown: quote.pricing.breakdown,
            },
        };
    }
    static buildAsaasCustomerPayload(quote) {
        return {
            name: quote.clientName,
            email: quote.clientEmail,
            cpfCnpj: quote.clientCpfCnpj,
            notificationDisabled: false,
        };
    }
    static buildAsaasChargePayload(quote) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        return {
            billingType: 'PIX',
            value: quote.pricing.setupValue,
            dueDate: dueDate.toISOString().split('T')[0],
            description: `KeaLabs · ${quote.serviceType} Setup | Ref: ${quote.id.slice(0, 8).toUpperCase()}`,
            externalReference: quote.id,
        };
    }
    static buildIntegrationPayload(quote) {
        return {
            quote,
            gemini: ProposalFactory.buildGeminiPayload(quote),
            asaas: {
                customer: ProposalFactory.buildAsaasCustomerPayload(quote),
                charge: ProposalFactory.buildAsaasChargePayload(quote),
            },
        };
    }
}
exports.ProposalFactory = ProposalFactory;
//# sourceMappingURL=proposal.factory.js.map