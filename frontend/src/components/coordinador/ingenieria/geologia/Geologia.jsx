import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/data/contexts/AuthContext';
import GeologiaInternal from './GeologiaInternal';
import GeologiaExternal from './GeologiaExternal';

const ViewSelectionModal = ({ onSelect }) => {
    return (
        <div className="view-selection-overlay">
            <div className="view-selection-card">
                <h3>Bienvenido al Geoportal - Geología</h3>
                <p>Seleccione el modo de visualización:</p>

                <div className="view-options">
                    <div className="view-option" onClick={() => onSelect('internal')}>
                        <div className="icon-box">📊</div>
                        <h4>Gestión Interna</h4>
                        <p>Administración y edición de datos geológicos.</p>
                    </div>

                    <div className="view-option" onClick={() => onSelect('external')}>
                        <div className="icon-box">🗺️</div>
                        <h4>Vista Externa</h4>
                        <p>Visualización geográfica interactiva.</p>
                    </div>
                </div>
            </div>
            <style>{`
                .view-selection-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.8); z-index: 9999;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(5px);
                }
                .view-selection-card {
                    background: white; padding: 40px; border-radius: 20px;
                    text-align: center; max-width: 600px; width: 90%;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    font-family: 'Segoe UI', sans-serif;
                }
                .view-selection-card h3 { margin-top: 0; color: #333; font-size: 1.8rem; }
                .view-options {
                    display: flex; gap: 20px; margin-top: 30px;
                    justify-content: center;
                }
                .view-option {
                    flex: 1; padding: 20px; border-radius: 12px;
                    border: 2px solid #eee; cursor: pointer;
                    transition: all 0.3s ease;
                }
                .view-option:hover {
                    border-color: #0056b3; transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,86,179,0.1);
                }
                .icon-box { font-size: 3rem; margin-bottom: 10px; }
                .view-option h4 { margin: 10px 0; color: #0056b3; font-weight: bold; }
                .view-option p { font-size: 0.9rem; color: #666; }
            `}</style>
        </div>
    );
};

const Geologia = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState(null); // 'internal', 'external', or null
    const [isEvaluador, setIsEvaluador] = useState(false);

    useEffect(() => {
        if (user) {
            const role = user.rol_nombre?.toUpperCase() || user.role?.toUpperCase() || '';
            const specialtyId = parseInt(user.codigo_esp, 10);
            const roleId = parseInt(user.rol_id, 10);

            // Regla 1 (MÁS ESPECÍFICA): Evaluadores (Rol 6) van directo a la vista externa.
            if (roleId === 6) {
                setIsEvaluador(true);
                setViewMode('external');
            }
            // Regla 2: Administradores y Especialistas en Geología (esp 2) eligen vista.
            else if (role === 'ADMIN' || specialtyId === 2) {
                setIsEvaluador(false);
                setViewMode(null); // Muestra el modal de selección
            }
            // Por defecto para cualquier otro usuario, vista externa.
            else {
                setIsEvaluador(false);
                setViewMode('external');
            }
        }
    }, [user]);

    const handleViewSelect = (mode) => {
        setViewMode(mode);
    };

    // El comportamiento del botón "Volver" depende del rol:
    // - Evaluadores: vuelven al dashboard principal (no deben ver el selector)
    // - Otros: vuelven al selector de vistas
    const handleBack = () => {
        if (isEvaluador) {
            navigate('/coordinador/dashboardprincipal');
        } else {
            setViewMode(null);
        }
    };

    if (viewMode === 'internal') {
        return <GeologiaInternal />;
    }

    if (viewMode === 'external') {
        return <GeologiaExternal onBack={handleBack} />;
    }

    return <ViewSelectionModal onSelect={handleViewSelect} />;
};

export default Geologia;
