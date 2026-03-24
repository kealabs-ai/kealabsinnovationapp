import { useEffect, useState } from 'react';
import { quotesApi } from '../lib/api';
import { socket } from '../lib/socket';
import type { Quote } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Dashboard() {
  const [quotes, setQuotes]   = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveId, setLiveId]   = useState<string | null>(null);

  useEffect(() => {
    quotesApi.list().then((r) => { setQuotes(r.data.data ?? []); setLoading(false); }).catch(() => setLoading(false));
    const flash = (id: string) => { setLiveId(id); setTimeout(() => setLiveId(null), 3000); };
    const onCreated = (q: Quote) => { setQuotes((p) => [q, ...p]); flash(q.id); };
    const onUpdated = (q: Quote) => { setQuotes((p) => p.map((x) => (x.id === q.id ? q : x))); flash(q.id); };
    socket.on('quote:created', onCreated);
    socket.on('quote:updated', onUpdated);
    return () => { socket.off('quote:created', onCreated); socket.off('quote:updated', onUpdated); };
  }, []);

  const changeStatus = async (id: string, status: Quote['status']) =>
    quotesApi.updateStatus(id, status).then(() =>
      setQuotes((p) => p.map((q) => q.id === id ? { ...q, status } : q))
    );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>Orçamentos da sessão atual</p>
        </div>
  
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: quotes.length },
          { label: 'Pendentes',   value: quotes.filter((q) => q.status === 'PENDING').length },
          { label: 'Aprovados',   value: quotes.filter((q) => q.status === 'APPROVED').length },
          { label: 'Setup Total', value: fmt(quotes.reduce((s, q) => s + (q.setup_value ?? 0), 0)) },
        ].map((s) => (
          <div key={s.label} className="card flex flex-col gap-1">
            <span className="label">{s.label}</span>
            <span className="text-2xl font-black" style={{ color: 'var(--kea-heading)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--kea-body)' }}>Carregando...</div>
      ) : quotes.length === 0 ? (
        <div className="card text-center py-20" style={{ color: 'var(--kea-body)' }}>
          Nenhum orçamento ainda.{' '}
          <a href="/builder" className="text-orange-600 hover:underline font-bold">Criar o primeiro →</a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((q) => (
            <div key={q.id} className="card flex flex-col md:flex-row md:items-center gap-4 transition-all duration-500"
              style={liveId === q.id ? { borderColor: '#EA580C', boxShadow: '0 4px 24px rgba(234,88,12,0.12)' } : {}}>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{q.clientName ?? q.client_id}</span>
                  <StatusBadge status={q.status} />
                  <span className="badge text-orange-700 dark:text-brand-text"
                    style={{ background: '#FFF1E6', border: '1px solid #FED7AA' }}>
                    {q.service_type}
                  </span>
                  {liveId === q.id && (
                    <span className="badge animate-pulse" style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.3)' }}>● live</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm" style={{ color: 'var(--kea-body)' }}>
                  <span>Setup: <strong style={{ color: 'var(--kea-heading)' }}>{fmt(q.setup_value)}</strong></span>
                  <span>Mensal: <strong className="text-orange-600">{fmt(q.monthly_value)}</strong></span>
                  <span className="hidden md:inline">{new Date(q.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {q.status === 'PENDING' && (
                  <>
                    <button onClick={() => changeStatus(q.id, 'APPROVED')}
                      className="text-sm px-4 py-2 rounded-xl transition-colors"
                      style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                      Aprovar
                    </button>
                    <button onClick={() => changeStatus(q.id, 'REJECTED')}
                      className="text-sm px-4 py-2 rounded-xl transition-colors"
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
