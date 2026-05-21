import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './data/contexts/AuthContext';
import L from 'leaflet';

// NO importar Cesium aquí - se cargará vía script tag en index.html
// Configurar Cesium antes de renderizar la app
window.CESIUM_BASE_URL = '/cesium/';

// Polyfill para globalThis en navegadores antiguos
if (typeof globalThis === 'undefined') {
  window.globalThis = window;
}

// Parche de seguridad para corregir el bug de tooltip de Leaflet:
// "TypeError: Cannot set properties of null (setting '_source')"
if (L && L.Layer && L.Layer.prototype) {
  // 1. Parche para _addFocusListenersOnLayer para evitar asignar _source a un tooltip nulo
  L.Layer.prototype._addFocusListenersOnLayer = function (layer) {
    if (typeof layer.getElement !== 'function') return;
    var el = layer.getElement();
    if (el) {
      this._safeAddFocusHandler = function () {
        if (this._tooltip) {
          this._tooltip._source = layer;
          this.openTooltip();
        }
      };

      L.DomEvent.on(el, 'focus', this._safeAddFocusHandler, this);
      L.DomEvent.on(el, 'blur', this.closeTooltip, this);
    }
  };

  // 2. Parche para _openTooltip con doble control de nulidad
  L.Layer.prototype._openTooltip = function (e) {
    if (!this._tooltip || !this._map) {
      return;
    }
    if (this._map.dragging && this._map.dragging.moving() && !this._openOnceFlag) {
      this._openOnceFlag = true;
      var that = this;
      this._map.once('moveend', function () {
        that._openOnceFlag = false;
        that._openTooltip(e);
      });
      return;
    }
    this._tooltip._source = e.layer || e.target;
    this.openTooltip(this._tooltip.options && this._tooltip.options.sticky ? e.latlng : undefined);
  };

  // 3. Parche para _moveTooltip con verificación de nulidad de _tooltip y options
  L.Layer.prototype._moveTooltip = function (e) {
    if (!this._tooltip) return;
    var latlng = e.latlng, containerPoint, layerPoint;
    if (this._tooltip.options && this._tooltip.options.sticky && e.originalEvent) {
      containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
      layerPoint = this._map.containerPointToLayerPoint(containerPoint);
      latlng = this._map.layerPointToLatLng(layerPoint);
    }
    this._tooltip.setLatLng(latlng);
  };

  // 4. Parche para openTooltip con doble control de nulidad
  L.Layer.prototype.openTooltip = function (latlng) {
    if (this._tooltip) {
      if (!(this instanceof L.FeatureGroup)) {
        this._tooltip._source = this;
      }
      if (this._tooltip._prepareOpen(latlng)) {
        this._tooltip.openOn(this._map);
        if (this.getElement) {
          this._setAriaDescribedByOnLayer(this);
        } else if (this.eachLayer) {
          this.eachLayer(this._setAriaDescribedByOnLayer, this);
        }
      }
    }
    return this;
  };

  // 5. Parche para unbindTooltip para limpiar correctamente los listeners focus
  L.Layer.prototype.unbindTooltip = function () {
    if (this._tooltip) {
      this._initTooltipInteractions(true);
      
      // Remover focus listeners agregados si existen para evitar fugas y errores
      if (this.getElement) {
        var el = this.getElement();
        if (el) {
          L.DomEvent.off(el, 'focus', this._safeAddFocusHandler, this);
          L.DomEvent.off(el, 'blur', this.closeTooltip, this);
        }
      } else if (this.eachLayer) {
        this.eachLayer(function (layer) {
          var el = typeof layer.getElement === 'function' && layer.getElement();
          if (el) {
            L.DomEvent.off(el, 'focus', this._safeAddFocusHandler, this);
            L.DomEvent.off(el, 'blur', this.closeTooltip, this);
          }
        }, this);
      }

      try {
        this.closeTooltip();
      } catch (err) {
        // Silenciar si ya está cerrado
      }
      this._tooltip = null;
    }
    return this;
  };
}

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
