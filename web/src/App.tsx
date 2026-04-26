import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Builder } from './pages/Builder';
import { Prospects } from './pages/Prospects';
import { Chat } from './pages/Chat';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';

// ... restante do código do componente App

function PrivateLayout() {
  const { pathname } = useLocation();
  const isChat = pathname === '/chat';

  return (
    <AuthGuard>
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        <Navbar />
        <main className={`flex-1 min-h-0 ${isChat ? 'overflow-hidden h-full' : 'overflow-y-auto'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
