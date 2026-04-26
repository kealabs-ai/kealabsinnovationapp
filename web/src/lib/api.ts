import axios from 'axios';

export const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)
  ?? 'https://srv1023256.hstgr.cloud';

export const api = axios.create({
  baseURL: `${BASE_URL}/k1/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;

  const url = `${config.baseURL}${config.url}`;
  console.group(`%c⬆ ${config.method?.toUpperCase()} ${url}`, 'color:#EA580C;font-weight:bold');
  if (config.data) console.log('payload:', config.data);
  console.groupEnd();
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = `${response.config.baseURL}${response.config.url}`;
    console.group(`%c⬇ ${response.status} ${url}`, 'color:#16A34A;font-weight:bold');
    console.log('data:', response.data);
    console.groupEnd();

    // Normaliza respostas: extrai array se vier dentro de { data, items ou results }
    const d = response.data;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      if (Array.isArray(d.data))        response.data = d.data;
      else if (Array.isArray(d.items))   response.data = d.items;
      else if (Array.isArray(d.results)) response.data = d.results;
    }
    return response;
  },
  (error) => {
    const url = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
    console.group(`%c✖ ERRO ${error.response?.status ?? ''} ${url}`, 'color:#DC2626;font-weight:bold');
    console.log('response:', error.response?.data ?? error.message);
    console.groupEnd();
    return Promise.reject(error);
  },
);

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
  consultorArea?: boolean;
  pandaVideos?: boolean;
  bunneyNet?: boolean;
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
  id: string;           // normalizado — pode vir como quote_id da API Python
  quote_id?: string;
  client_id: string;
  clientName?: string;
  client_name?: string;
  clientEmail?: string;
  client_email?: string;
  service_type: ServiceType;
  status: QuoteStatus;
  setup_value: number;
  monthly_value: number;
  installments?: number;
  interest_rate?: number;
  installment_value?: number;
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
  llm_model?: string;
  api_key?: string;
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
  llm_model?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface IntegrationReadyPayload {
  quote: Quote;
  gemini: { model: string; prompt: string; context: object };
  asaas: { customer: object; charge: object };
}

// ─── PDF ────────────────────────────────────────────────────────────────────

export interface PdfSection {
  title: string;
  rows: { label: string; value: string; bold?: boolean }[];
  subtotal?: { label: string; value: string };
}

export interface PdfHostingRow {
  label: string;
  spec: string;
  price: string;
}

export interface PdfPayload {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  sections: PdfSection[];
  hosting?: PdfHostingRow[];
  setupValue: string;
  clientCharge: string;
  installments: number;
  installmentValue: string;
  totalCharge: string;
  liquidMensal: string;
  liquidAntecipado: string;
  mdrInfo: string;
  date: string;
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

// A API Python retorna quote_id, client_name, client_email — normaliza para o formato do frontend
function normalizeQuote(q: unknown): Quote {
  const r = q as Record<string, unknown>;
  return {
    ...(r as unknown as Quote),
    id: (r.id ?? r.quote_id) as string,
    clientName: (r.clientName ?? r.client_name) as string | undefined,
    clientEmail: (r.clientEmail ?? r.client_email) as string | undefined,
  };
}

function normalizeQuotes(data: unknown): Quote[] {
  if (!Array.isArray(data)) return [];
  return data.map((q) => normalizeQuote(q));
}

export interface CreateQuoteDTO {
  clientName: string;
  clientEmail?: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  pricing: WebPricingInput | BIPricingInput | MiniSitePricingInput | AIAgentPricingInput;
  installments: number;
  interest_rate: number;
  installment_value: number;
}

export const quotesApi = {
  list:             ()                                                          => api.get<Quote[]>('/quotes').then(r => { r.data = normalizeQuotes(r.data); return r; }),
  get:              (id: string)                                                => api.get<Quote>(`/quotes/${id}`).then(r => { r.data = normalizeQuote(r.data); return r; }),
  history:          (id: string)                                                => api.get<QuoteStatusHistory[]>(`/quotes/${id}/history`),
  metricsByService: ()                                                          => api.get('/quotes/metrics/by-service'),
  metricsMonthly:   ()                                                          => api.get('/quotes/metrics/monthly'),
  create:           (body: CreateQuoteDTO)                                      => api.post<Quote>('/quotes', body).then(r => { r.data = normalizeQuote(r.data); return r; }),
  updateStatus:     (id: string, status: QuoteStatus, note?: string)           => api.post('/quotes/update-status', { id, status, note }),
  updateAsaas:      (id: string, asaas_customer_id: string, asaas_charge_id: string) =>
                      api.post('/quotes/update-asaas', { id, asaas_customer_id, asaas_charge_id }),
  delete:           (id: string)                                                => api.post('/quotes/delete', { id }),
  pdf:              (body: PdfPayload)                                          => api.post<Blob>('/quotes/pdf', body, { responseType: 'blob' }),
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

// ─── PROSPECTS ───────────────────────────────────────────────────────────────

export type ProspectSource = 'instagram' | 'whatsapp' | 'site' | 'indicacao' | 'outro';
export type ProspectStatus = 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'APPROVED' | 'REJECTED';

export interface Prospect {
  id: string;
  name: string;
  email?: string;
  cpf_cnpj?: string;
  phone?: string;
  company?: string;
  source?: ProspectSource;
  status: ProspectStatus;
  notes?: string;
  client_id?: string;
  created_at: string;
}

export const prospectsApi = {
  list:   ()                                                                  => api.get<Prospect[]>('/prospects'),
  create: (body: Omit<Prospect, 'id' | 'created_at'>)                        => api.post<Prospect>('/prospects', body),
  update: (body: Partial<Prospect> & { id: string })                         => api.post<Prospect>('/prospects/update', body),
  delete: (id: string)                                                        => api.post('/prospects/delete', { id }),
};

// ─── AUTH / USERS ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'vendedor' | 'usuario';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: SystemUser;
}

export const authApi = {
  login: (body: LoginDTO) =>
    api.post<LoginResponse>('/auth/login', body),
  createUser: (body: CreateUserDTO) =>
    api.post<SystemUser>('/auth/users', body),
  listUsers: () =>
    api.get<SystemUser[]>('/auth/users'),
};

// ─── AGENTS ───────────────────────────────────────────────────────────────────

export const agentsApi = {
  list:   ()                                                               => api.get<AgentProfile[]>('/agents'),
  active: ()                                                               => api.get<AgentProfile>('/agents/active'),
  models: ()                                                               => api.get<{ models: string[] }>('/agents/models'),
  get:    (id: string)                                                     => api.get<AgentProfile>(`/agents/${id}`),
  create: (body: Omit<AgentProfile, 'id' | 'created_at' | 'updated_at'>) => api.post<AgentProfile>('/agents', body),
  update: (body: Partial<AgentProfile> & { id: string })                  => api.post<AgentProfile>('/agents/update', body),
  delete: (id: string)                                                     => api.post('/agents/delete', { id }),
};
