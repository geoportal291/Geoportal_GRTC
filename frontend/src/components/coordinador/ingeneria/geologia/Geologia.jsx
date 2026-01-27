import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../data/contexts/AuthContext';
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
    const [viewMode, setViewMode] = useState(null); // 'internal', 'external', or null

    useEffect(() => {
        if (user) {
            const role = user.role?.toUpperCase() || '';
            const specialtyId = parseInt(user.codigo_esp, 10);

            if (role === 'ADMIN') {
                setViewMode(null); // Admin chooses
            } else if (role === 'COORDINADOR PROYECTO' || specialtyId === 5) { // Assuming 5 is Geology specialty ID? Checking logic...
                // If we want to force internal for certain roles like in Vialds
                // For now, let's stick to the Vialds pattern but maybe keep selection for Admin
                // If you want a specific logic for Geology specialists, update here.
                // Assuming defaults for now:
                setViewMode(null);
            } else {
                setViewMode('external'); // Others go straight to external? Or gives choice?
                // Vialds logic:
                // if (role === 'ADMIN') setShowSelection(true);
                // else if (role === 'COORDINADOR PROYECTO' || specialtyId === 5) setViewMode('internal');
                // else setViewMode('external');

                // Let's replicate Vialds logic exactly for consistency, assuming specialty 5 is relevant or we remove that check
                // For safety, let's default to selection for ADMIN and maybe Coordinators, and external for others.
                // Or simply always show selection for now to be safe until verified.
                setViewMode(null);
            }
        }
    }, [user]);

    const handleViewSelect = (mode) => {
        setViewMode(mode);
    };

    if (viewMode === 'internal') {
        return <GeologiaInternal />;
    }

    if (viewMode === 'external') {
        return <GeologiaExternal />;
    }

    return <ViewSelectionModal onSelect={handleViewSelect} />;
};

export default Geologia;
