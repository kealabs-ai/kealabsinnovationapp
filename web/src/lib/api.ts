import axios from 'axios';

export const BASE_URL = 'https://srv1023256.hstgr.cloud';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ServiceType = 'WEB' | 'BI' | 'MINI_SITE' | 'AI_AGENT';
export type QuoteStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BISource    = 'excel' | 'api' | 'database';
export type Complexity  = 'standard' | 'advanced';
export type HostingPlan = 'single' | 'premium' | 'business' | 'vps-starter' | 'vps-pro' | 'vps-ultra';
export type AgentPlan   = 'free' | 'starter' | 'pro' | 'enterprise';
export type AgentTone   = 'formal' | 'friendly' | 'technical' | 'consultive';

export interface Client {
  id: string;
  name: string;
  email?: string;
  cpf_cnpj?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Modules {
  n8nAutomation?: boolean;
  whatsappGateway?: boolean;
  agileSetup?: boolean;
  agileMentoringHours?: number;
  hosting?: HostingPlan;
}

export interface WebPricingInput      { serviceType: 'WEB';       menuCount: number; includeAsaasIntegration: boolean; modules?: Modules; }
export interface BIPricingInput       { serviceType: 'BI';        sources: BISource[]; complexity: Complexity; modules?: Modules; }
export interface MiniSitePricingInput { serviceType: 'MINI_SITE'; pageCount: number; includeInstagram: boolean; includeWhatsappButton: boolean; modules?: Modules; }
export interface AIAgentPricingInput  { serviceType: 'AI_AGENT';  plan: AgentPlan; agentCount: number; includeRAG: boolean; includeVoice: boolean; modules?: Modules; }

export interface PricingResult {
  setupValue: number;
  monthlyValue: number;
  breakdown: Record<string, number>;
}

export interface Quote {
  id: string;
  client_id: string;
  clientName?: string;
  clientEmail?: string;
  service_type: ServiceType;
  status: QuoteStatus;
  setup_value: number;
  monthly_value: number;
  description?: string;
  asaas_customer_id?: string;
  asaas_charge_id?: string;
  pricing?: PricingResult;
  created_at: string;
  updated_at: string;
}

export interface QuoteStatusHistory {
  id: number;
  quote_id: string;
  from_status: QuoteStatus | null;
  to_status: QuoteStatus;
  note?: string;
  changed_at: string;
}

export interface ChatSession {
  id: string;
  client_id?: string;
  quote_id?: string;
  agent_name: string;
  agent_role: string;
  agent_tone: AgentTone;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  sent_at: string;
}

export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_at: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  company: string;
  role: string;
  tone: AgentTone;
  services: string;
  objections: string;
  closing_style: string;
  system_prompt?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationReadyPayload {
  quote: Quote;
  gemini: { model: string; prompt: string; context: object };
  asaas: { customer: object; charge: object };
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

export const clientsApi = {
  list:   ()                                                           => api.get<Client[]>('/clients'),
  get:    (id: string)                                                 => api.get<Client>(`/clients/${id}`),
  create: (body: Omit<Client, 'id' | 'created_at' | 'updated_at'>)   => api.post<Client>('/clients', body),
  update: (body: Partial<Client> & { id: string })                    => api.post<Client>('/clients/update', body),
  delete: (id: string)                                                 => api.post('/clients/delete', { id }),
};

// ─── QUOTES ───────────────────────────────────────────────────────────────────

export interface CreateQuoteDTO {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  pricing: WebPricingInput | BIPricingInput | MiniSitePricingInput | AIAgentPricingInput;
}

export const quotesApi = {
  list:             ()                                                          => api.get<Quote[]>('/quotes'),
  get:              (id: string)                                                => api.get<Quote>(`/quotes/${id}`),
  history:          (id: string)                                                => api.get<QuoteStatusHistory[]>(`/quotes/${id}/history`),
  metricsByService: ()                                                          => api.get('/quotes/metrics/by-service'),
  metricsMonthly:   ()                                                          => api.get('/quotes/metrics/monthly'),
  create:           (body: CreateQuoteDTO)                                      => api.post<Quote>('/quotes', body),
  updateStatus:     (id: string, status: QuoteStatus, note?: string)           => api.post('/quotes/update-status', { id, status, note }),
  updateAsaas:      (id: string, asaas_customer_id: string, asaas_charge_id: string) =>
                      api.post('/quotes/update-asaas', { id, asaas_customer_id, asaas_charge_id }),
  delete:           (id: string)                                                => api.post('/quotes/delete', { id }),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  listSessions:  ()                                                        => api.get<ChatSession[]>('/chat/sessions'),
  getSession:    (id: string)                                              => api.get<ChatSession>(`/chat/sessions/${id}`),
  getMessages:   (id: string)                                              => api.get<ChatMessage[]>(`/chat/sessions/${id}/messages`),
  createSession: (body: Partial<ChatSession>)                              => api.post<ChatSession>('/chat/sessions', body),
  updateSession: (body: Partial<ChatSession> & { id: string })            => api.post<ChatSession>('/chat/sessions/update', body),
  deleteSession: (id: string)                                              => api.post('/chat/sessions/delete', { id }),
  sendMessage:   (session_id: string, role: 'user' | 'model', content: string) =>
                   api.post<ChatMessage>('/chat/messages', { session_id, role, content }),
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  list:   ()                                             => api.get<SystemSetting[]>('/settings'),
  get:    (key: string)                                  => api.get<SystemSetting>(`/settings/${key}`),
  upsert: (setting_key: string, setting_value: string)  => api.post('/settings/upsert', { setting_key, setting_value }),
  delete: (setting_key: string)                          => api.post('/settings/delete', { setting_key }),
};

// ─── AGENTS ───────────────────────────────────────────────────────────────────

export const agentsApi = {
  list:   ()                                                               => api.get<AgentProfile[]>('/agents'),
  active: ()                                                               => api.get<AgentProfile>('/agents/active'),
  get:    (id: string)                                                     => api.get<AgentProfile>(`/agents/${id}`),
  create: (body: Omit<AgentProfile, 'id' | 'created_at' | 'updated_at'>) => api.post<AgentProfile>('/agents', body),
  update: (body: Partial<AgentProfile> & { id: string })                  => api.post<AgentProfile>('/agents/update', body),
  delete: (id: string)                                                     => api.post('/agents/delete', { id }),
};
