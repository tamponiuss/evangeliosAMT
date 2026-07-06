import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './CapaGUI/AuthContext';
import './CapaGUI/estilos.css';

const el = document.getElementById('root');
if (!el) throw new Error('root no encontrado');

createRoot(el).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
