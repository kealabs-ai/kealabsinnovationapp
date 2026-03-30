// ─── Enums ───────────────────────────────────────────────────────────────────

export type ServiceType = 'WEB' | 'BI' | 'MINI_SITE' | 'AI_AGENT';
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BISource = 'excel' | 'api' | 'database';
export type Complexity = 'standard' | 'advanced';
export type HostingPlan = 'single' | 'premium' | 'business' | 'vps-starter' | 'vps-pro' | 'vps-ultra';
export type AgentPlan = 'free' | 'starter' | 'pro' | 'enterprise';

// ─── Pricing Input ────────────────────────────────────────────────────────────

export interface WebPricingInput {
  serviceType: 'WEB';
  menuCount: number;
  includeAsaasIntegration: boolean;
}

export interface BIPricingInput {
  serviceType: 'BI';
  sources: BISource[];
  complexity: Complexity;
}

export interface MiniSitePricingInput {
  serviceType: 'MINI_SITE';
  pageCount: number;
  includeInstagram: boolean;
  includeWhatsappButton: boolean;
}

export interface AIAgentPricingInput {
  serviceType: 'AI_AGENT';
  plan: AgentPlan;
  agentCount: number;       // qtd de agentes configurados
  includeRAG: boolean;      // base de conhecimento vetorial
  includeVoice: boolean;    // canal de voz (ElevenLabs/Whisper)
}

export interface Modules {
  n8nAutomation?: boolean;
  whatsappGateway?: boolean;
  agileSetup?: boolean;
  agileMentoringHours?: number;
  hosting?: HostingPlan;
}

export type PricingInput = (WebPricingInput | BIPricingInput | MiniSitePricingInput | AIAgentPricingInput) & { modules?: Modules };

// ─── Pricing Result ───────────────────────────────────────────────────────────

export interface PricingResult {
  setupValue: number;
  monthlyValue: number;
  breakdown: Record<string, number>;
}

// ─── Quote (estado em memória) ────────────────────────────────────────────────

export interface Quote {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  serviceType: ServiceType;
  status: QuoteStatus;
  pricing: PricingResult;
  description?: string;
  createdAt: string;
}

export interface CreateQuoteDTO {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  pricing: PricingInput;
}

// ─── Payloads prontos para endpoints externos ─────────────────────────────────

export interface GeminiPitchPayload {
  model: string;
  prompt: string;
  context: {
    clientName: string;
    serviceType: ServiceType;
    setupValue: number;
    monthlyValue: number;
    breakdown: Record<string, number>;
  };
}

export interface AsaasCustomerPayload {
  name: string;
  email?: string;
  cpfCnpj?: string;
  notificationDisabled: boolean;
}

export interface AsaasChargePayload {
  customer: string; // ID retornado pelo Asaas após criar o customer
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string; // quote.id
}

export interface IntegrationReadyPayload {
  quote: Quote;
  gemini: GeminiPitchPayload;
  asaas: {
    customer: AsaasCustomerPayload;
    charge: Omit<AsaasChargePayload, 'customer'>; // customer preenchido após criar o customer
  };
}
