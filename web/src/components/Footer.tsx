import { Link } from 'react-router-dom';
import keaLogo from '../assets/kealabs_logo_strategic.png';
import { Github, Linkedin, Globe } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto" style={{ borderTop: '1px solid var(--kea-border)', backgroundColor: 'var(--kea-surface)' }}>
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <img src={keaLogo} alt="KeaLabs" className="h-7 w-auto opacity-90" />
          <span className="text-xs" style={{ color: 'var(--kea-subtle)' }}>
            Inovação em soluções comerciais
          </span>
        </div>

        {/* Links rápidos */}
        <nav className="flex items-center gap-5">
          {[
            { to: '/', label: 'Dashboard' },
            { to: '/builder', label: 'Orçamentos' },
            { to: '/prospects', label: 'Prospects' },
            { to: '/settings', label: 'Configurações' },
          ].map(({ to, label }) => (
            <Link key={to} to={to}
              className="text-xs font-semibold transition-colors hover:text-orange-600"
              style={{ color: 'var(--kea-body)' }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Redes sociais + copyright */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex items-center gap-3">
            <a href="https://www.kealabs.com.br" target="_blank" rel="noreferrer"
              className="transition-colors hover:text-orange-600" style={{ color: 'var(--kea-subtle)' }}
              title="Site">
              <Globe size={16} />
            </a>
            <a href="https://linkedin.com/company/kealabs" target="_blank" rel="noreferrer"
              className="transition-colors hover:text-orange-600" style={{ color: 'var(--kea-subtle)' }}
              title="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href="https://github.com/kealabs" target="_blank" rel="noreferrer"
              className="transition-colors hover:text-orange-600" style={{ color: 'var(--kea-subtle)' }}
              title="GitHub">
              <Github size={16} />
            </a>
          </div>
          <span className="text-xs" style={{ color: 'var(--kea-subtle)' }}>
            © {year} KeaLabs — Todos os direitos reservados
          </span>
        </div>

      </div>
    </footer>
  );
}
