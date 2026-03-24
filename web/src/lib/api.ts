import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tipos espelhados do backend ──────────────────────────────────────────────

export type ServiceType = 'WEB' | 'BI' | 'MINI_SITE' | 'AI_AGENT';
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BISource = 'excel' | 'api' | 'database';
export type Complexity = 'standard' | 'advanced';
export type HostingPlan = 'single' | 'premium' | 'business' | 'vps-starter' | 'vps-pro' | 'vps-ultra';
export type AgentPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Modules {
  n8nAutomation?: boolean;
  whatsappGateway?: boolean;
  agileSetup?: boolean;
  agileMentoringHours?: number;
  hosting?: HostingPlan;
}

export interface WebPricingInput {
  serviceType: 'WEB';
  menuCount: number;
  includeAsaasIntegration: boolean;
  modules?: Modules;
}

export interface BIPricingInput {
  serviceType: 'BI';
  sources: BISource[];
  complexity: Complexity;
  modules?: Modules;
}

export interface MiniSitePricingInput {
  serviceType: 'MINI_SITE';
  pageCount: number;
  includeInstagram: boolean;
  includeWhatsappButton: boolean;
  modules?: Modules;
}

export interface AIAgentPricingInput {
  serviceType: 'AI_AGENT';
  plan: AgentPlan;
  agentCount: number;
  includeRAG: boolean;
  includeVoice: boolean;
  modules?: Modules;
}

export interface CreateQuoteDTO {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  pricing: WebPricingInput | BIPricingInput | MiniSitePricingInput | AIAgentPricingInput;
}

export interface PricingResult {
  setupValue: number;
  monthlyValue: number;
  breakdown: Record<string, number>;
}

export interface Quote {
  id: string;
  clientName: string;
  clientEmail?: string;
  serviceType: ServiceType;
  status: QuoteStatus;
  pricing: PricingResult;
  description?: string;
  createdAt: string;
}

export interface IntegrationReadyPayload {
  quote: Quote;
  gemini: { model: string; prompt: string; context: object };
  asaas: { customer: object; charge: object };
}
