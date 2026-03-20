import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './data/contexts/AuthContext'; // Importar AuthProvider
import * as Cesium from 'cesium';

window.CESIUM_BASE_URL = '/cesium/';

const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Cannot read properties of undefined (reading \'_leaflet_pos\')')) {
    // Ignorar este error específico
    return;
  }
  originalConsoleError(...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Envolver App con AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
