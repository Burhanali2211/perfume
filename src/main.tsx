import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize critical utilities immediately
import './utils/networkErrorHandler';
import './utils/consoleErrorSuppression';

// Render the app immediately
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize non-critical utilities after render to avoid blocking
setTimeout(() => {
  // Initialize service worker after app is rendered
  import('./utils/serviceWorker').catch(console.error);
}, 1000);
