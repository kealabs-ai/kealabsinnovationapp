import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Settings, MessageSquare, UserCircle2, LogOut } from 'lucide-react';
import keaLogo from '../assets/kealabs_logo_strategic.png';
import { useTheme } from '../lib/useTheme';
import { useUser } from '../lib/useUser';

function handleLogout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = 'https://www.kealabs.com.br/login';
}

export function Navbar() {
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const { user } = useUser();

  const link = (to: string, label: string) => (
    <Link to={to}
      style={{ color: pathname === to ? undefined : 'var(--kea-body)' }}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
        pathname === to ? 'bg-orange-600 text-white' : 'hover:text-orange-600'
      }`}>
      {label}
    </Link>
  );

  const iconBtn = (active: boolean) =>
    `p-2 rounded-xl transition-all hover:text-orange-600 ${
      active ? 'bg-orange-600 text-white' : ''
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md shadow-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--kea-surface) 92%, transparent)',
        borderBottom: '1px solid var(--kea-border)',
      }}>
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between gap-6">

        {/* Logo */}
        <img src={keaLogo} alt="KeaLabs" className="h-10 w-auto flex-shrink-0" />

        {/* Links de navegação */}
        <nav className="flex items-center gap-1">
          {link('/', 'Dashboard')}
          {link('/builder', 'Novo Orçamento')}
          {link('/prospects', 'Prospects')}
        </nav>

        {/* Ações à direita */}
        <div className="flex items-center gap-3 ml-auto">

          {/* Chat */}
          <Link to="/chat" className={iconBtn(pathname === '/chat')}
            style={pathname === '/chat' ? {} : { color: 'var(--kea-body)' }}
            title="Chat Comercial">
            <MessageSquare size={18} />
          </Link>

          {/* Settings */}
          <Link to="/settings" className={iconBtn(pathname === '/settings')}
            style={pathname === '/settings' ? {} : { color: 'var(--kea-body)' }}
            title="Parametrizações">
            <Settings size={18} />
          </Link>

          {/* Tema */}
          <button onClick={toggle} className={iconBtn(false)}
            style={{ color: 'var(--kea-body)' }}
            title={dark ? 'Tema claro' : 'Tema escuro'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Divider */}
          <span className="w-px h-8 mx-1" style={{ background: 'var(--kea-border)' }} />

          {/* Avatar */}
          <Link to="/users" title="Meu Perfil"
            className="flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all hover:bg-orange-50 dark:hover:bg-orange-950/30"
            style={{ background: pathname === '/users' ? 'var(--kea-border)' : undefined }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-orange-500" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-orange-500"
                style={{ background: 'linear-gradient(135deg, #EA580C, #F97316)' }}>
                <UserCircle2 size={22} className="text-white" />
              </div>
            )}
            {user.name && (
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-sm font-bold" style={{ color: 'var(--kea-heading)' }}>
                  {user.name.split(' ')[0]}
                </span>
                {user.role && (
                  <span className="text-xs" style={{ color: 'var(--kea-subtle)' }}>
                    {user.role}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Sair */}
          <button onClick={handleLogout} title="Sair do sistema"
            className="p-2 rounded-xl transition-all hover:text-red-500"
            style={{ color: 'var(--kea-subtle)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
