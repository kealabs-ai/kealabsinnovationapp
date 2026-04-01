import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

if (!localStorage.getItem('keaflow-theme')) {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('keaflow-theme', 'light');
}

createRoot(document.getElementById('root')!).render(<App />);
