import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Plus, MessageSquare, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { chatApi } from '../lib/api';
import type { ChatMessage, ChatSession } from '../lib/api';
import { useAgentProfile } from '../lib/useAgentProfile';
import { useSettings } from '../lib/useSettings';

const SESSION_KEY = 'keaflow-chat-session-id';

const LLM_MODELS: { value: string; label: string; provider: string }[] = [
  // Google Gemini
  { value: 'gemini-2.0-flash',                   label: 'Gemini 2.0 Flash',           provider: 'Google Gemini' },
  { value: 'gemini-2.0-flash-lite',              label: 'Gemini 2.0 Flash Lite',      provider: 'Google Gemini' },
  { value: 'gemini-2.5-flash-preview-05-20',     label: 'Gemini 2.5 Flash Preview',   provider: 'Google Gemini' },
  { value: 'gemini-2.5-pro-preview-06-05',       label: 'Gemini 2.5 Pro Preview',     provider: 'Google Gemini' },
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

const SUGGESTIONS = [
  'Quais serviços vocês oferecem?',
  'Quanto custa um site profissional?',
  'O que é um AI Agent?',
  'Como funciona o suporte mensal?',
  'Qual a diferença entre os planos de hospedagem?',
  'Vocês fazem integração com WhatsApp?',
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
  const { settings } = useSettings();
  const [session, setSession]       = useState<ChatSession | null>(null);
  const [sessions, setSessions]     = useState<ChatSession[]>([]);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
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
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getApiKey = (llm: string) => {
    if (llm.startsWith('gemini'))  return settings.apiKeyGemini  || undefined;
    if (llm.startsWith('gpt'))     return settings.apiKeyOpenai   || undefined;
    if (llm.startsWith('claude'))  return settings.apiKeyAnthropic || undefined;
    if (llm.startsWith('llama') || llm.startsWith('mixtral')) return settings.apiKeyGroq || undefined;
    return undefined;
  };

  const createSession = async (llm?: string) => {
    try {
      const r = await chatApi.createSession({
        agent_name: profile.name,
        agent_role: profile.role,
        agent_tone: profile.tone,
        llm_model:  llm ?? model,
        api_key:    getApiKey(llm ?? model),
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
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const status   = axiosErr?.response?.status;
      const apiMsg   = axiosErr?.response?.data?.error;
      if (status === 404) {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
        setMessages([]);
        await createSession();
        setError('Sessão reiniciada. Por favor, envie sua mensagem novamente.');
      } else {
        setError(apiMsg ?? 'Erro ao enviar mensagem. Tente novamente.');
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
                  <button
                    key={s.id}
                    onClick={() => switchSession(s)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-2 group transition-colors"
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
                  </button>
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
            <div className="flex flex-col items-center justify-center gap-4 py-10 flex-1">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow-lg">
                <Sparkles size={28} className="text-white" />
              </div>
              <div className="text-center">
                <p className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>Olá! Sou {profile.name}</p>
                <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--kea-body)' }}>
                  {profile.role} da {profile.company}. Posso te ajudar com orçamentos, dúvidas sobre serviços e muito mais.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border-2 transition-all hover:border-orange-500 hover:bg-orange-50"
                    style={{ borderColor: 'var(--kea-border)', color: 'var(--kea-body)', backgroundColor: 'var(--kea-surface)' }}>
                    {s}
                  </button>
                ))}
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
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <span className="text-base flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: '#DC2626' }}>Erro</p>
                <p className="text-xs mt-0.5" style={{ color: '#B91C1C' }}>{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-xs font-bold flex-shrink-0" style={{ color: '#DC2626' }}>✕</button>
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
