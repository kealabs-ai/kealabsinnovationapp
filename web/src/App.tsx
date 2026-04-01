import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthGuard } from './components/AuthGuard';
import { Dashboard } from './pages/Dashboard';
import { Builder } from './pages/Builder';
import { Settings } from './pages/Settings';
import { Chat } from './pages/Chat';
import { Prospects } from './pages/Prospects';
import { Users } from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
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
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthGuard>
    </BrowserRouter>
  );
}
