import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAgentProfile } from '../lib/useAgentProfile';

interface Message {
  role: 'user' | 'model';
  text: string;
  ts: string;
}

const STORAGE_KEY = 'keaflow-chat-history';

function loadHistory(): Message[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function Chat() {
  const { profile } = useAgentProfile();
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', text, ts: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', {
        profile,
        history: next.slice(0, -1).map((m) => ({ role: m.role, text: m.text })),
        message: text,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: data.reply, ts: new Date().toISOString() },
      ]);
    } catch {
      setError('Erro ao conectar com o agente. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-base" style={{ color: 'var(--kea-heading)' }}>
              {profile.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--kea-body)' }}>
              {profile.role} · {profile.company}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="btn-ghost flex items-center gap-1.5 text-xs"
            title="Limpar conversa">
            <Trash2 size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center shadow-lg">
              <Bot size={32} className="text-white" />
            </div>
            <p className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>
              Olá! Sou {profile.name}
            </p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--kea-body)' }}>
              {profile.role} da {profile.company}. Como posso te ajudar hoje?
            </p>
            <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-sm">
              {[
                'Quais serviços vocês oferecem?',
                'Quanto custa um site profissional?',
                'O que é um AI Agent e como pode me ajudar?',
              ].map((s) => (
                <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-left text-sm px-4 py-2.5 rounded-xl border-2 transition-all hover:border-orange-500"
                  style={{ borderColor: 'var(--kea-border)', color: 'var(--kea-body)', backgroundColor: 'var(--kea-surface)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
              m.role === 'model'
                ? 'bg-gradient-to-br from-orange-600 to-orange-400'
                : 'bg-gradient-to-br from-slate-600 to-slate-500'
            }`}>
              {m.role === 'model'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-white" />}
            </div>
            <div className={`flex flex-col gap-1 max-w-[78%] ${m.role === 'user' ? 'items-end' : ''}`}>
              <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={m.role === 'model'
                  ? { backgroundColor: 'var(--kea-surface)', border: '1px solid var(--kea-border)', color: 'var(--kea-heading)' }
                  : { backgroundColor: '#EA580C', color: '#fff' }}>
                {m.text}
              </div>
              <span className="text-[10px] px-1" style={{ color: 'var(--kea-subtle)' }}>{fmt(m.ts)}</span>
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
              <Loader2 size={14} className="animate-spin text-orange-600" />
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
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          className="input flex-1 resize-none"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="btn-primary p-3 flex-shrink-0 disabled:opacity-40"
          title="Enviar">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
