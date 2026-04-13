import { useSettings } from '../lib/useSettings';
import { useAgentProfile, TONE_LABELS } from '../lib/useAgentProfile';
import type { AgentProfileLocal } from '../lib/useAgentProfile';
import { RotateCcw, Save, Bot } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

export function Settings() {
  const { settings, update, reset } = useSettings();
  const { profile, update: updateProfile, reset: resetProfile } = useAgentProfile();
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'pricing' | 'agent'>('pricing');

  // ── Pricing helpers ──────────────────────────────────────────────────────────
  const field = (
    label: string,
    key: keyof typeof settings,
    opts: { prefix?: string; suffix?: string; step?: number; min?: number; toDisplay?: (v: number) => number; fromInput?: (v: number) => number } = {}
  ) => (
    <div key={key} className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        {opts.prefix && <span className="text-sm font-bold" style={{ color: 'var(--kea-subtle)' }}>{opts.prefix}</span>}
        <input type="number" step={opts.step ?? 1} min={opts.min ?? 0} className="input"
          value={opts.toDisplay ? opts.toDisplay(settings[key] as number) : settings[key] as number}
          onChange={(e) => {
            const raw = parseFloat(e.target.value) || 0;
            update({ [key]: opts.fromInput ? opts.fromInput(raw) : raw });
          }} />
        {opts.suffix && <span className="text-sm font-bold" style={{ color: 'var(--kea-subtle)' }}>{opts.suffix}</span>}
      </div>
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div className="card flex flex-col gap-4">
      <h2 className="font-black text-base" style={{ color: 'var(--kea-heading)' }}>{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );

  // ── Agent helpers ────────────────────────────────────────────────────────────
  const textField = (label: string, key: keyof AgentProfileLocal, placeholder = '') => (
    <div key={key} className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <input className="input" placeholder={placeholder}
        value={profile[key] as string}
        onChange={(e) => updateProfile({ [key]: e.target.value })} />
    </div>
  );

  const textArea = (label: string, key: keyof AgentProfileLocal, placeholder = '') => (
    <div key={key} className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <textarea rows={3} className="input resize-none" placeholder={placeholder}
        value={profile[key] as string}
        onChange={(e) => updateProfile({ [key]: e.target.value })} />
    </div>
  );

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Configurações</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>
            Parametrize preços e configure o perfil do agente comercial.
          </p>
        </div>
        <button onClick={() => { reset(); resetProfile(); setSaved(false); }}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RotateCcw size={14} /> Restaurar padrões
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl"
        style={{ backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)' }}>
        {([['pricing', '💰 Precificação'], ['agent', '🤖 Perfil do Agente']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === key ? { backgroundColor: '#EA580C', color: '#fff' } : { color: 'var(--kea-body)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: PRICING ── */}
      {tab === 'pricing' && (
        <>
          {section('🌐 Site Web', <>
            {field('Base (setup)', 'webBase', { prefix: 'R$' })}
            {field('Menus incluídos', 'webFreeMenus', { suffix: 'menus' })}
            {field('Preço por menu extra', 'webExtraMenuPrice', { prefix: 'R$' })}
            {field('Integração Asaas', 'webAsaasIntegration', { prefix: 'R$' })}
          </>)}

          {section('📸 Mini Site', <>
            {field('Base (setup)', 'miniSiteBase', { prefix: 'R$' })}
            {field('Páginas incluídas', 'miniSiteFreePages', { suffix: 'páginas' })}
            {field('Preço por página extra', 'miniSiteExtraPagePrice', { prefix: 'R$' })}
            {field('Integração Instagram', 'miniSiteInstagram', { prefix: 'R$' })}
            {field('Botão WhatsApp', 'miniSiteWhatsapp', { prefix: 'R$' })}
          </>)}

          {section('📊 Business Intelligence', <>
            {field('Fonte Excel', 'biExcel', { prefix: 'R$' })}
            {field('Fonte API', 'biApi', { prefix: 'R$' })}
            {field('Fonte Database', 'biDatabase', { prefix: 'R$' })}
            {field('Multiplicador Advanced', 'biAdvancedMultiplier', { step: 0.05, min: 1, suffix: '×' })}
          </>)}

          {section('🤖 AI Agent — Planos', <>
            {field('Free · Setup', 'agentFreeSetup', { prefix: 'R$' })}
            {field('Free · Mensalidade', 'agentFreeMonthly', { prefix: 'R$' })}
            {field('Starter · Setup', 'agentStarterSetup', { prefix: 'R$' })}
            {field('Starter · Mensalidade', 'agentStarterMonthly', { prefix: 'R$' })}
            {field('Pro · Setup', 'agentProSetup', { prefix: 'R$' })}
            {field('Pro · Mensalidade', 'agentProMonthly', { prefix: 'R$' })}
            {field('Enterprise · Setup', 'agentEnterpriseSetup', { prefix: 'R$' })}
            {field('Enterprise · Mensalidade', 'agentEnterpriseMonthly', { prefix: 'R$' })}
            {field('Agente extra', 'agentExtraAgentPrice', { prefix: 'R$' })}
            {field('Add-on RAG', 'agentRAG', { prefix: 'R$' })}
            {field('Add-on Voz', 'agentVoice', { prefix: 'R$' })}
          </>)}

          {section('🧩 Módulos Adicionais', <>
            {field('n8n Automation', 'moduleN8n', { prefix: 'R$' })}
            {field('WhatsApp Gateway', 'moduleWhatsapp', { prefix: 'R$' })}
            {field('Agile Setup', 'moduleAgileSetup', { prefix: 'R$' })}
            {field('Mentoria Ágil (por hora)', 'moduleMentoringHour', { prefix: 'R$' })}
            {field('Suporte mensal (% do setup)', 'monthlySupportRate', { step: 0.01, min: 0, suffix: '%' })}
          </>)}

          {section('💳 Parcelamento', <>
            {field('Limite de parcelas', 'installmentLimit', { suffix: 'x', min: 1 })}
            {field('MDR 1x', 'installmentMdr1x', { step: 0.01, min: 0, suffix: '%',
              toDisplay: (v) => v, fromInput: (v) => v })}
            {field('MDR 2–6x', 'installmentMdr2_6x', { step: 0.01, min: 0, suffix: '%',
              toDisplay: (v) => v, fromInput: (v) => v })}
            {field('MDR 7–12x', 'installmentMdr7_12x', { step: 0.01, min: 0, suffix: '%',
              toDisplay: (v) => v, fromInput: (v) => v })}
            {field('MDR 13x+', 'installmentMdr13x', { step: 0.01, min: 0, suffix: '%',
              toDisplay: (v) => v, fromInput: (v) => v })}
            {field('Taxa fixa por transação', 'installmentTaxaFixa', { prefix: 'R$', step: 0.01, min: 0 })}
            {field('Taxa antecipação mensal', 'installmentAntecipacaoMensal', { step: 0.01, min: 0, suffix: '% a.m.',
              toDisplay: (v) => v, fromInput: (v) => v })}
            {field('Ciclo de dias', 'installmentCicloDias', { suffix: 'dias', min: 1 })}
          </>)}

          {section('💼 Comissão', <>
            {field('Taxa de comissão', 'commissionRate', { step: 0.5, min: 0, suffix: '%',
              toDisplay: (v) => v, fromInput: (v) => v })}
          </>)}

          {section('🖥️ Hospedagem — Mensalidade', <>
            {field('Single', 'hostingSingle', { prefix: 'R$', step: 0.01 })}
            {field('Premium', 'hostingPremium', { prefix: 'R$', step: 0.01 })}
            {field('Business', 'hostingBusiness', { prefix: 'R$', step: 0.01 })}
            {field('VPS Starter', 'hostingVpsStarter', { prefix: 'R$', step: 0.01 })}
            {field('VPS Pro', 'hostingVpsPro', { prefix: 'R$', step: 0.01 })}
            {field('VPS Ultra', 'hostingVpsUltra', { prefix: 'R$', step: 0.01 })}
          </>)}
        </>
      )}

      {/* ── TAB: AGENT PROFILE ── */}
      {tab === 'agent' && (
        <div className="card flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot size={18} className="text-orange-600" />
              <h2 className="font-black text-base" style={{ color: 'var(--kea-heading)' }}>
                Perfil do Agente Comercial
              </h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--kea-body)' }}>
              Define como o agente se comporta no Chat. Estas configurações montam o system prompt enviado ao Gemini a cada conversa.
            </p>
          </div>

          {/* Identidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {textField('Nome do Agente', 'name', 'Ex: Kea')}
            {textField('Empresa', 'company', 'Ex: KeaLabs')}
            {textField('Cargo / Função', 'role', 'Ex: Consultora Comercial')}
          </div>

          {/* Tom */}
          <div>
            <label className="label">Tom de Comunicação</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              {(Object.entries(TONE_LABELS) as [typeof profile.tone, string][]).map(([key, label]) => (
                <button key={key} onClick={() => updateProfile({ tone: key })}
                  className="p-3 rounded-xl border-2 text-left text-sm transition-all hover:border-orange-500"
                  style={{
                    backgroundColor: profile.tone === key ? '#FFF1E6' : 'var(--kea-surface)',
                    borderColor: profile.tone === key ? '#EA580C' : 'var(--kea-border)',
                    color: 'var(--kea-heading)',
                  }}>
                  <span className="font-bold capitalize">{key}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--kea-body)' }}>
                    {label.split(' — ')[1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comportamento */}
          <div className="flex flex-col gap-4">
            {textArea('Serviços que o agente pode oferecer', 'services',
              'Ex: Sites Web, Mini Sites com Instagram, BI, AI Agents')}
            {textArea('Como lidar com objeções', 'objections',
              'Ex: Reconheça a objeção, valide a preocupação e reposicione o valor antes do preço.')}
            {textArea('Estilo de fechamento', 'closingStyle',
              'Ex: Proponha um próximo passo concreto: call, proposta ou projeto piloto.')}
            {textArea('Instruções adicionais (opcional)', 'systemPrompt',
              'Qualquer regra extra que o agente deve seguir...')}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          {saved ? '✅ Salvo!' : 'Salvar configurações'}
        </button>
        <p className="text-xs" style={{ color: 'var(--kea-subtle)' }}>
          Alterações aplicadas imediatamente
        </p>
      </div>
    </div>
  );
}
