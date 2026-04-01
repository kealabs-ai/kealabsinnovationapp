import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap, BarChart3, Users, Bot } from 'lucide-react';
import keaLogo from '../assets/kealabs_logo_strategic.png';
import { authApi } from '../lib/api';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 60_000;

function sanitize(value: string) {
  return value.replace(/[<>"'`]/g, '').trim();
}

const FEATURES = [
  { icon: Zap,       label: 'Orçamentos inteligentes em segundos'   },
  { icon: BarChart3, label: 'Dashboard com métricas em tempo real'  },
  { icon: Users,     label: 'Gestão completa de prospects'          },
  { icon: Bot,       label: 'Agente comercial com IA integrada'     },
];

export function Login() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const attempts = useRef(0);
  const lockedAt = useRef<number | null>(null);

  function isLocked(): boolean {
    if (lockedAt.current === null) return false;
    if (Date.now() - lockedAt.current < LOCKOUT_MS) return true;
    lockedAt.current = null;
    attempts.current = 0;
    return false;
  }

  function remainingSecs(): number {
    if (!lockedAt.current) return 0;
    return Math.ceil((LOCKOUT_MS - (Date.now() - lockedAt.current)) / 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (isLocked()) {
      setError(`Muitas tentativas. Aguarde ${remainingSecs()}s para tentar novamente.`);
      return;
    }

    const cleanEmail    = sanitize(email);
    const cleanPassword = sanitize(password);

    if (!cleanEmail || !cleanPassword) { setError('Preencha e-mail e senha.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError('E-mail inválido.'); return; }

    setLoading(true);
    try {
      const { data } = await authApi.login({ email: cleanEmail, password: cleanPassword });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      attempts.current = 0;
      navigate('/', { replace: true });
    } catch (err: unknown) {
      attempts.current += 1;
      if (attempts.current >= MAX_ATTEMPTS) {
        lockedAt.current = Date.now();
        setError(`Bloqueado por ${LOCKOUT_MS / 1000}s após ${MAX_ATTEMPTS} tentativas.`);
      } else {
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 401 ? 'E-mail ou senha incorretos.' : 'Erro ao conectar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Painel esquerdo ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{
          background: 'linear-gradient(145deg, #1C0A00 0%, #7C2D12 50%, #EA580C 100%)',
        }}
      >
        {/* Logo */}
        <img src={keaLogo} alt="KeaLabs" className="h-10 w-auto max-w-[180px] object-contain object-left brightness-0 invert" />

        {/* Headline */}
        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Transforme sua operação<br />
              <span style={{ color: '#FDBA74' }}>comercial com IA.</span>
            </h1>
            <p className="mt-4 text-base" style={{ color: '#FED7AA' }}>
              O KeaFlow centraliza orçamentos, prospects e automações
              em uma única plataforma inteligente.
            </p>
          </div>

          {/* Features */}
          <ul className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <Icon size={18} className="text-orange-300" />
                </span>
                <span className="text-sm font-semibold" style={{ color: '#FED7AA' }}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer esquerdo */}
        <p className="text-xs" style={{ color: '#92400E' }}>
          © {new Date().getFullYear()} KeaLabs — Todos os direitos reservados
        </p>
      </div>

      {/* ── Painel direito ──────────────────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ backgroundColor: 'var(--kea-bg)' }}
      >
        {/* Logo mobile */}
        <img src={keaLogo} alt="KeaLabs" className="h-9 w-auto max-w-[160px] object-contain mb-10 lg:hidden" />

        <div className="w-full max-w-sm flex flex-col gap-8">

          {/* Cabeçalho */}
          <div>
            <h2 className="text-3xl font-black" style={{ color: 'var(--kea-heading)' }}>
              Entrar
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--kea-body)' }}>
              Acesse o painel com suas credenciais.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            <div className="flex flex-col gap-1">
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="voce@empresa.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                maxLength={254}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-orange-600"
                  style={{ color: 'var(--kea-subtle)' }}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <span className="text-red-500 mt-0.5">⚠</span>
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
              disabled={loading || isLocked()}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Entrando...</>
                : 'Entrar'
              }
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: 'var(--kea-border)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--kea-subtle)' }}>KeaFlow</span>
            <span className="flex-1 h-px" style={{ background: 'var(--kea-border)' }} />
          </div>

          <p className="text-center text-xs" style={{ color: 'var(--kea-subtle)' }}>
            Problemas para acessar?{' '}
            <a href="https://www.kealabs.com.br" target="_blank" rel="noreferrer"
              className="font-bold hover:text-orange-600 transition-colors"
              style={{ color: 'var(--kea-orange)' }}>
              Fale com o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
