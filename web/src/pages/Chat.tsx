import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';
import { chatApi } from '../lib/api';
import type { ChatMessage, ChatSession } from '../lib/api';
import { useAgentProfile } from '../lib/useAgentProfile';

const SESSION_KEY = 'keaflow-chat-session-id';

// Renderiza markdown simples: **bold**, *italic*, listas e quebras de linha
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((line, i) => {
        // lista com - ou *
        if (/^[-*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <span>{renderInline(line.replace(/^[-*]\s/, ''))}</span>
            </div>
          );
        }
        // linha vazia
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))
      return <em key={i}>{part.slice(1, -1)}</em>;
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

export function Chat() {
  const { profile } = useAgentProfile();
  const [session, setSession]   = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem(SESSION_KEY);
    if (savedId) {
      chatApi.getSession(savedId)
        .then((r) => { setSession(r.data); return chatApi.getMessages(savedId); })
        .then((r) => setMessages(Array.isArray(r.data) ? r.data.filter((m) => m?.role) : []))
        .catch(() => createSession());
    } else {
      createSession();
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const createSession = async () => {
    try {
      const r = await chatApi.createSession({
        agent_name: profile.name,
        agent_role: profile.role,
        agent_tone: profile.tone,
      });
      setSession(r.data);
      localStorage.setItem(SESSION_KEY, r.data.id);
      setMessages([]);
    } catch {
      setError('Não foi possível iniciar a sessão de chat.');
    }
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
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await chatApi.sendMessage(session.id, 'user', msg);
      const newMsgs: ChatMessage[] = Array.isArray(res.data)
        ? res.data.filter((m: ChatMessage) => m?.role) : [];
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        ...(newMsgs.length > 0 ? newMsgs : [optimistic]),
      ]);
    } catch {
      setError('Erro ao enviar mensagem. Tente novamente.');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clear = async () => {
    if (!session) return;
    await chatApi.deleteSession(session.id).catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setSession(null);
    createSession();
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4"
      style={{ height: 'calc(100vh - 64px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-base" style={{ color: 'var(--kea-heading)' }}>
                {profile.name}
              </p>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#DCFCE7', color: '#166534' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                online
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--kea-body)' }}>
              {profile.role} · {profile.company} · Gemini 2.0 Flash
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="btn-ghost flex items-center gap-1.5 text-xs">
            <Trash2 size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 min-h-0">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>
                Olá! Sou {profile.name}
              </p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--kea-body)' }}>
                {profile.role} da {profile.company}. Posso te ajudar com orçamentos,
                dúvidas sobre serviços e muito mais.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border-2 transition-all hover:border-orange-500 hover:bg-orange-50"
                  style={{ borderColor: 'var(--kea-border)', color: 'var(--kea-body)', backgroundColor: 'var(--kea-surface)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
              m.role === 'model'
                ? 'bg-gradient-to-br from-orange-600 to-orange-400'
                : 'bg-gradient-to-br from-slate-600 to-slate-500'
            }`}>
              {m.role === 'model'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-white" />}
            </div>
            <div className={`flex flex-col gap-1 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
              <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={m.role === 'model'
                  ? { backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)', color: 'var(--kea-heading)' }
                  : { backgroundColor: '#EA580C', color: '#fff' }}>
                {m.role === 'model'
                  ? <Markdown text={m.content} />
                  : <span className="whitespace-pre-wrap">{m.content}</span>}
              </div>
              <span className="text-[10px] px-1" style={{ color: 'var(--kea-subtle)' }}>
                {fmt(m.sent_at)}
              </span>
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
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
              <span className="text-sm" style={{ color: 'var(--kea-body)' }}>Digitando...</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-center px-4 py-2 rounded-xl"
            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
  );
}
