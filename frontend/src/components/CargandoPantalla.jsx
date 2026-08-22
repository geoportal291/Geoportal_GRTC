import React from 'react';

/**
 * Indicador que se muestra mientras se descarga el código de una pantalla.
 * Las pantallas se cargan bajo demanda (React.lazy), así que la primera vez
 * que se entra a un módulo hay una espera breve; esto la hace visible.
 */
export default function CargandoPantalla({ mensaje = 'Cargando…' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        minHeight: '60vh',
        width: '100%',
        color: '#5a6b7d',
        fontSize: '0.95rem',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          border: '3px solid #dbe3ec',
          borderTopColor: '#2f6fb5',
          borderRadius: '50%',
          animation: 'cargando-giro 0.7s linear infinite',
        }}
      />
      <span>{mensaje}</span>
      <style>{`
        @keyframes cargando-giro { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes cargando-giro { to { transform: none; } }
        }
      `}</style>
    </div>
  );
}
