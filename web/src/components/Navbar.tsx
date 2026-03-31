import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Settings, MessageSquare, UserCircle2 } from 'lucide-react';
import keaLogo from '../assets/kealabs_logo_strategic.png';
import { useTheme } from '../lib/useTheme';
import { useUser } from '../lib/useUser';

export function Navbar() {
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const { user } = useUser();

  const link = (to: string, label: string) => (
    <Link to={to} style={pathname === to ? {} : { color: 'var(--kea-body)' }}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
        pathname === to ? 'bg-orange-600 text-white' : 'hover:text-orange-600'
      }`}>
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur shadow-sm"
      style={{ backgroundColor: 'color-mix(in srgb, var(--kea-surface) 90%, transparent)', borderBottom: '1px solid var(--kea-border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <img src={keaLogo} alt="KeaLabs" className="h-8 w-auto" />
        </div>
        <nav className="flex items-center gap-2">
          {link('/', 'Dashboard')}
          {link('/builder', 'Novo Orçamento')}
          {link('/prospects', 'Prospects')}
          <Link to="/chat"
            className={`p-2 rounded-xl transition-all hover:text-orange-600 ${
              pathname === '/chat' ? 'bg-orange-600 text-white' : ''
            }`}
            style={pathname === '/chat' ? {} : { border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}
            title="Chat Comercial">
            <MessageSquare size={16} />
          </Link>
          <Link to="/settings"
            className={`p-2 rounded-xl transition-all hover:text-orange-600 ${
              pathname === '/settings' ? 'bg-orange-600 text-white' : ''
            }`}
            style={pathname === '/settings' ? {} : { border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}
            title="Parametrizações">
            <Settings size={16} />
          </Link>
          <button onClick={toggle}
            className="ml-2 p-2 rounded-xl transition-all hover:text-orange-600"
            style={{ border: '1px solid var(--kea-border)', color: 'var(--kea-body)' }}
            title={dark ? 'Tema claro' : 'Tema escuro'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Avatar + nome do usuário */}
          <Link to="/users"
            className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:text-orange-600"
            style={{
              border: '1px solid var(--kea-border)',
              background: pathname === '/users' ? '#FFF1E6' : undefined,
              borderColor: pathname === '/users' ? '#EA580C' : undefined,
            }}
            title="Meu Perfil">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                style={{ border: '1.5px solid #EA580C' }} />
            ) : (
              <UserCircle2 size={18} className={pathname === '/users' ? 'text-orange-600' : ''}
                style={pathname === '/users' ? {} : { color: 'var(--kea-body)' }} />
            )}
            {user.name && (
              <span className="text-sm font-bold hidden md:block"
                style={{ color: pathname === '/users' ? '#EA580C' : 'var(--kea-heading)' }}>
                {user.name.split(' ')[0]}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
