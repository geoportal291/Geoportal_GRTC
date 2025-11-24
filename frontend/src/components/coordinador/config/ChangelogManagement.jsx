import React, { useState } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import { usePageTitle } from '../../contexts/PageTitleContext';
import { useEffect } from 'react';

import './ChangelogManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

export default function ChangelogManagement() {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Gestión de Novedades');
  }, [setPageTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('usuario') ? JSON.parse(localStorage.getItem('usuario')).token : null; // Obtener el token del usuario logueado

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/changelog`,
        { version, title, content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.status === 'ok') {
        alertify.success('Novedad publicada correctamente!');
        setVersion('');
        setTitle('');
        setContent('');
      } else {
        alertify.error(res.data.message || 'Error al publicar novedad.');
      }
    } catch (err) {
      console.error('Error al publicar novedad:', err);
      const errorMessage = err.response?.data?.error || 'Error al conectar con el servidor.';
      alertify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="changelog-management-container">
      <h1>Publicar Nueva Novedad</h1>
      <form onSubmit={handleSubmit} className="changelog-form">
        <div className="form-group">
          <label htmlFor="version">Versión:</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="Ej: 0.1.0-alpha.1"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="title">Título:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Mejoras en la interfaz de usuario"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Contenido (una línea por cambio):</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="- Se añadió la funcionalidad X\n- Se corrigió el error Y\n- Se mejoró el rendimiento Z"
            rows="10"
            required
          ></textarea>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar Novedad'}
        </button>
      </form>
    </div>
  );
}