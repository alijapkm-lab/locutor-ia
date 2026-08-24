import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR websocket connection errors in preview sandbox
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes('WebSocket') ||
        event.reason.message?.includes('failed to connect to websocket') ||
        String(event.reason).includes('WebSocket closed without opened'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
