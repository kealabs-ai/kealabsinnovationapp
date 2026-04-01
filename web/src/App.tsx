import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Builder } from './pages/Builder';
import { Settings } from './pages/Settings';
import { Chat } from './pages/Chat';
import { Prospects } from './pages/Prospects';
import { Users } from './pages/Users';

function PrivateLayout() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
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
