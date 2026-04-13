import { useState, useEffect } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, BarChart2, FileSpreadsheet, Plug, Database, Gauge, Zap,
  Workflow, MessageCircle, Rocket, Clock, Server, HardDrive, Cpu,
  Instagram, Link, Bot, Sparkles, BrainCircuit, Building2, BookOpen, Mic,
} from 'lucide-react';
import { quotesApi, prospectsApi } from '../lib/api';
import type { CreateQuoteDTO, Quote, HostingPlan, BISource, MiniSitePricingInput, AIAgentPricingInput, AgentPlan, Prospect } from '../lib/api';
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

export function Builder() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState<Quote | null>(null);
  const [prospects, setProspects]           = useState<Prospect[]>([]);
  const [clientName, setClientName]         = useState('');
  const [clientEmail, setClientEmail]       = useState('');
  const [clientCpfCnpj, setClientCpfCnpj]   = useState('');
  const [clientPhone, setClientPhone]       = useState('');

  useEffect(() => {
    prospectsApi.list().then(r => setProspects(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);
  const [serviceType, setServiceType]       = useState<'WEB' | 'BI' | 'MINI_SITE' | 'AI_AGENT'>('WEB');
  const [includeWeb, setIncludeWeb]         = useState(true);
  const [includeMiniSite, setIncludeMiniSite] = useState(false);
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
  const [consultorArea, setConsultorArea]   = useState(false);
  const [pandaVideos, setPandaVideos]       = useState(false);
  const [bunneyNet, setBunneyNet]           = useState(false);
  const [mentoringHours, setMentoringHours] = useState(0);
  const [hostings, setHostings]             = useState<Set<HostingPlan>>(new Set());
  const [pandaPlan, setPandaPlan]           = useState<'starter' | 'pro' | 'scale' | ''>('');
  const [bunneyPlan, setBunneyPlan]         = useState<'pay-as-you-go' | 'starter' | 'pro' | ''>('');
  const [installments, setInstallments]     = useState(12);

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
    hosting: hostings.size > 0 ? Array.from(hostings)[0] as HostingPlan : undefined,
    consultorArea: consultorArea || undefined,
    pandaVideos: pandaVideos || undefined,
    bunneyNet: bunneyNet || undefined,
  });

  const MODULE_PRICES = {
    n8n: settings.moduleN8n,
    wpp: settings.moduleWhatsapp,
    agile: settings.moduleAgileSetup,
    mentoring: settings.moduleMentoringHour,
    consultorArea: 1200,
    pandaVideos: 300,
    bunneyNet: 200,
  };

  const PANDA_PLANS: Record<'starter' | 'pro' | 'scale', { label: string; storage: string; bandwidth: string; monthly: number; badge?: string }> = {
    starter: { label: 'Starter',  storage: '50GB',    bandwidth: '200GB/mês',  monthly: 97  },
    pro:     { label: 'Pro',      storage: '200GB',   bandwidth: '1TB/mês',    monthly: 197, badge: 'Popular' },
    scale:   { label: 'Scale',    storage: '1TB',     bandwidth: 'Ilimitada',  monthly: 397 },
  };

  const BUNNEY_PLANS: Record<'pay-as-you-go' | 'starter' | 'pro', { label: string; storage: string; bandwidth: string; monthly: number }> = {
    'pay-as-you-go': { label: 'Pay-as-you-go', storage: 'Ilimitado', bandwidth: 'R$ 0,08/GB',  monthly: 0   },
    starter:         { label: 'Starter',        storage: '100GB',     bandwidth: '500GB/mês',   monthly: 79  },
    pro:             { label: 'Pro',             storage: '500GB',     bandwidth: '2TB/mês',     monthly: 179 },
  };

  const toggleHosting = (key: HostingPlan) => {
    setHostings(prev => {
      const next = new Set<HostingPlan>(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleSource = (s: BISource) => {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { if (next.size > 1) next.delete(s); } else next.add(s);
      return next;
    });
  };

  const preview = (() => {
    let base = 0;
    if (serviceType === 'WEB' || serviceType === 'MINI_SITE') {
      if (includeWeb)
        base += settings.webBase + (menuCount > settings.webFreeMenus ? (menuCount - settings.webFreeMenus) * settings.webExtraMenuPrice : 0) + (includeAsaas ? settings.webAsaasIntegration : 0);
      if (includeMiniSite)
        base += settings.miniSiteBase + (pageCount > settings.miniSiteFreePages ? (pageCount - settings.miniSiteFreePages) * settings.miniSiteExtraPagePrice : 0) + (includeInstagram ? settings.miniSiteInstagram : 0) + (includeWppButton ? settings.miniSiteWhatsapp : 0);
    } else if (serviceType === 'AI_AGENT') {
      base = AGENT_PLANS[agentPlan].setup + Math.max(0, agentCount - 1) * settings.agentExtraAgentPrice + (includeRAG ? settings.agentRAG : 0) + (includeVoice ? settings.agentVoice : 0);
    } else {
      base = Array.from(sources).reduce((sum, s) => sum + BI_PRICES[s], 0) * (complexity === 'advanced' ? settings.biAdvancedMultiplier : 1);
    }
    let setup = base;
    if (n8n) setup += MODULE_PRICES.n8n;
    if (wpp) setup += MODULE_PRICES.wpp;
    if (agileSetup) setup += MODULE_PRICES.agile;
    if (consultorArea) setup += MODULE_PRICES.consultorArea;
    if (pandaVideos) setup += MODULE_PRICES.pandaVideos;
    if (bunneyNet) setup += MODULE_PRICES.bunneyNet;
    if (mentoringHours > 0) setup += mentoringHours * MODULE_PRICES.mentoring;
    const agentMonthly = serviceType === 'AI_AGENT' ? AGENT_PLANS[agentPlan].monthly : 0;
    const hostingMonthly = Array.from(hostings).reduce((sum, h) => sum + (HOSTING_PRICES[h] ?? 0), 0);
    const pandaMonthly   = pandaPlan   ? PANDA_PLANS[pandaPlan].monthly   : 0;
    const bunneyMonthly  = bunneyPlan  ? BUNNEY_PLANS[bunneyPlan].monthly  : 0;
    const monthly = setup * settings.monthlySupportRate + hostingMonthly + agentMonthly + pandaMonthly + bunneyMonthly;
    return { setup: parseFloat(setup.toFixed(2)), monthly: parseFloat(monthly.toFixed(2)) };
  })();

  const submit = async () => {
    if (!clientName.trim()) return alert('Informe o nome do cliente');
    const isWeb   = includeWeb;
    const isMini  = includeMiniSite;
    const isBI    = serviceType === 'BI';
    const isAgent = serviceType === 'AI_AGENT';
    if (!isWeb && !isMini && !isBI && !isAgent) return alert('Selecione ao menos um tipo de serviço');
    setLoading(true);
    const installmentPayload = {
      installments,
      interest_rate: settings.installmentInterestRate,
      installment_value: calcInstallment(preview.setup, installments),
    };
    try {
      const requests: Promise<unknown>[] = [];
      if (isWeb) {
        const dto: CreateQuoteDTO = {
          clientName, clientEmail: clientEmail || undefined, clientCpfCnpj: clientCpfCnpj || undefined,
          pricing: { serviceType: 'WEB', menuCount, includeAsaasIntegration: includeAsaas, modules: buildModules() },
          ...installmentPayload,
        };
        console.log('[KeaFlow] payload WEB:', JSON.stringify(dto, null, 2));
        requests.push(quotesApi.create(dto));
      }
      if (isMini) {
        const dto: CreateQuoteDTO = {
          clientName, clientEmail: clientEmail || undefined, clientCpfCnpj: clientCpfCnpj || undefined,
          pricing: { serviceType: 'MINI_SITE', pageCount, includeInstagram, includeWhatsappButton: includeWppButton, modules: buildModules() } as MiniSitePricingInput,
          ...installmentPayload,
        };
        console.log('[KeaFlow] payload MINI_SITE:', JSON.stringify(dto, null, 2));
        requests.push(quotesApi.create(dto));
      }
      if (isBI) {
        const dto: CreateQuoteDTO = {
          clientName, clientEmail: clientEmail || undefined, clientCpfCnpj: clientCpfCnpj || undefined,
          pricing: { serviceType: 'BI', sources: Array.from(sources) as BISource[], complexity, modules: buildModules() },
          ...installmentPayload,
        };
        console.log('[KeaFlow] payload BI:', JSON.stringify(dto, null, 2));
        requests.push(quotesApi.create(dto));
      }
      if (isAgent) {
        const dto: CreateQuoteDTO = {
          clientName, clientEmail: clientEmail || undefined, clientCpfCnpj: clientCpfCnpj || undefined,
          pricing: { serviceType: 'AI_AGENT', plan: agentPlan, agentCount, includeRAG, includeVoice, modules: buildModules() } as AIAgentPricingInput,
          ...installmentPayload,
        };
        console.log('[KeaFlow] payload AI_AGENT:', JSON.stringify(dto, null, 2));
        requests.push(quotesApi.create(dto));
      }
      const results = await Promise.all(requests);
      setResult((results[0] as { data: Quote }).data);
    } finally {
      setLoading(false);
    }
  };

  const ic = (on: boolean) => on ? 'text-orange-600' : 'text-orange-300 dark:text-brand-muted';

  // Tabela de taxas Asaas (cartão de crédito online)
  const ASAAS_FEE = 0.49;
  const asaasRate = (n: number) =>
    n === 1 ? 0.0299 : n <= 6 ? 0.0349 : n <= 12 ? 0.0399 : 0.0429;

  // Juros simples, 1ª parcela isenta de juros
  // P = (PV * (1 + i * (n-1))) / n + 0,49
  const calcInstallment = (total: number, n: number) => {
    const i = asaasRate(n);
    const base = n === 1 ? total * (1 + i) : (total * (1 + i * (n - 1))) / n;
    return parseFloat((base + ASAAS_FEE).toFixed(2));
  };

  const maxInstallments = settings.installmentLimit;

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

  const generatePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const O  = [234, 88, 12]  as const; // orange
    const D  = [20,  20,  20] as const; // dark
    const G  = [100, 100, 100] as const; // gray
    const L  = [248, 248, 248] as const; // light row
    const W  = [255, 255, 255] as const; // white
    const GR = [34, 197, 94]  as const; // green

    let y = 0;

    // ── helpers ──────────────────────────────────────────────────────────────
    const sectionTitle = (title: string) => {
      y += 8;
      doc.setFillColor(...O);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(...W);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), 17, y + 5);
      y += 11;
    };

    const row = (label: string, value: string, shade: boolean, bold = false) => {
      if (shade) { doc.setFillColor(...L); doc.rect(14, y - 4, 182, 8, 'F'); }
      doc.setTextColor(...G); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(label, 17, y);
      doc.setTextColor(...D); doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.text(value, 196, y, { align: 'right' });
      y += 8;
    };

    const badge = (text: string, x: number, by: number, bg: readonly [number,number,number]) => {
      doc.setFillColor(...bg);
      doc.roundedRect(x, by - 4, doc.getTextWidth(text) + 6, 6, 1, 1, 'F');
      doc.setTextColor(...W); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      doc.text(text, x + 3, by);
    };

    // ── HEADER ───────────────────────────────────────────────────────────────
    doc.setFillColor(...O);
    doc.rect(0, 0, 210, 36, 'F');
    doc.setFillColor(200, 70, 5);
    doc.rect(0, 28, 210, 8, 'F');
    doc.setTextColor(...W);
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('KeaLabs', 14, 18);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Proposta Comercial — KeaFlow', 14, 27);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }), 196, 27, { align: 'right' });
    doc.setFontSize(8); doc.setFont('helvetica', 'italic');
    doc.text('Este documento é uma proposta comercial gerada automaticamente pelo sistema KeaFlow.', 14, 33);
    y = 46;

    // ── CLIENTE ──────────────────────────────────────────────────────────────
    sectionTitle('Dados do Cliente');
    [
      ['Cliente',   clientName    || '—'],
      ['E-mail',    clientEmail   || '—'],
      ['CPF/CNPJ',  clientCpfCnpj || '—'],
      ['Telefone',  clientPhone   || '—'],
    ].forEach(([l, v], i) => row(l, v, i % 2 === 0));

    // ── SERVIÇOS ─────────────────────────────────────────────────────────────
    if (includeWeb) {
      sectionTitle('Site Web');
      row('Base do projeto', fmt(settings.webBase), false);
      row('Menus / Seções', `${menuCount} menus`, true);
      if (menuCount > settings.webFreeMenus)
        row('  Menus extras', `${menuCount - settings.webFreeMenus} × ${fmt(settings.webExtraMenuPrice)} = ${fmt((menuCount - settings.webFreeMenus) * settings.webExtraMenuPrice)}`, false);
      row('Integração Asaas (gateway)', includeAsaas ? fmt(settings.webAsaasIntegration) : 'Não incluído', true);
      const webTotal = settings.webBase
        + (menuCount > settings.webFreeMenus ? (menuCount - settings.webFreeMenus) * settings.webExtraMenuPrice : 0)
        + (includeAsaas ? settings.webAsaasIntegration : 0);
      doc.setFillColor(255, 241, 230);
      doc.rect(14, y - 2, 182, 8, 'F');
      doc.setTextColor(...O); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Subtotal Site Web', 17, y + 4);
      doc.text(fmt(webTotal), 196, y + 4, { align: 'right' });
      y += 12;
    }

    if (includeMiniSite) {
      sectionTitle('Mini Site');
      row('Base do projeto', fmt(settings.miniSiteBase), false);
      row('Páginas', `${pageCount} páginas`, true);
      if (pageCount > settings.miniSiteFreePages)
        row('  Páginas extras', `${pageCount - settings.miniSiteFreePages} × ${fmt(settings.miniSiteExtraPagePrice)} = ${fmt((pageCount - settings.miniSiteFreePages) * settings.miniSiteExtraPagePrice)}`, false);
      row('Integração Instagram', includeInstagram ? fmt(settings.miniSiteInstagram) : 'Não incluído', true);
      row('Botão WhatsApp', includeWppButton ? fmt(settings.miniSiteWhatsapp) : 'Não incluído', false);
      const miniTotal = settings.miniSiteBase
        + (pageCount > settings.miniSiteFreePages ? (pageCount - settings.miniSiteFreePages) * settings.miniSiteExtraPagePrice : 0)
        + (includeInstagram ? settings.miniSiteInstagram : 0)
        + (includeWppButton ? settings.miniSiteWhatsapp : 0);
      doc.setFillColor(255, 241, 230);
      doc.rect(14, y - 2, 182, 8, 'F');
      doc.setTextColor(...O); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Subtotal Mini Site', 17, y + 4);
      doc.text(fmt(miniTotal), 196, y + 4, { align: 'right' });
      y += 12;
    }

    if (serviceType === 'BI') {
      sectionTitle('Business Intelligence');
      Array.from(sources).forEach((s, i) => row(`Fonte: ${s.toUpperCase()}`, fmt(BI_PRICES[s]), i % 2 === 0));
      row('Complexidade', complexity === 'advanced' ? 'Advanced ×1.3' : 'Standard', true);
      const biTotal = Array.from(sources).reduce((sum, s) => sum + BI_PRICES[s], 0) * (complexity === 'advanced' ? settings.biAdvancedMultiplier : 1);
      doc.setFillColor(255, 241, 230);
      doc.rect(14, y - 2, 182, 8, 'F');
      doc.setTextColor(...O); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Subtotal BI', 17, y + 4);
      doc.text(fmt(biTotal), 196, y + 4, { align: 'right' });
      y += 12;
    }

    if (serviceType === 'AI_AGENT') {
      sectionTitle('AI Agent');
      const plan = AGENT_PLANS[agentPlan];
      row('Plano', agentPlan.charAt(0).toUpperCase() + agentPlan.slice(1), false);
      row('Modelo de IA', plan.model, true);
      row('Agentes', `${agentCount} agente(s)`, false);
      row('Volume de mensagens', plan.msgs, true);
      row('Memória', plan.memory, false);
      if (agentCount > 1) row('Agentes extras', `${agentCount - 1} × ${fmt(settings.agentExtraAgentPrice)} = ${fmt((agentCount - 1) * settings.agentExtraAgentPrice)}`, true);
      row('Base de Conhecimento (RAG)', includeRAG ? fmt(settings.agentRAG) : 'Não incluído', false);
      row('Canal de Voz', includeVoice ? fmt(settings.agentVoice) : 'Não incluído', true);
      row('Mensalidade do plano', fmt(plan.monthly), false);
      const agentTotal = plan.setup + Math.max(0, agentCount - 1) * settings.agentExtraAgentPrice + (includeRAG ? settings.agentRAG : 0) + (includeVoice ? settings.agentVoice : 0);
      doc.setFillColor(255, 241, 230);
      doc.rect(14, y - 2, 182, 8, 'F');
      doc.setTextColor(...O); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('Subtotal AI Agent', 17, y + 4);
      doc.text(fmt(agentTotal), 196, y + 4, { align: 'right' });
      y += 12;
    }

    // ── MÓDULOS ───────────────────────────────────────────────────────────────
    const hasMods = n8n || wpp || agileSetup || consultorArea || pandaVideos || bunneyNet || mentoringHours > 0;
    if (hasMods) {
      sectionTitle('Módulos Adicionais');
      if (n8n)              row('n8n Automation',              fmt(MODULE_PRICES.n8n),                                    false);
      if (wpp)              row('WhatsApp Gateway',             fmt(MODULE_PRICES.wpp),                                    true);
      if (agileSetup)       row('Agile Setup',                  fmt(MODULE_PRICES.agile),                                  false);
      if (consultorArea)    row('Consultor / Área do Aluno',    fmt(MODULE_PRICES.consultorArea),                          true);
      if (pandaVideos)      row('Panda Videos',                 fmt(MODULE_PRICES.pandaVideos),                            false);
      if (bunneyNet)        row('Bunny.net (CDN de Vídeo)',     fmt(MODULE_PRICES.bunneyNet),                              true);
      if (mentoringHours>0) row(`Mentoria Ágil (${mentoringHours}h)`, fmt(mentoringHours * MODULE_PRICES.mentoring),   false);
    }

    // ── HOSPEDAGEM ────────────────────────────────────────────────────────────
    if (hostings.size > 0) {
      const hostingLabels: Record<string, { label: string; spec: string; type: string }> = {
        'single':      { label: 'Single',      spec: '1 site · 10GB SSD · 100GB banda',  type: 'Compartilhada' },
        'premium':     { label: 'Premium',     spec: '5 sites · 20GB SSD · 200GB banda', type: 'Compartilhada' },
        'business':    { label: 'Business',    spec: 'Sites ilimitados · 50GB SSD',       type: 'Compartilhada' },
        'vps-starter': { label: 'VPS Starter', spec: '2 vCPU · 4GB RAM · 80GB SSD',     type: 'VPS' },
        'vps-pro':     { label: 'VPS Pro',     spec: '4 vCPU · 8GB RAM · 160GB SSD',    type: 'VPS' },
        'vps-ultra':   { label: 'VPS Ultra',   spec: '8 vCPU · 16GB RAM · 320GB SSD',   type: 'VPS' },
      };
      sectionTitle('Planos de Hospedagem');
      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(...O); doc.setLineWidth(0.4);
      doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');
      doc.setTextColor(...O); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text('⚠  Serviços a serem contratados diretamente pelo cliente na Hostinger (hostinger.com.br)', 18, y + 9);
      y += 19;
      Array.from(hostings).forEach((h, i) => {
        const hl = hostingLabels[h];
        row(`${hl.label} (${hl.type})`, fmt(HOSTING_PRICES[h]) + '/mês', i % 2 === 0);
      });
      badge('RECOMENDADO PELA KEALABS', 17, y - 2, GR);
      y += 4;
    }

    // ── PANDA VIDEOS ─────────────────────────────────────────────────────────
    if (pandaPlan) {
      const pp = PANDA_PLANS[pandaPlan];
      sectionTitle('Panda Videos');
      row('Plano', pp.label, false);
      row('Armazenamento', pp.storage, true);
      row('Banda', pp.bandwidth, false);
      row('Mensalidade', fmt(pp.monthly) + '/mês', true, true);
    }

    // ── BUNNY.NET ─────────────────────────────────────────────────────────────
    if (bunneyPlan) {
      const bp = BUNNEY_PLANS[bunneyPlan];
      sectionTitle('Bunny.net CDN');
      row('Plano', bp.label, false);
      row('Armazenamento', bp.storage, true);
      row('Banda', bp.bandwidth, false);
      row('Mensalidade', bp.monthly > 0 ? fmt(bp.monthly) + '/mês' : 'Sob demanda', true, true);
    }

    // ── RESUMO FINANCEIRO ─────────────────────────────────────────────────────
    y += 4;
    doc.setFillColor(...O);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(...W); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('RESUMO FINANCEIRO', 17, y + 5.5);
    y += 12;

    doc.setFillColor(...O);
    doc.roundedRect(14, y, 87, 22, 2, 2, 'F');
    doc.setTextColor(...W); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('INVESTIMENTO INICIAL (SETUP)', 57, y + 7, { align: 'center' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(fmt(preview.setup), 57, y + 17, { align: 'center' });

    doc.setFillColor(...D);
    doc.roundedRect(109, y, 87, 22, 2, 2, 'F');
    doc.setTextColor(...W); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('PARCELAMENTO DO SETUP', 152, y + 7, { align: 'center' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`${installments} × ${fmt(calcInstallment(preview.setup, installments))}`, 152, y + 17, { align: 'center' });
    y += 28;

    // nota suporte
    doc.setTextColor(...G); doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5);
    const totalParc = calcInstallment(preview.setup, installments) * installments;
    const jurosInfo = ` com ${(asaasRate(installments) * 100).toFixed(2)}% a.m. + R$ 0,49 Asaas/parcela (total ${fmt(totalParc)})`;
    const hostingMonthlyPDF = Array.from(hostings).reduce((sum, h) => sum + (HOSTING_PRICES[h] ?? 0), 0);
    const pandaMonthlyPDF   = pandaPlan  ? PANDA_PLANS[pandaPlan].monthly  : 0;
    const bunneyMonthlyPDF  = bunneyPlan ? BUNNEY_PLANS[bunneyPlan].monthly : 0;
    const totalMonthlyPDF   = preview.monthly;
    doc.text(`* Setup de ${fmt(preview.setup)} parcelado em ${installments}x de ${fmt(calcInstallment(preview.setup, installments))}${jurosInfo}. Mensalidade total: ${fmt(totalMonthlyPDF)}${hostingMonthlyPDF > 0 ? ` (incl. hospedagem ${fmt(hostingMonthlyPDF)}/mês)` : ''}${pandaMonthlyPDF > 0 ? ` + Panda ${fmt(pandaMonthlyPDF)}/mês` : ''}${bunneyMonthlyPDF > 0 ? ` + Bunny ${fmt(bunneyMonthlyPDF)}/mês` : ''}.`, 14, y);
    y += 6;
    if (hostings.size > 0) {
      doc.text('* O valor da hospedagem é uma estimativa. O cliente contrata diretamente na Hostinger e pode variar conforme promoções.', 14, y);
      y += 5;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.setFillColor(...O);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(...W); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('KeaLabs — kealabs.cloud — Tecnologia que transforma negócios', 14, 292);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 196, 292, { align: 'right' });

    doc.save(`proposta-${clientName.replace(/\s+/g, '-').toLowerCase() || 'kealabs'}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Título */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Novo Orçamento</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>Preencha o escopo para calcular e gerar os payloads</p>
      </div>

      {/* Preview */}
      <div className="rounded-3xl p-6 flex flex-col gap-4"
        style={{ background: 'linear-gradient(to right, #FFF1E6, #FFF7F3)', border: '1px solid #FED7AA' }}>
        <div className="flex justify-between items-center">
          <div>
            <p className="label">Setup estimado</p>
            <p className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>{fmt(preview.setup)}</p>
          </div>
          <div className="text-right">
            <p className="label">Parcelamento do Setup</p>
            <p className="text-3xl font-black text-orange-600">
              {installments} × {fmt(calcInstallment(preview.setup, installments))}
            </p>
            {installments > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>
                {(asaasRate(installments) * 100).toFixed(2)}% a.m. + R$ 0,49/parcela • total {fmt(calcInstallment(preview.setup, installments) * installments)}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="label">Número de parcelas</label>
          <div className="flex items-center gap-4">
            <input type="range" min={1} max={maxInstallments} value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))} className="flex-1 accent-orange-600" />
            <span className="font-black w-8 text-center" style={{ color: 'var(--kea-heading)' }}>{installments}×</span>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Cliente</h2>
        {prospects.length > 0 && (
          <div>
            <label className="label">Selecionar Prospect</label>
            <select className="input" defaultValue=""
              onChange={e => {
                const p = prospects.find(x => x.id === e.target.value);
                if (!p) return;
                setClientName(p.name);
                setClientEmail(p.email ?? '');
                setClientCpfCnpj(p.cpf_cnpj ?? '');
                setClientPhone(p.phone ? maskPhone(p.phone) : '');
              }}>
              <option value="">— selecione um prospect —</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.company ? ` · ${p.company}` : ''}</option>
              ))}
            </select>
          </div>
        )}
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
            { type: 'WEB',       icon: Globe,    label: 'Web',                   desc: 'Sites e plataformas web',              multi: true  },
            { type: 'MINI_SITE', icon: Instagram, label: 'Mini Site',             desc: 'Site + Instagram integrado',           multi: true  },
            { type: 'BI',        icon: BarChart2, label: 'Business Intelligence', desc: 'Dashboards e análise de dados',       multi: false },
            { type: 'AI_AGENT',  icon: Bot,       label: 'AI Agent',              desc: 'Agentes com inteligência artificial',  multi: false },
          ] as const).map(({ type, icon: Icon, label, desc, multi }) => {
            const isActive = type === 'WEB' ? includeWeb
              : type === 'MINI_SITE' ? includeMiniSite
              : serviceType === type;
            const toggle = () => {
              if (type === 'WEB') {
                setIncludeWeb((v) => !v);
                if (!includeWeb) setServiceType('WEB');
              } else if (type === 'MINI_SITE') {
                setIncludeMiniSite((v) => !v);
                if (!includeMiniSite) setServiceType('WEB');
              } else {
                setServiceType(type);
                setIncludeWeb(false);
                setIncludeMiniSite(false);
              }
            };
            return (
              <SelectCard key={type} active={isActive} onClick={toggle}>
                <div className="flex items-start justify-between mb-2">
                  <Icon size={22} className={ic(isActive)} />
                  {multi && <Checkbox checked={isActive} />}
                </div>
                <p className="font-black text-base">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
              </SelectCard>
            );
          })}
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

        {(serviceType === 'WEB' || serviceType === 'MINI_SITE') && includeMiniSite && (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kea-subtle)' }}>Mini Site</p>
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

        {(serviceType === 'WEB' || serviceType === 'MINI_SITE') && includeWeb && (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kea-subtle)' }}>Site Web</p>
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
            { state: n8n,          set: setN8n,          icon: Workflow,      label: 'n8n Automation',          price: fmt(MODULE_PRICES.n8n),          desc: 'Automação de fluxos'              },
            { state: wpp,          set: setWpp,          icon: MessageCircle, label: 'WhatsApp Gateway',         price: fmt(MODULE_PRICES.wpp),          desc: 'Canal de mensagens'               },
            { state: agileSetup,   set: setAgileSetup,   icon: Rocket,        label: 'Agile Setup',             price: fmt(MODULE_PRICES.agile),        desc: 'Metodologia ágil'                 },
            { state: consultorArea,set: setConsultorArea,icon: BookOpen,      label: 'Consultor / Área do Aluno',price: fmt(MODULE_PRICES.consultorArea),desc: 'Portal de cursos e área de membros'},
            { state: pandaVideos,  set: setPandaVideos,  icon: Sparkles,      label: 'Panda Videos',            price: fmt(MODULE_PRICES.pandaVideos),  desc: 'Hospedagem de vídeos Panda'       },
            { state: bunneyNet,    set: setBunneyNet,    icon: Server,        label: 'Bunny.net',               price: fmt(MODULE_PRICES.bunneyNet),    desc: 'CDN de vídeo Bunny.net'           },
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
          <label className="label"><Server size={13} className="inline mr-1.5 opacity-70" />Plano de Hospedagem <span className="normal-case font-normal" style={{ color: 'var(--kea-body)' }}>(múltipla seleção)</span></label>

          <p className="text-[11px] uppercase tracking-wider mb-2 mt-1" style={{ color: 'var(--kea-subtle)' }}>Compartilhada</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {([
              { key: 'single',   icon: HardDrive, label: 'Single',   price: fmt(settings.hostingSingle),   desc: '1 site · 10GB'    },
              { key: 'premium',  icon: HardDrive, label: 'Premium',  price: fmt(settings.hostingPremium),  desc: '5 sites · 20GB'   },
              { key: 'business', icon: HardDrive, label: 'Business', price: fmt(settings.hostingBusiness), desc: 'Ilimitado · 50GB' },
            ] as { key: HostingPlan; icon: React.ElementType; label: string; price: string; desc: string }[]).map(({ key, icon: Icon, label, price, desc }) => {
              const active = hostings.has(key);
              return (
                <SelectCard key={key} active={active} onClick={() => toggleHosting(key)}>
                  <div className="flex items-start justify-between mb-1.5">
                    <Icon size={16} className={ic(active)} />
                    <Checkbox checked={active} />
                  </div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
                  <p className="text-xs font-bold text-orange-600 mt-1.5">{price}/mês</p>
                </SelectCard>
              );
            })}
          </div>

          <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--kea-subtle)' }}>VPS Escalável</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {([
              { key: 'vps-starter', icon: Server, label: 'VPS Starter', price: fmt(settings.hostingVpsStarter), desc: '2 vCPU · 4GB · 80GB SSD'   },
              { key: 'vps-pro',     icon: Cpu,    label: 'VPS Pro',     price: fmt(settings.hostingVpsPro),     desc: '4 vCPU · 8GB · 160GB SSD'  },
              { key: 'vps-ultra',   icon: Zap,    label: 'VPS Ultra',   price: fmt(settings.hostingVpsUltra),   desc: '8 vCPU · 16GB · 320GB SSD' },
            ] as { key: HostingPlan; icon: React.ElementType; label: string; price: string; desc: string }[]).map(({ key, icon: Icon, label, price, desc }) => {
              const active = hostings.has(key);
              return (
                <SelectCard key={key} active={active} onClick={() => toggleHosting(key)}>
                  <div className="flex items-start justify-between mb-2">
                    <Icon size={18} className={ic(active)} />
                    <Checkbox checked={active} />
                  </div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--kea-body)' }}>{desc}</p>
                  <p className="text-xs font-bold text-orange-600 mt-2">{price}/mês</p>
                </SelectCard>
              );
            })}
          </div>
        </div>

        {/* Panda Videos — planos mensais */}
        {pandaVideos && (
          <div>
            <label className="label"><Sparkles size={13} className="inline mr-1.5 opacity-70" />Plano Panda Videos</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(Object.entries(PANDA_PLANS) as [keyof typeof PANDA_PLANS, typeof PANDA_PLANS[keyof typeof PANDA_PLANS]][]).map(([key, plan]) => {
                const active = pandaPlan === key;
                return (
                  <button key={key} onClick={() => setPandaPlan(active ? '' : key)}
                    className="p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-orange-500 relative"
                    style={cardStyle(active)}>
                    {plan.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: '#EA580C', color: '#fff' }}>{plan.badge}</span>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <Sparkles size={16} className={ic(active)} />
                      <Checkbox checked={active} />
                    </div>
                    <p className="font-black text-sm">{plan.label}</p>
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      {[{ l: 'Storage', v: plan.storage }, { l: 'Banda', v: plan.bandwidth }].map(({ l, v }) => (
                        <div key={l} className="flex justify-between text-[11px]">
                          <span style={{ color: 'var(--kea-subtle)' }}>{l}</span>
                          <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-black text-orange-600 mt-2">{fmt(plan.monthly)}/mês</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bunny.net — planos mensais */}
        {bunneyNet && (
          <div>
            <label className="label"><Server size={13} className="inline mr-1.5 opacity-70" />Plano Bunny.net CDN</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(Object.entries(BUNNEY_PLANS) as [keyof typeof BUNNEY_PLANS, typeof BUNNEY_PLANS[keyof typeof BUNNEY_PLANS]][]).map(([key, plan]) => {
                const active = bunneyPlan === key;
                return (
                  <button key={key} onClick={() => setBunneyPlan(active ? '' : key)}
                    className="p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-orange-500"
                    style={cardStyle(active)}>
                    <div className="flex items-start justify-between mb-2">
                      <Server size={16} className={ic(active)} />
                      <Checkbox checked={active} />
                    </div>
                    <p className="font-black text-sm">{plan.label}</p>
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      {[{ l: 'Storage', v: plan.storage }, { l: 'Banda', v: plan.bandwidth }].map(({ l, v }) => (
                        <div key={l} className="flex justify-between text-[11px]">
                          <span style={{ color: 'var(--kea-subtle)' }}>{l}</span>
                          <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-black text-orange-600 mt-2">{plan.monthly > 0 ? `${fmt(plan.monthly)}/mês` : 'Sob demanda'}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={submit} disabled={loading} className="btn-primary flex-1 text-center text-lg">
          {loading ? 'Salvando...' : '⚡ Gerar Orçamento'}
        </button>
        <button onClick={generatePDF} disabled={!clientName.trim()}
          className="btn-ghost flex items-center gap-2 px-5 text-sm font-bold disabled:opacity-40">
          📄 Baixar PDF
        </button>
      </div>

      {result && (
        <div className="card flex flex-col gap-4" style={{ borderColor: '#EA580C' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-black" style={{ color: 'var(--kea-heading)' }}>✅ Orçamento Salvo</h2>
            <button onClick={() => navigate('/')} className="btn-ghost text-sm">Ver Dashboard →</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="label">Setup</p><p className="text-2xl font-black" style={{ color: 'var(--kea-heading)' }}>{fmt(result.setup_value)}</p></div>
            <div>
              <p className="label">Parcelamento do Setup</p>
              <p className="text-2xl font-black text-orange-600">
                {installments} × {fmt(calcInstallment(result.setup_value, installments))}
              </p>
              {installments > 0 && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>
                  {(asaasRate(installments) * 100).toFixed(2)}% a.m. + R$ 0,49/parcela • total {fmt(calcInstallment(result.setup_value, installments) * installments)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


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
