import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { prospectsApi } from '../lib/api';
import type { Prospect, ProspectSource, ProspectStatus } from '../lib/api';

const SOURCE_LABELS: Record<ProspectSource, string> = {
  instagram: 'Instagram', whatsapp: 'WhatsApp', site: 'Site',
  indicacao: 'Indicação', outro: 'Outro',
};

const STATUS_STYLES: Record<ProspectStatus, string> = {
  NEW:         'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  CONTACTED:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  NEGOTIATING: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  APPROVED:    'bg-green-500/10 text-green-400 border border-green-500/30',
  REJECTED:    'bg-red-500/10 text-red-400 border border-red-500/30',
};

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: 'Novo', CONTACTED: 'Contatado', NEGOTIATING: 'Negociando',
  APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
};

const EMPTY: Omit<Prospect, 'id' | 'created_at'> = {
  name: '', email: '', cpf_cnpj: '', phone: '', company: '',
  source: 'outro', status: 'NEW', notes: '',
};

export function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Prospect | null>(null);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);

  const load = () => {
    setLoading(true);
    prospectsApi.list()
      .then(r => setProspects(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (p: Prospect) => {
    setEditing(p);
    setForm({ name: p.name, email: p.email ?? '', cpf_cnpj: p.cpf_cnpj ?? '',
      phone: p.phone ?? '', company: p.company ?? '', source: p.source ?? 'outro',
      status: p.status, notes: p.notes ?? '' });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await prospectsApi.update({ ...form, id: editing.id });
      } else {
        await prospectsApi.create(form);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover prospect?')) return;
    await prospectsApi.delete(id);
    setProspects(p => p.filter(x => x.id !== id));
  };

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <input type={type} value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Prospects</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>Gerencie seus leads e oportunidades</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Prospect
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['NEW','CONTACTED','NEGOTIATING','APPROVED','REJECTED'] as ProspectStatus[]).map(s => (
          <div key={s} className="card flex flex-col gap-1">
            <span className="label">{STATUS_LABELS[s]}</span>
            <span className="text-2xl font-black" style={{ color: 'var(--kea-heading)' }}>
              {prospects.filter(p => p.status === s).length}
            </span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg" style={{ color: 'var(--kea-heading)' }}>
                {editing ? 'Editar Prospect' : 'Novo Prospect'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--kea-body)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field('name', 'Nome *')}
              {field('email', 'E-mail', 'email')}
              {field('cpf_cnpj', 'CPF / CNPJ')}
              {field('phone', 'Telefone')}
              {field('company', 'Empresa')}

              <div className="flex flex-col gap-1">
                <label className="label">Origem</label>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as ProspectSource }))} className="input">
                  {(Object.keys(SOURCE_LABELS) as ProspectSource[]).map(s => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProspectStatus }))} className="input">
                  {(Object.keys(STATUS_LABELS) as ProspectStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">Observações</label>
              <textarea rows={3} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input resize-none" />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex items-center gap-2">
                <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--kea-body)' }}>Carregando...</div>
      ) : prospects.length === 0 ? (
        <div className="card text-center py-20" style={{ color: 'var(--kea-body)' }}>
          Nenhum prospect ainda.{' '}
          <button onClick={openNew} className="text-orange-600 hover:underline font-bold">Adicionar o primeiro →</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {prospects.map(p => (
            <div key={p.id} className="card flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold" style={{ color: 'var(--kea-heading)' }}>{p.name}</span>
                  <span className={`badge ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  {p.source && (
                    <span className="badge text-orange-700 dark:text-brand-text"
                      style={{ background: '#FFF1E6', border: '1px solid #FED7AA' }}>
                      {SOURCE_LABELS[p.source]}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm flex-wrap" style={{ color: 'var(--kea-body)' }}>
                  {p.email   && <span>{p.email}</span>}
                  {p.phone   && <span>{p.phone}</span>}
                  {p.company && <span>{p.company}</span>}
                  <span className="hidden md:inline">{new Date(p.created_at).toLocaleString('pt-BR')}</span>
                </div>
                {p.notes && <p className="text-xs mt-1" style={{ color: 'var(--kea-body)' }}>{p.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(p)} title="Editar"
                  className="p-2 rounded-xl hover:text-orange-600 transition-colors"
                  style={{ border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(p.id)} title="Remover"
                  className="p-2 rounded-xl hover:text-red-500 transition-colors"
                  style={{ border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
