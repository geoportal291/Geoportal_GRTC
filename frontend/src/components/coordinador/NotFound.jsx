// src/components/NotFound.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../imgs/Gtrc_login.png';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/coordinador/cordinadords');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-logo-wrapper">
          <img
            src={logo}
            alt="GTRC Logo"
            className="notfound-logo"
          />
        </div>
        <h1 className="notfound-title">404 - Página no encontrada</h1>
        <p className="notfound-message">
          Lo sentimos, la ruta que buscaste no existe. Serás redirigido al inicio en 5 segundos.
        </p>
        <Link to="/coordinador/cordinadords" className="notfound-button">
          Volver al inicio ahora
        </Link>
      </div>
    </div>
  );
}
