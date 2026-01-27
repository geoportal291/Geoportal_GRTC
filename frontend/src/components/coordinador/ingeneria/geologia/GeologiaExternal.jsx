import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '../../../../api/axios';
import { useAuth } from '../../../../data/contexts/AuthContext';
import { kml } from '@tmcw/togeojson'; // Ensure this package is installed or remove if not needed essentially
import { DOMParser } from 'xmldom';
import { GeoJSON } from 'react-leaflet';
import '../invvial/ExternalView.css';

// --- Icons ---
const getIcon = (type) => {
    let iconUrl = '/imgs/alcantarilla_icon.png';
    // Use geology icons defaults
    return L.icon({
        iconUrl,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const MapToolbar = ({ rightSidebarOpen, setRightSidebarOpen }) => {
    return (
        <div className="map-toolbar">
            <button
                className={`map-tool-btn ${rightSidebarOpen ? 'active' : ''}`}
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                title="Capas"
                style={{ borderBottom: '2px solid #eee' }}
            >
                <i className="fa-solid fa-layer-group"></i>
            </button>
            {/* Add more tools if needed */}
        </div>
    );
};

const GeologiaExternal = () => {
    const { selectedProjectId: projectId, user } = useAuth();
    const [projectData, setProjectData] = useState(null);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

    // Mock data for external view
    const [data, setData] = useState({
        muestras: [
            { lat: -13.52, lng: -71.95, codigo: 'M001', tipo: 'Roca' },
            { lat: -13.51, lng: -71.94, codigo: 'M002', tipo: 'Suelo' }
        ]
    });

    useEffect(() => {
        // Fetch project KML url etc.
        const fetchProject = async () => {
            if (!projectId) return;
            try {
                const res = await axiosInstance.get(`/api/proyectos/${projectId}`);
                setProjectData(res.data);
            } catch (e) { console.error(e); }
        };
        fetchProject();
    }, [projectId]);

    return (
        <div className={`external-view-container ${rightSidebarOpen ? 'sidebar-open' : ''}`}>
            <MapToolbar
                rightSidebarOpen={rightSidebarOpen}
                setRightSidebarOpen={setRightSidebarOpen}
            />

            <MapContainer
                center={[-13.5, -71.9]}
                zoom={12}
                style={{ height: '100vh', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                <ZoomControl position="topright" />

                {/* Markers */}
                {data.muestras.map((pt, i) => (
                    <Marker key={i} position={[pt.lat, pt.lng]} icon={getIcon('muestra')}>
                        <Popup>
                            <strong>Muestra {pt.codigo}</strong><br />
                            Tipo: {pt.tipo}
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Right Sidebar (Layers) */}
            <div className={`map-right-sidebar ${rightSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Capas Geología</h3>
                    <button onClick={() => setRightSidebarOpen(false)}>×</button>
                </div>
                <div className="sidebar-content">
                    <div className="layer-group">
                        <label>
                            <input type="checkbox" defaultChecked /> Muestras
                        </label>
                    </div>
                </div>
            </div>

            <style>{`
                /* Add specific overrides if needed, mostly using ExternalView.css */
                .external-view-container { position: relative; width: 100%; height: 100vh; overflow: hidden; }
                .map-right-sidebar {
                    position: absolute; top: 0; right: -300px; width: 300px; height: 100%;
                    background: white; z-index: 2000; transition: right 0.3s ease;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.1); padding: 20px;
                }
                .map-right-sidebar.open { right: 0; }
                .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            `}</style>
        </div>
    );
};

export default GeologiaExternal;
