import { useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, BarChart2, FileSpreadsheet, Plug, Database, Gauge, Zap,
  Workflow, MessageCircle, Rocket, Clock, Server, HardDrive, Cpu, Ban,
  Instagram, Link, Bot, Sparkles, BrainCircuit, Building2, BookOpen, Mic,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CreateQuoteDTO, IntegrationReadyPayload, HostingPlan, BISource, MiniSitePricingInput, AIAgentPricingInput, AgentPlan } from '../lib/api';
import { PayloadModal } from '../components/PayloadModal';
import { useSettings } from '../lib/useSettings';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

// Estilos inline para cards — usa variáveis CSS que mudam com o tema
const cardStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? '#FFF1E6' : 'var(--kea-surface)',
  borderColor:     active ? '#EA580C'  : 'var(--kea-border)',
  color:           'var(--kea-heading)',
});

const cardDarkStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? 'rgba(234,88,12,0.1)' : 'var(--kea-surface)',
  borderColor:     active ? '#EA580C' : 'var(--kea-border)',
  color:           'var(--kea-heading)',
});

export function Builder() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<IntegrationReadyPayload | null>(null);
  const [clientName, setClientName]         = useState('');
  const [clientEmail, setClientEmail]       = useState('');
  const [clientCpfCnpj, setClientCpfCnpj]   = useState('');
  const [clientPhone, setClientPhone]       = useState('');
  const [serviceType, setServiceType]       = useState<'WEB' | 'BI' | 'MINI_SITE' | 'AI_AGENT'>('WEB');
  const [menuCount, setMenuCount]           = useState(6);
  const [includeAsaas, setIncludeAsaas]     = useState(false);
  const [sources, setSources]               = useState<Set<BISource>>(new Set(['excel']));
  const [complexity, setComplexity]         = useState<'standard' | 'advanced'>('standard');
  const [pageCount, setPageCount]           = useState(3);
  const [includeInstagram, setIncludeInstagram] = useState(false);
  const [includeWppButton, setIncludeWppButton] = useState(false);
  const [agentPlan, setAgentPlan]           = useState<AgentPlan>('free');
  const [agentCount, setAgentCount]         = useState(1);
  const [includeRAG, setIncludeRAG]         = useState(false);
  const [includeVoice, setIncludeVoice]     = useState(false);
  const [n8n, setN8n]                       = useState(false);
  const [wpp, setWpp]                       = useState(false);
  const [agileSetup, setAgileSetup]         = useState(false);
  const [mentoringHours, setMentoringHours] = useState(0);
  const [hosting, setHosting]               = useState<HostingPlan | ''>('');

  const AGENT_PLANS: Record<AgentPlan, { setup: number; monthly: number; model: string; agents: string; msgs: string; memory: string; desc: string; icon: React.ElementType; badge?: string }> = {
    free:       { setup: settings.agentFreeSetup,       monthly: settings.agentFreeMonthly,       model: 'Gemini 2.0 Flash',                     agents: '1 agente',       msgs: '500 msgs/mês',  memory: 'Sem memória persistente', desc: 'Ideal para testes e MVPs. Usa a API gratuita do Gemini Flash sem custo de modelo, mas com limites de uso.',                                                    icon: Sparkles },
    starter:    { setup: settings.agentStarterSetup,    monthly: settings.agentStarterMonthly,    model: 'Gemini 2.0 Flash + memória',           agents: 'Até 3 agentes',  msgs: '5k msgs/mês',   memory: 'Memória por sessão',      desc: 'Para pequenas empresas. O agente lembra do contexto da conversa e pode ser integrado via webhook a ferramentas como n8n e Zapier.',                           icon: Bot,      badge: 'Popular' },
    pro:        { setup: settings.agentProSetup,        monthly: settings.agentProMonthly,        model: 'Gemini 2.5 Pro / GPT-4o',              agents: 'Até 10 agentes', msgs: '50k msgs/mês',  memory: 'RAG + base vetorial',     desc: 'Para empresas em crescimento. Modelos premium com raciocínio avançado, base de conhecimento própria (RAG) e múltiplos canais de atendimento.',               icon: BrainCircuit },
    enterprise: { setup: settings.agentEnterpriseSetup, monthly: settings.agentEnterpriseMonthly, model: 'Multi-modelo (Gemini + GPT + Claude)',  agents: 'Ilimitado',      msgs: 'Ilimitado',     memory: 'Fine-tuning + SLA 99,9%', desc: 'Para grandes operações. Orquestração multi-modelo, fine-tuning com dados próprios, SLA garantido e suporte dedicado da equipe KeaLabs.',                    icon: Building2 },
  };

  const BI_PRICES: Record<BISource, number> = { excel: settings.biExcel, api: settings.biApi, database: settings.biDatabase };
  const HOSTING_PRICES: Record<string, number> = {
    single: settings.hostingSingle, premium: settings.hostingPremium, business: settings.hostingBusiness,
    'vps-starter': settings.hostingVpsStarter, 'vps-pro': settings.hostingVpsPro, 'vps-ultra': settings.hostingVpsUltra,
  };

  const buildModules = () => ({
    n8nAutomation: n8n || undefined,
    whatsappGateway: wpp || undefined,
    agileSetup: agileSetup || undefined,
    agileMentoringHours: mentoringHours > 0 ? mentoringHours : undefined,
    hosting: hosting || undefined,
  });

  const MODULE_PRICES = {
    n8n: settings.moduleN8n,
    wpp: settings.moduleWhatsapp,
    agile: settings.moduleAgileSetup,
    mentoring: settings.moduleMentoringHour,
  };

  const toggleSource = (s: BISource) => {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); } else next.add(s);
      return next;
    });
  };

  const preview = (() => {
    let base = serviceType === 'WEB'
      ? settings.webBase + (menuCount > settings.webFreeMenus ? (menuCount - settings.webFreeMenus) * settings.webExtraMenuPrice : 0) + (includeAsaas ? settings.webAsaasIntegration : 0)
      : serviceType === 'MINI_SITE'
        ? settings.miniSiteBase + (pageCount > settings.miniSiteFreePages ? (pageCount - settings.miniSiteFreePages) * settings.miniSiteExtraPagePrice : 0) + (includeInstagram ? settings.miniSiteInstagram : 0) + (includeWppButton ? settings.miniSiteWhatsapp : 0)
        : serviceType === 'AI_AGENT'
          ? AGENT_PLANS[agentPlan].setup + Math.max(0, agentCount - 1) * settings.agentExtraAgentPrice + (includeRAG ? settings.agentRAG : 0) + (includeVoice ? settings.agentVoice : 0)
          : Array.from(sources).reduce((sum, s) => sum + BI_PRICES[s], 0) * (complexity === 'advanced' ? settings.biAdvancedMultiplier : 1);
    let setup = base;
    if (n8n) setup += MODULE_PRICES.n8n;
    if (wpp) setup += MODULE_PRICES.wpp;
    if (agileSetup) setup += MODULE_PRICES.agile;
    if (mentoringHours > 0) setup += mentoringHours * MODULE_PRICES.mentoring;
    const agentMonthly = serviceType === 'AI_AGENT' ? AGENT_PLANS[agentPlan].monthly : 0;
    const monthly = setup * settings.monthlySupportRate + (hosting ? (HOSTING_PRICES[hosting] ?? 0) : 0) + agentMonthly;
    return { setup: parseFloat(setup.toFixed(2)), monthly: parseFloat(monthly.toFixed(2)) };
  })();

  const submit = async () => {
    if (!clientName.trim()) return alert('Informe o nome do cliente');
    setLoading(true);
    try {
      const dto: CreateQuoteDTO = {
        clientName,
        clientEmail: clientEmail || undefined,
        clientCpfCnpj: clientCpfCnpj || undefined,
        pricing: serviceType === 'WEB'
          ? { serviceType: 'WEB', menuCount, includeAsaasIntegration: includeAsaas, modules: buildModules() }
          : serviceType === 'MINI_SITE'
            ? { serviceType: 'MINI_SITE', pageCount, includeInstagram, includeWhatsappButton: includeWppButton, modules: buildModules() } as MiniSitePricingInput
            : serviceType === 'AI_AGENT'
              ? { serviceType: 'AI_AGENT', plan: agentPlan, agentCount, includeRAG, includeVoice, modules: buildModules() } as AIAgentPricingInput
              : { serviceType: 'BI', sources: Array.from(sources) as BISource[], complexity, modules: buildModules() },
      };
      const r = await api.post('/quotes', dto);
      setResult(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  // Card selecionável genérico
  const SelectCard = ({
    active, onClick, children, className = '',
  }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-orange-500 ${className}`}
      style={cardStyle(active)}
    >
      {children}
    </button>
  );

  const ic = (on: boolean) => on ? 'text-orange-600' : 'text-orange-300 dark:text-brand-muted';

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Título */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Novo Orçamento</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>Preencha o escopo para calcular e gerar os payloads</p>
      </div>

      {/* Preview */}
      <div className="rounded-3xl p-6 flex justify-between items-center"
        style={{ background: 'linear-gradient(to right, #FFF1E6, #FFF7F3)', border: '1px solid #FED7AA' }}>
        <div>
          <p className="label">Setup estimado</p>
          <p className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>{fmt(preview.setup)}</p>
        </div>
        <div className="text-right">
          <p className="label">Mensalidade</p>
          <p className="text-3xl font-black text-orange-600">{fmt(preview.monthly)}</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Nome *</label>
            <input className="input" placeholder="Empresa XYZ" value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
          <div><label className="label">E-mail</label>
            <input className="input" placeholder="contato@empresa.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
          <div><label className="label">CPF / CNPJ</label>
            <input className="input" placeholder="00.000.000/0001-00" value={clientCpfCnpj} onChange={(e) => setClientCpfCnpj(e.target.value)} /></div>
          <div><label className="label">Telefone / WhatsApp</label>
            <input className="input" placeholder="(00) 9 0000-0000" value={clientPhone}
              onChange={(e) => setClientPhone(maskPhone(e.target.value))} maxLength={16} /></div>
        </div>
      </div>

      {/* Tipo de Serviço */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Tipo de Serviço</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { type: 'WEB',       icon: Globe,        label: 'Web',                   desc: 'Sites e plataformas web' },
            { type: 'MINI_SITE', icon: Instagram,     label: 'Mini Site',             desc: 'Site + Instagram integrado' },
            { type: 'BI',        icon: BarChart2,     label: 'Business Intelligence', desc: 'Dashboards e análise de dados' },
            { type: 'AI_AGENT',  icon: Bot,           label: 'AI Agent',              desc: 'Agentes com inteligência artificial' },
          ] as const).map(({ type, icon: Icon, label, desc }) => (
            <SelectCard key={type} active={serviceType === type} onClick={() => setServiceType(type)}>
              <Icon size={22} className={`mb-2 ${ic(serviceType === type)}`} />
              <p className="font-black text-base">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
            </SelectCard>
          ))}
        </div>

        {serviceType === 'AI_AGENT' && (
          <div className="flex flex-col gap-5 pt-2">

            {/* Planos */}
            <div>
              <label className="label">Plano do Agente</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.entries(AGENT_PLANS) as [AgentPlan, typeof AGENT_PLANS[AgentPlan]][]).map(([key, plan]) => {
                  const Icon = plan.icon;
                  const active = agentPlan === key;
                  return (
                    <button key={key} onClick={() => setAgentPlan(key)}
                      className="p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-orange-500 relative"
                      style={cardStyle(active)}>
                      {plan.badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{ background: '#EA580C', color: '#fff' }}>{plan.badge}</span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={ic(active)} />
                        <span className="font-black text-sm capitalize">{key}</span>
                        {key === 'free' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#DCFCE7', color: '#166534' }}>Gratuito</span>}
                      </div>
                      <p className="text-[11px] mb-2 leading-relaxed" style={{ color: 'var(--kea-body)' }}>{plan.desc}</p>
                      <div className="flex flex-col gap-0.5">
                        {[
                          { label: 'Modelo', value: plan.model },
                          { label: 'Agentes', value: plan.agents },
                          { label: 'Volume', value: plan.msgs },
                          { label: 'Memória', value: plan.memory },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-[11px]">
                            <span style={{ color: 'var(--kea-subtle)' }}>{label}</span>
                            <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--kea-border)' }}>
                        <span className="text-sm font-black text-orange-600">
                          {plan.setup > 0 ? `R$ ${plan.setup.toLocaleString('pt-BR')} setup` : 'Setup gratuito'}
                        </span>
                        {plan.monthly > 0 && (
                          <span className="text-xs ml-2" style={{ color: 'var(--kea-body)' }}>+ R$ {plan.monthly}/mês</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qtd de agentes */}
            <div>
              <label className="label">Quantidade de agentes</label>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={agentPlan === 'free' ? 1 : agentPlan === 'starter' ? 3 : agentPlan === 'pro' ? 10 : 20}
                  value={agentCount} onChange={(e) => setAgentCount(Number(e.target.value))} className="flex-1 accent-orange-600" />
                <span className="font-black w-8 text-center" style={{ color: 'var(--kea-heading)' }}>{agentCount}</span>
              </div>
              {agentCount > 1 && <p className="text-xs text-orange-600 mt-1">+{agentCount - 1} agentes extras → +{fmt((agentCount - 1) * 400)}</p>}
            </div>

            {/* Add-ons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectCard active={includeRAG} onClick={() => setIncludeRAG(!includeRAG)}>
                <div className="flex items-start justify-between mb-2">
                  <BookOpen size={20} className={ic(includeRAG)} />
                  <Checkbox checked={includeRAG} />
                </div>
                <p className="font-bold text-sm">Base de Conhecimento (RAG)</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>Indexação de documentos, PDFs e FAQs para o agente responder com dados próprios da empresa</p>
                <p className="text-xs font-bold text-orange-600 mt-2">+{fmt(settings.agentRAG)}</p>
              </SelectCard>
              <SelectCard active={includeVoice} onClick={() => setIncludeVoice(!includeVoice)}>
                <div className="flex items-start justify-between mb-2">
                  <Mic size={20} className={ic(includeVoice)} />
                  <Checkbox checked={includeVoice} />
                </div>
                <p className="font-bold text-sm">Canal de Voz</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>Integração com ElevenLabs e Whisper para agentes que falam e ouvem via áudio</p>
                <p className="text-xs font-bold text-orange-600 mt-2">+{fmt(settings.agentVoice)}</p>
              </SelectCard>
            </div>
          </div>
        )}

        {serviceType === 'MINI_SITE' && (
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="label">Número de páginas</label>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={10} value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))} className="flex-1 accent-orange-600" />
                <span className="font-black w-8 text-center" style={{ color: 'var(--kea-heading)' }}>{pageCount}</span>
              </div>
              {pageCount > settings.miniSiteFreePages && <p className="text-xs text-orange-600 mt-1">+{pageCount - settings.miniSiteFreePages} páginas extras → +{fmt((pageCount - settings.miniSiteFreePages) * settings.miniSiteExtraPagePrice)}</p>}
            </div>
            <SelectCard active={includeInstagram} onClick={() => setIncludeInstagram(!includeInstagram)}>
              <div className="flex items-start justify-between mb-2">
                <Instagram size={20} className={ic(includeInstagram)} />
                <Checkbox checked={includeInstagram} />
              </div>
              <p className="font-bold text-sm">Integração Instagram</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>Feed e bio link conectados ao site</p>
              <p className="text-xs font-bold text-orange-600 mt-2">+{fmt(settings.miniSiteInstagram)}</p>
            </SelectCard>
            <SelectCard active={includeWppButton} onClick={() => setIncludeWppButton(!includeWppButton)}>
              <div className="flex items-start justify-between mb-2">
                <Link size={20} className={ic(includeWppButton)} />
                <Checkbox checked={includeWppButton} />
              </div>
              <p className="font-bold text-sm">Botão WhatsApp</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>Botão flutuante de contato direto</p>
              <p className="text-xs font-bold text-orange-600 mt-2">+{fmt(settings.miniSiteWhatsapp)}</p>
            </SelectCard>
          </div>
        )}

        {serviceType === 'WEB' && (
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="label">Quantidade de menus/seções</label>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={20} value={menuCount}
                  onChange={(e) => setMenuCount(Number(e.target.value))} className="flex-1 accent-orange-600" />
                <span className="font-black w-8 text-center" style={{ color: 'var(--kea-heading)' }}>{menuCount}</span>
              </div>
              {menuCount > settings.webFreeMenus && <p className="text-xs text-orange-600 mt-1">+{menuCount - settings.webFreeMenus} menus extras → +{fmt((menuCount - settings.webFreeMenus) * settings.webExtraMenuPrice)}</p>}
            </div>
            <SelectCard active={includeAsaas} onClick={() => setIncludeAsaas(!includeAsaas)}>
              <div className="flex items-start justify-between mb-2">
                <Plug size={20} className={ic(includeAsaas)} />
                <Checkbox checked={includeAsaas} />
              </div>
              <p className="font-bold text-sm">Integração Asaas</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>Gateway de pagamentos</p>
              <p className="text-xs font-bold text-orange-600 mt-2">+{fmt(settings.webAsaasIntegration)}</p>
            </SelectCard>
          </div>
        )}

        {serviceType === 'BI' && (
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <label className="label">Fonte de dados <span className="normal-case font-normal" style={{ color: 'var(--kea-body)' }}>(múltipla seleção)</span></label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'excel',    icon: FileSpreadsheet, label: 'Excel'    },
                  { key: 'api',      icon: Plug,            label: 'API'      },
                  { key: 'database', icon: Database,        label: 'Database' },
                ] as { key: BISource; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
                  <SelectCard key={key} active={sources.has(key)} onClick={() => toggleSource(key)}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative">
                        <Icon size={20} className={ic(sources.has(key))} />
                        {sources.has(key) && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] font-black">✓</span>
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-sm">{label}</span>
                      <span className="text-xs" style={{ color: 'var(--kea-body)' }}>{fmt(BI_PRICES[key])}</span>
                    </div>
                  </SelectCard>
                ))}
              </div>
              {sources.size > 1 && (
                <p className="text-xs text-orange-600 mt-2">
                  {sources.size} fontes → base {fmt(Array.from(sources).reduce((s, k) => s + BI_PRICES[k], 0))}
                  {complexity === 'advanced' && ` × 1.3 = ${fmt(Array.from(sources).reduce((s, k) => s + BI_PRICES[k], 0) * 1.3)}`}
                </p>
              )}
            </div>
            <div>
              <label className="label">Complexidade</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'standard', icon: Gauge, label: 'Standard',      desc: 'Escopo convencional' },
                  { key: 'advanced', icon: Zap,   label: 'Advanced ×1.3', desc: 'Alta complexidade'   },
                ] as const).map(({ key, icon: Icon, label, desc }) => (
                  <SelectCard key={key} active={complexity === key} onClick={() => setComplexity(key)}>
                    <Icon size={18} className={`mb-1 ${ic(complexity === key)}`} />
                    <p className="font-bold">{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
                  </SelectCard>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Módulos */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Módulos Adicionais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { state: n8n,        set: setN8n,        icon: Workflow,      label: 'n8n Automation',   price: fmt(MODULE_PRICES.n8n),   desc: 'Automação de fluxos'  },
            { state: wpp,        set: setWpp,        icon: MessageCircle, label: 'WhatsApp Gateway', price: fmt(MODULE_PRICES.wpp),   desc: 'Canal de mensagens'   },
            { state: agileSetup, set: setAgileSetup, icon: Rocket,        label: 'Agile Setup',      price: fmt(MODULE_PRICES.agile), desc: 'Metodologia ágil'     },
          ]).map(({ state, set, icon: Icon, label, price, desc }) => (
            <SelectCard key={label} active={state} onClick={() => set(!state)}>
              <div className="flex items-start justify-between mb-2">
                <Icon size={20} className={ic(state)} />
                <Checkbox checked={state} />
              </div>
              <p className="font-bold text-sm">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
              <p className="text-xs font-bold text-orange-600 mt-2">{price}</p>
            </SelectCard>
          ))}
        </div>

        <div>
          <label className="label"><Clock size={13} className="inline mr-1.5 opacity-70" />Horas de Mentoria Ágil (+R$ 200/h)</label>
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={40} value={mentoringHours}
              onChange={(e) => setMentoringHours(Number(e.target.value))} className="flex-1 accent-orange-600" />
            <span className="font-black w-12 text-center" style={{ color: 'var(--kea-heading)' }}>{mentoringHours}h</span>
          </div>
          {mentoringHours > 0 && <p className="text-xs text-orange-600 mt-1">{mentoringHours}h × {fmt(MODULE_PRICES.mentoring)} = {fmt(mentoringHours * MODULE_PRICES.mentoring)}</p>}
        </div>

        {/* Hospedagem */}
        <div>
          <label className="label"><Server size={13} className="inline mr-1.5 opacity-70" />Plano de Hospedagem</label>

          <p className="text-[11px] uppercase tracking-wider mb-2 mt-1" style={{ color: 'var(--kea-subtle)' }}>Compartilhada</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {([
              { key: '',         icon: Ban,       label: 'Nenhum',   price: '—',             desc: 'Sem hospedagem'    },
              { key: 'single',   icon: HardDrive, label: 'Single',   price: fmt(settings.hostingSingle),   desc: '1 site · 10GB'    },
              { key: 'premium',  icon: HardDrive, label: 'Premium',  price: fmt(settings.hostingPremium),  desc: '5 sites · 20GB'   },
              { key: 'business', icon: HardDrive, label: 'Business', price: fmt(settings.hostingBusiness), desc: 'Ilimitado · 50GB' },
            ] as { key: HostingPlan | ''; icon: React.ElementType; label: string; price: string; desc: string }[]).map(({ key, icon: Icon, label, price, desc }) => (
              <SelectCard key={key} active={hosting === key} onClick={() => setHosting(key)}>
                <Icon size={16} className={`mb-1.5 ${ic(hosting === key)}`} />
                <p className="font-bold text-sm">{label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
                <p className="text-xs font-bold text-orange-600 mt-1.5">{price}</p>
              </SelectCard>
            ))}
          </div>

          <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--kea-subtle)' }}>VPS Escalável</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              { key: 'vps-starter', icon: Server, label: 'VPS Starter', price: fmt(settings.hostingVpsStarter), desc: '2 vCPU · 4GB · 80GB SSD'   },
              { key: 'vps-pro',     icon: Cpu,    label: 'VPS Pro',     price: fmt(settings.hostingVpsPro),     desc: '4 vCPU · 8GB · 160GB SSD'  },
              { key: 'vps-ultra',   icon: Zap,    label: 'VPS Ultra',   price: fmt(settings.hostingVpsUltra),   desc: '8 vCPU · 16GB · 320GB SSD' },
            ] as { key: HostingPlan; icon: React.ElementType; label: string; price: string; desc: string }[]).map(({ key, icon: Icon, label, price, desc }) => (
              <SelectCard key={key} active={hosting === key} onClick={() => setHosting(key)}>
                <div className="flex items-start justify-between mb-2">
                  <Icon size={18} className={ic(hosting === key)} />
                  {hosting === key && <span className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center"><span className="text-white text-[9px] font-black">✓</span></span>}
                </div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
                <p className="text-xs font-bold text-orange-600 mt-2">{price}</p>
              </SelectCard>
            ))}
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={loading} className="btn-primary w-full text-center text-lg">
        {loading ? 'Calculando...' : '⚡ Gerar Orçamento'}
      </button>

      {result && (
        <div className="card flex flex-col gap-4" style={{ borderColor: '#EA580C' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-black" style={{ color: 'var(--kea-heading)' }}>✅ Orçamento Gerado</h2>
            <button onClick={() => navigate('/')} className="btn-ghost text-sm">Ver Dashboard →</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="label">Setup</p><p className="text-2xl font-black" style={{ color: 'var(--kea-heading)' }}>{fmt(result.quote.pricing.setupValue)}</p></div>
            <div><p className="label">Mensalidade</p><p className="text-2xl font-black text-orange-600">{fmt(result.quote.pricing.monthlyValue)}</p></div>
          </div>
          <div>
            <p className="label">Breakdown</p>
            <div className="flex flex-col gap-1 mt-1">
              {Object.entries(result.quote.pricing.breakdown).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--kea-body)' }} className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{typeof v === 'number' ? fmt(v) : v}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setResult(result)} className="btn-ghost text-sm">Ver Payloads de Integração</button>
        </div>
      )}

      <PayloadModal payload={result} onClose={() => setResult(null)} />
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
      style={{ backgroundColor: checked ? '#EA580C' : 'transparent', borderColor: checked ? '#EA580C' : 'var(--kea-border)' }}>
      {checked && <span className="text-white text-[9px] leading-none font-black">✓</span>}
    </div>
  );
}
