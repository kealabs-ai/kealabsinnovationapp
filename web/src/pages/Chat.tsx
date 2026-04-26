import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Plus, MessageSquare, ChevronDown, PanelLeftClose, PanelLeftOpen, Globe, BarChart2, BrainCircuit, Headphones, Server, MessageCircle } from 'lucide-react';
import { chatApi } from '../lib/api';
import type { ChatMessage, ChatSession } from '../lib/api';
import { useAgentProfile } from '../lib/useAgentProfile';
import { useSettings } from '../lib/useSettings';

const SESSION_KEY = 'keaflow-chat-session-id';

const LLM_MODELS: { value: string; label: string; provider: string }[] = [
  // Google Gemini
  { value: 'gemini-2.0-flash',              label: 'Gemini 2.0 Flash',        provider: 'Google Gemini' },
  { value: 'gemini-2.0-flash-lite',         label: 'Gemini 2.0 Flash Lite',   provider: 'Google Gemini' },
  { value: 'gemini-1.5-flash',                 label: 'Gemini 1.5 Flash',           provider: 'Google Gemini' },
  { value: 'gemini-1.5-flash-8b',              label: 'Gemini 1.5 Flash 8B',        provider: 'Google Gemini' },
  { value: 'gemini-1.5-pro',                   label: 'Gemini 1.5 Pro',             provider: 'Google Gemini' },
  // OpenAI
  { value: 'gpt-4o-mini',                        label: 'GPT-4o Mini',                provider: 'OpenAI'        },
  { value: 'gpt-4o',                             label: 'GPT-4o',                     provider: 'OpenAI'        },
  { value: 'gpt-4-turbo',                        label: 'GPT-4 Turbo',                provider: 'OpenAI'        },
  { value: 'gpt-3.5-turbo',                      label: 'GPT-3.5 Turbo',              provider: 'OpenAI'        },
  // Anthropic
  { value: 'claude-3-5-sonnet-latest',           label: 'Claude 3.5 Sonnet',          provider: 'Anthropic'     },
  { value: 'claude-3-5-haiku-latest',            label: 'Claude 3.5 Haiku',           provider: 'Anthropic'     },
  { value: 'claude-3-opus-latest',               label: 'Claude 3 Opus',              provider: 'Anthropic'     },
  // Groq
  { value: 'llama-3.3-70b-versatile',            label: 'LLaMA 3.3 70B Versatile',    provider: 'Groq'          },
  { value: 'llama-3.1-8b-instant',               label: 'LLaMA 3.1 8B Instant',       provider: 'Groq'          },
  { value: 'mixtral-8x7b-32768',                 label: 'Mixtral 8x7B',               provider: 'Groq'          },
];

