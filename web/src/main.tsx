import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Garante tema claro como padrão se não houver preferência salva
if (!localStorage.getItem('keaflow-theme')) {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('keaflow-theme', 'light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
