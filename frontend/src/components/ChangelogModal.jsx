import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../data/contexts/AuthContext'; // Importar useAuth

const API_BASE_URL = process.env.REACT_APP_API_BASE || 'https://backend-nameless-log-55.fly.dev';

const ChangelogModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [changelog, setChangelog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Obtener el usuario del contexto

  useEffect(() => {
    const fetchChangelog = async () => {
      if (!user || !user.token) { // Verificar si el usuario y el token existen
        setLoading(false);
        setError('No autenticado para cargar las novedades.');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/changelog/latest`, {
          headers: {
            Authorization: `Bearer ${user.token}` // Adjuntar el token
          }
        });
        const latestChangelog = response.data;

        const lastSeenVersion = localStorage.getItem('lastSeenChangelogVersion');

        if (latestChangelog && latestChangelog.version !== lastSeenVersion) {
          setChangelog(latestChangelog);
          setShowModal(true);
        }
      } catch (err) {
        console.error('Error fetching changelog:', err);
        setError('Error al cargar las novedades.');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, [user]); // Añadir user a las dependencias del useEffect

  const handleCloseModal = () => {
    if (changelog) {
      localStorage.setItem('lastSeenChangelogVersion', changelog.version);
    }
    setShowModal(false);
  };

  if (loading) {
    return null; // O un spinner de carga si lo prefieres
  }

  if (error) {
    return <div className="changelog-error">{error}</div>;
  }

  if (!showModal || !changelog) {
    return null;
  }

  return (
    <div className="changelog-overlay">
      <div className="changelog-modal">
        <h2>Novedades - Versión {changelog.version}</h2>
        <h3>{changelog.title}</h3>
        <div className="changelog-content">
          {changelog.content.split('\n').map((item, index) => (
            <p key={index}>{item}</p>
          ))}
        </div>
        <button onClick={handleCloseModal}>Entendido</button>
      </div>
    </div>
  );
};

export default ChangelogModal;

