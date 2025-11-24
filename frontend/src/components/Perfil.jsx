import React, { useState, useEffect } from 'react';
import './Perfil.css';
import { FaUser, FaEnvelope, FaBuilding, FaBriefcase, FaCalendarAlt, FaCog, FaIdCard } from 'react-icons/fa';
import { useAuth } from '../data/contexts/AuthContext';

const Perfil = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setUserData(user);
        } else {
            setError('No se encontraron datos de usuario. Por favor, inicie sesión de nuevo.');
        }
    }, [user]);

    if (error) {
        return <div className="perfil-error-container">{error}</div>;
    }

    if (!userData) {
        return <div className="perfil-loading-container">Cargando perfil...</div>;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const nombreCompleto = `${userData.nombre || ''} ${userData.ap_paterno || ''} ${userData.ap_materno || ''}`.trim();

    return (
        <div className="perfil-container">
            <header className="perfil-header">
            </header>

            <main className="perfil-main-content">
                <div className="perfil-card perfil-card-left">
                    <div className="perfil-avatar-section">
                        <div className="perfil-avatar-placeholder">
                        <FaUser className="perfil-avatar-icon" />
                    </div>
                        <h2>{nombreCompleto || 'Nombre no disponible'}</h2>
                        <p className="perfil-rol">{userData.rol_nombre || 'Rol no definido'}</p>
                    </div>
                    <div className="perfil-actetions">
                        <button className="action-btn">Solicitar Cambiar Contraseña</button>
                    </div>
                </div>

                <div className="perfil-card perfil-card-right">
                    <h3>Información General</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <FaUser className="info-icon" />
                            <div>
                                <span className="info-label">Nombre de Usuario</span>
                                <p>{userData.usuario || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaIdCard className="info-icon" />
                            <div>
                                <span className="info-label">DNI</span>
                                <p>{userData.dni || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaEnvelope className="info-icon" />
                            <div>
                                <span className="info-label">Correo Electrónico</span>
                                <p>{userData.correo || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaCalendarAlt className="info-icon" />
                            <div>
                                <span className="info-label">Miembro desde</span>
                                <p>{formatDate(userData.creado_en)}</p>
                            </div>
                        </div>
                    </div>

                    <hr className="divider" />

                    <h3>Detalles Laborales</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <FaBriefcase className="info-icon" />
                            <div>
                                <span className="info-label">Especialidad</span>
                                <p>{userData.especialidad_nombre || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaUser className="info-icon" />
                            <div>
                                <span className="info-label">Tipo de Usuario</span>
                                <p>{userData.tipo_user || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaBriefcase className="info-icon" />
                            <div>
                                <span className="info-label">Nivel</span>
                                <p>{userData.nivel || 'No disponible'}</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaBriefcase className="info-icon" />
                            <div>
                                <span className="info-label">Subnivel</span>
                                <p>{userData.subnivel || 'No disponible'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Perfil;