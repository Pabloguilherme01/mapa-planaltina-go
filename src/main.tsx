import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { signalGoogleMapsUnavailable } from './utils/googleMapsErrors.ts';

// Google Maps chama este callback global quando a autenticação da API falha.
// O provider ativo consome o evento e degrada para o mapa esquemático DEMO.
(window as any).gm_authFailure = signalGoogleMapsUnavailable;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => {
        console.warn('Falha ao registrar suporte offline:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
