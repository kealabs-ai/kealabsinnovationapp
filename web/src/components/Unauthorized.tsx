import { ShieldOff } from 'lucide-react';
import keaLogo from '../assets/kealabs_logo_strategic.png';

export function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: 'var(--kea-bg)' }}>

      <img src={keaLogo} alt="KeaLabs" className="h-10 w-auto opacity-80" />

      <div className="card flex flex-col items-center gap-4 max-w-md w-full text-center py-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950">
          <ShieldOff size={32} className="text-orange-600" />
        </div>

        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--kea-heading)' }}>
            Acesso não autorizado
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--kea-body)' }}>
            Você não tem permissão para visualizar esta página.<br />
            Faça login com uma conta válida para continuar.
          </p>
        </div>

        <a
          href="https://www.kealabs.com.br/login"
          className="btn-primary mt-2 inline-block"
        >
          Ir para o Login
        </a>
      </div>

      <p className="text-xs" style={{ color: 'var(--kea-subtle)' }}>
        © {new Date().getFullYear()} KeaLabs — Todos os direitos reservados
      </p>
    </div>
  );
}
