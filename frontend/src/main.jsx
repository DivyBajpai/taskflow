import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './animations.css';
import './mobile-responsive.css';
// import { registerSW } from 'virtual:pwa-register'; // Disabled PWA

// PWA Service Worker registration disabled
/*
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // App is ready to work offline
  },
});
*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);