function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line, i) => {
        if (/^[-*]\s/.test(line))
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span>{renderInline(line.replace(/^[-*]\s/, ''))}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))     return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const SUGGESTIONS: { icon: React.ElementType; label: string; text: string }[] = [
  { icon: Globe,         label: 'Serviços',    text: 'Quais serviços vocês oferecem?' },
  { icon: BarChart2,     label: 'Preços',      text: 'Quanto custa um site profissional?' },
  { icon: BrainCircuit,  label: 'AI Agent',    text: 'O que é um AI Agent?' },
  { icon: Headphones,    label: 'Suporte',     text: 'Como funciona o suporte mensal?' },
  { icon: Server,        label: 'Hospedagem',  text: 'Qual a diferença entre os planos de hospedagem?' },
  { icon: MessageCircle, label: 'WhatsApp',    text: 'Vocês fazem integração com WhatsApp?' },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function Chat() {
  const { profile } = useAgentProfile();
  const { settings, loaded: settingsLoaded } = useSettings();
  const [session, setSession]       = useState<ChatSession | null>(null);
  const [sessions, setSessions]     = useState<ChatSession[]>([]);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [model, setModel]           = useState(profile.llm_model || 'gemini-2.0-flash');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelOpen, setModelOpen]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Sincroniza model quando o perfil do agente carrega do servidor
  useEffect(() => {
    if (profile.llm_model) setModel(profile.llm_model);
  }, [profile.llm_model]);

  const loadSessions = () =>
    chatApi.listSessions()
      .then(r => setSessions(Array.isArray(r.data) ? r.data.sort((a, b) => b.created_at.localeCompare(a.created_at)) : []))
      .catch(() => {});

  useEffect(() => {
    if (!settingsLoaded) return;
    loadSessions();
    const savedId = localStorage.getItem(SESSION_KEY);
    if (savedId) {
      chatApi.getSession(savedId)
        .then(r => { setSession(r.data); return chatApi.getMessages(savedId); })
        .then(r => setMessages(Array.isArray(r.data) ? r.data.filter(m => m?.role) : []))
        .catch(() => createSession());
    } else {
      createSession();
    }
  }, [settingsLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getApiKey = (llm: string) => {
    if (llm.startsWith('gemini'))  return settings.apiKeyGemini   || undefined;
    if (llm.startsWith('gpt'))     return settings.apiKeyOpenai    || undefined;
    if (llm.startsWith('claude'))  return settings.apiKeyAnthropic || undefined;
    if (llm.startsWith('llama') || llm.startsWith('mixtral')) return settings.apiKeyGroq || undefined;
    return undefined;
  };

  const buildSystemPrompt = () => {
    const toneMap: Record<string, string> = {
      formal:     'Use linguagem corporativa, objetiva e profissional.',
      friendly:   'Use linguagem próxima, descontraída e empática.',
      technical:  'Use linguagem técnica com foco em detalhes e especificações.',
      consultive: 'Faça perguntas para entender a dor do cliente antes de apresentar soluções.',
    };
    const toneInstruction = toneMap[profile.tone] ?? toneMap.consultive;

    return [
      `Você é ${profile.name}, ${profile.role} da empresa ${profile.company}.`,
      ``,
      `## Tom de comunicação`,
      toneInstruction,
      ``,
      `## Serviços que você oferece`,
      profile.services,
      ``,
      `## Como lidar com objeções`,
      profile.objections,
      ``,
      `## Estilo de fechamento`,
      profile.closingStyle,
      ...(profile.systemPrompt ? [``, `## Instruções adicionais`, profile.systemPrompt] : []),
      ``,
      `## Regras obrigatórias`,
      `- Responda SEMPRE em português do Brasil.`,
      `- Nunca invente preços ou prazos — diga que vai verificar e retornar.`,
      `- Seja direto e objetivo. Evite respostas genéricas.`,
      `- Quando o cliente demonstrar interesse, proponha um próximo passo concreto.`,
      `- Nunca saia do seu papel de ${profile.role} da ${profile.company}.`,
    ].join('\n');
  };

  const createSession = async (llm?: string) => {
    try {
      const r = await chatApi.createSession({
        agent_name:    profile.name,
        agent_role:    profile.role,
        agent_tone:    profile.tone,
        llm_model:     llm ?? model,
        api_key:       getApiKey(llm ?? model),
        system_prompt: buildSystemPrompt(),
      });
      setSession(r.data);
      localStorage.setItem(SESSION_KEY, r.data.id);
      setMessages([]);
      loadSessions();
    } catch {
      setError('Não foi possível iniciar a sessão de chat.');
    }
  };

  const switchSession = async (s: ChatSession) => {
    setSession(s);
    localStorage.setItem(SESSION_KEY, s.id);
    setError('');
    try {
      const r = await chatApi.getMessages(s.id);
      setMessages(Array.isArray(r.data) ? r.data.filter(m => m?.role) : []);
    } catch {
      setMessages([]);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatApi.deleteSession(id).catch(() => {});
    if (session?.id === id) {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setMessages([]);
      await createSession();
    }
    loadSessions();
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !session) return;
    setInput('');
    setError('');
    setLoading(true);
    const optimistic: ChatMessage = {
      id: Date.now(), session_id: session.id,
      role: 'user', content: msg, sent_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await chatApi.sendMessage(session.id, 'user', msg);
      const newMsgs: ChatMessage[] = Array.isArray(res.data) ? res.data.filter((m: ChatMessage) => m?.role) : [];
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimistic.id),
        ...(newMsgs.length > 0 ? newMsgs : [optimistic]),
      ]);
      loadSessions();
    } catch (err: unknown) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      const status   = axiosErr?.response?.status;
      const rawData  = axiosErr?.response?.data;
      const apiMsg   = (rawData as { error?: string })?.error
        ?? (rawData as { message?: string })?.message
        ?? 'Erro ao enviar mensagem. Tente novamente.';
      const detail   = rawData ? JSON.stringify(rawData, null, 2) : '';
      if (status === 404) {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
        setMessages([]);
        await createSession();
        setError('Sessão reiniciada. Por favor, envie sua mensagem novamente.');
        setErrorDetail('');
      } else {
        setError(`[${status ?? '?'}] ${apiMsg}`);
        setErrorDetail(detail);
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const currentModel = LLM_MODELS.find(m => m.value === model) ?? LLM_MODELS[0];

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden"
        style={{
          width: sidebarOpen ? '260px' : '0px',
          borderRight: sidebarOpen ? '1px solid var(--kea-border)' : 'none',
          backgroundColor: 'var(--kea-surface)',
        }}
      >
        {sidebarOpen && (
          <>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--kea-border)' }}>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--kea-subtle)' }}>
                Conversas
              </span>
              <button
                onClick={() => createSession()}
                className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors hover:bg-orange-50 hover:text-orange-600"
                style={{ color: 'var(--kea-body)' }}
                title="Nova conversa"
              >
                <Plus size={13} /> Nova
              </button>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto py-2">
              {sessions.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: 'var(--kea-subtle)' }}>Nenhuma conversa</p>
              )}
              {sessions.map(s => {
                const active = s.id === session?.id;
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => switchSession(s)}
                    onKeyDown={e => e.key === 'Enter' && switchSession(s)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-2 group transition-colors cursor-pointer"
                    style={{
                      backgroundColor: active ? '#FFF1E6' : 'transparent',
                      borderLeft: active ? '3px solid #EA580C' : '3px solid transparent',
                    }}
                  >
                    <MessageSquare size={13} className="flex-shrink-0 mt-0.5"
                      style={{ color: active ? '#EA580C' : 'var(--kea-subtle)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: active ? '#EA580C' : 'var(--kea-heading)' }}>
                        {s.agent_name}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--kea-subtle)' }}>
                        {s.llm_model ?? 'Gemini 2.0 Flash'} · {fmtDate(s.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={e => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-500 flex-shrink-0"
                      style={{ color: 'var(--kea-subtle)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--kea-border)', backgroundColor: 'var(--kea-surface)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg transition-colors hover:bg-orange-50"
              style={{ color: 'var(--kea-body)' }}>
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-sm" style={{ color: 'var(--kea-heading)' }}>{profile.name}</p>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  online
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'var(--kea-body)' }}>
                {profile.role} · {profile.company}
              </p>
            </div>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setModelOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors hover:border-orange-500"
                style={{ borderColor: 'var(--kea-border)', backgroundColor: 'var(--kea-surface)', color: 'var(--kea-heading)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {currentModel.label}
                <span className="text-[9px] font-bold" style={{ color: 'var(--kea-subtle)' }}>{currentModel.provider}</span>
                <ChevronDown size={12} />
              </button>

              {modelOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg overflow-hidden overflow-y-auto"
                  style={{ backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)', minWidth: '260px', maxHeight: '320px' }}>
                  {['Google Gemini', 'OpenAI', 'Anthropic', 'Groq'].map(provider => (
                    <div key={provider}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--kea-subtle)' }}>
                        {provider}
                      </p>
                      {LLM_MODELS.filter(m => m.provider === provider).map(m => (
                        <button
                          key={m.value}
                          onClick={() => {
                            setModel(m.value);
                            setModelOpen(false);
                            createSession(m.value);
                          }}
                          className="w-full text-left px-4 py-2 flex items-center justify-between text-xs transition-colors hover:bg-orange-50"
                          style={{ color: model === m.value ? '#EA580C' : 'var(--kea-heading)' }}
                        >
                          <span className={model === m.value ? 'font-black' : 'font-semibold'}>{m.label}</span>
                          {model === m.value && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-4 py-4 min-h-0">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 py-8 flex-1">

              {/* Avatar + identidade */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow-xl">
                    <Sparkles size={34} className="text-white" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow"
                    style={{ background: '#DCFCE7', color: '#166534' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> online
                  </span>
                </div>
                <div className="text-center">
                  <p className="font-black text-xl" style={{ color: 'var(--kea-heading)' }}>Olá! Sou {profile.name} 👋</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--kea-body)' }}>
                    {profile.role} da <span className="font-bold" style={{ color: '#EA580C' }}>{profile.company}</span>
                  </p>
                  <p className="text-xs mt-2 max-w-sm" style={{ color: 'var(--kea-subtle)' }}>
                    Posso te ajudar com orçamentos, dúvidas sobre serviços e muito mais. Por onde começamos?
                  </p>
                </div>
              </div>

              {/* Sugestões */}
              <div className="w-full max-w-xl">
                <p className="text-[11px] font-black uppercase tracking-wider text-center mb-3" style={{ color: 'var(--kea-subtle)' }}>
                  Perguntas frequentes
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map(({ icon: Icon, label, text }) => (
                    <button key={text} onClick={() => send(text)}
                      className="group flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all duration-200 hover:border-orange-500 hover:shadow-md"
                      style={{ borderColor: 'var(--kea-border)', backgroundColor: 'var(--kea-surface)' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ backgroundColor: '#FFF1E6' }}>
                        <Icon size={15} className="text-orange-500 group-hover:text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#EA580C' }}>{label}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--kea-heading)' }}>{text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
                m.role === 'model' ? 'bg-gradient-to-br from-orange-600 to-orange-400' : 'bg-gradient-to-br from-slate-600 to-slate-500'
              }`}>
                {m.role === 'model' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
              </div>
              <div className={`flex flex-col gap-1 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
                <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={m.role === 'model'
                    ? { backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)', color: 'var(--kea-heading)' }
                    : { backgroundColor: '#EA580C', color: '#fff' }}>
                  {m.role === 'model' ? <Markdown text={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
                </div>
                <span className="text-[10px] px-1" style={{ color: 'var(--kea-subtle)' }}>{fmt(m.sent_at)}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-600 to-orange-400">
                <Bot size={14} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                style={{ backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)' }}>
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
                <span className="text-sm" style={{ color: 'var(--kea-body)' }}>Digitando...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col gap-2 px-4 py-3 rounded-xl"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <div className="flex items-start gap-3">
                <span className="text-base flex-shrink-0">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: '#DC2626' }}>Erro</p>
                  <p className="text-xs mt-0.5 break-words" style={{ color: '#B91C1C' }}>{error}</p>
                </div>
                <button onClick={() => { setError(''); setErrorDetail(''); }}
                  className="text-xs font-bold flex-shrink-0" style={{ color: '#DC2626' }}>✕</button>
              </div>
              {errorDetail && (
                <details className="mt-1">
                  <summary className="text-[10px] font-bold cursor-pointer select-none" style={{ color: '#DC2626' }}>
                    Ver resposta completa
                  </summary>
                  <pre className="mt-1 text-[10px] overflow-x-auto p-2 rounded-lg whitespace-pre-wrap break-all"
                    style={{ background: '#FEE2E2', color: '#7F1D1D' }}>{errorDetail}</pre>
                </details>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--kea-border)', backgroundColor: 'var(--kea-surface)' }}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            className="input flex-1 resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="btn-primary p-3 flex-shrink-0 disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Fecha dropdown ao clicar fora */}
      {modelOpen && <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />}
    </div>
  );
}
