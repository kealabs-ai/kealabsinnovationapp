import { useState, useRef } from 'react';
import { UserCircle2, Camera, Check, UserPlus, Trash2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useUser } from '../lib/useUser';
import { authApi } from '../lib/api';
import type { SystemUser, UserRole } from '../lib/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor',
  usuario: 'Usuário',
};

const EMPTY_ADMIN = { name: '', email: '', password: '', role: 'vendedor' as UserRole };

export function Users() {
  const { user, save } = useUser();
  const [form, setForm] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ ...EMPTY_ADMIN });
  const [adminSaved, setAdminSaved] = useState(false);
  const [adminError, setAdminError] = useState('');

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-1">
      <label className="label">{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input"
      />
    </div>
  );

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatarUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()) return;
    setAdminError('');
    try {
      const res = await authApi.createUser(adminForm);
      const created = res.data as SystemUser;
      const newAdmin: AdminUser = {
        id: created.id ?? crypto.randomUUID(),
        name: created.name ?? adminForm.name,
        email: created.email ?? adminForm.email,
        role: created.role ?? adminForm.role,
        createdAt: created.created_at ?? new Date().toISOString(),
      };
      setAdmins(prev => [...prev, newAdmin]);
      setAdminForm({ ...EMPTY_ADMIN });
      setAdminSaved(true);
      setTimeout(() => { setAdminSaved(false); setShowModal(false); }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAdminError(msg ?? 'Erro ao criar usuário. Verifique suas permissões.');
    }
  };

  const removeAdmin = (id: string) => {
    if (!confirm('Remover este usuário?')) return;
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>Meu Perfil</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>Informações exibidas na barra de navegação</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Novo Admin
        </button>
      </div>

      {/* Perfil */}
      <form onSubmit={submit} className="card flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar"
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid #EA580C' }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: '#FFF1E6', border: '3px solid #EA580C' }}>
                <UserCircle2 size={48} className="text-orange-600" />
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          <p className="text-xs" style={{ color: 'var(--kea-body)' }}>Clique no ícone para alterar a foto</p>
        </div>
        <div className="flex flex-col gap-4">
          {field('name', 'Nome *', 'text', 'Seu nome')}
          {field('email', 'E-mail', 'email', 'seu@email.com')}
          {field('role', 'Cargo / Função', 'text', 'Ex: Consultor Comercial')}
        </div>
        <button type="submit" disabled={!form.name.trim()}
          className="btn-primary flex items-center justify-center gap-2">
          {saved ? <><Check size={16} /> Salvo!</> : 'Salvar Perfil'}
        </button>
      </form>

      {/* Lista de admins */}
      {admins.length > 0 && (
        <div className="card flex flex-col gap-4">
          <h2 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--kea-heading)' }}>
            <ShieldCheck size={18} className="text-orange-600" /> Usuários Admin
          </h2>
          <div className="flex flex-col gap-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--kea-bg)', border: '1px solid var(--kea-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-black">
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--kea-heading)' }}>{a.name}</p>
                    <p className="text-xs" style={{ color: 'var(--kea-body)' }}>{a.email} · {ROLE_LABELS[a.role]}</p>
                  </div>
                </div>
                <button onClick={() => removeAdmin(a.id)}
                  className="p-2 rounded-xl hover:text-red-500 transition-colors"
                  style={{ border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal novo admin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card w-full max-w-md flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--kea-heading)' }}>
                <ShieldCheck size={18} className="text-orange-600" /> Novo Usuário Admin
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--kea-body)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitAdmin} className="flex flex-col gap-4">
              {adminError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <AlertCircle size={14} /> {adminError}
                </div>
              )}
              {(['name', 'email', 'password'] as const).map((k) => (
                <div key={k} className="flex flex-col gap-1">
                  <label className="label">
                    {k === 'name' ? 'Nome *' : k === 'email' ? 'E-mail *' : 'Senha *'}
                  </label>
                  <input
                    type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
                    value={adminForm[k]}
                    onChange={e => setAdminForm(f => ({ ...f, [k]: e.target.value }))}
                    className="input"
                    placeholder={k === 'name' ? 'Nome completo' : k === 'email' ? 'admin@empresa.com' : '••••••••'}
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="label">Perfil de acesso</label>
                <select value={adminForm.role}
                  onChange={e => setAdminForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="input">
                  <option value="admin">Admin</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="usuario">Usuário</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit"
                  disabled={!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password.trim()}
                  className="btn-primary flex items-center gap-2">
                  {adminSaved ? <><Check size={14} /> Criado!</> : <><UserPlus size={14} /> Criar Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
