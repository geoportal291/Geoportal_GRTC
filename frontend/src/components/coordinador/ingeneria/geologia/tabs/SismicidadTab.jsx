import React, { useState } from 'react';
import './GeologiaTab.css';
import GeologiaGeoite from '../map/GeologiaGeoite';
import GeologiaLayerManager from '../map/GeologiaLayerManager';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SismicidadTab = ({ projectData }) => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [sismicidadUrl, setSismicidadUrl] = useState(null);
    const [loadingCapa, setLoadingCapa] = useState(true);

    React.useEffect(() => {
        const projectId = projectData?.id_proyecto || projectData?.id;
        if (!projectId) { setLoadingCapa(false); return; }
        setLoadingCapa(true);
        import('../../../../../api/axios').then(({ default: axiosInstance }) => {
            axiosInstance.get(`/proyectos/${projectId}/geologia-capas/sismicidad`).then(res => {
                setSismicidadUrl(res.data?.data?.file_url || null);
            }).catch(() => setSismicidadUrl(null)).finally(() => setLoadingCapa(false));
        });
    }, [projectData, mapKey]);

    const chartData = {
        labels: ['50', '100', '200', '475', '1000', '2475'],
        datasets: [
            {
                label: 'Aceleración Máxima PGA (g)',
                data: [0.15, 0.22, 0.28, 0.35, 0.42, 0.50],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: 'Periodo de Retorno (años)' } },
            y: { title: { display: true, text: 'PGA (g)' }, beginAtZero: true }
        },
        plugins: {
            legend: { position: 'top' },
        }
    };

    const isImage = sismicidadUrl && sismicidadUrl.match(/\.(jpeg|jpg|png|gif)$/i) != null;
    const isPdf = sismicidadUrl && sismicidadUrl.match(/\.pdf$/i) != null;

    let mapContent = <GeologiaGeoite key={mapKey} mapData={[]} tabName="sismicidad" projectId={projectData?.id_proyecto || projectData?.id} />;

    if (loadingCapa) {
        mapContent = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666' }}>Cargando capa visual...</div>;
    } else if (isImage) {
        mapContent = <img src={sismicidadUrl} alt="Mapa Sismicidad" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#f3f4f6' }} />;
    } else if (isPdf) {
        mapContent = <iframe src={sismicidadUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Mapa Sismicidad PDF" />;
    }

    return (
        <div className={`geoltab-layout ${isMapExpanded ? 'collapsed' : ''}`}>
            {/* Panel de descripción */}
            <div className="geoltab-info-panel">
                <h2 className="geoltab-section-title">Sismicidad y Peligro Sísmico</h2>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Contexto Sismotectónico</h3>
                    <p className="geoltab-block-text">
                        El área del proyecto se ubica en una zona de peligro sísmico moderado a alto,
                        producto de la interacción convergente entre las placas de Nazca y Sudamericana.
                        Este ambiente tectónico genera sismos interplaca superficiales e intermedios,
                        y eventos intraplaca asociados a fallas corticales activas.
                    </p>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Parámetros Sísmicos (Norma E.030)</h3>
                    <ul className="geoltab-list">
                        <li>
                            <span className="geoltab-tag geoltab-tag-red">Zonificación</span>
                            <strong>Zona 3:</strong> Sismicidad Alta. El PGA esperado en roca rígida es de 0.35g para un sismo con periodo de retorno de 475 años (10% excedencia en 50 años).
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-orange">Condiciones Geotécnicas</span>
                            <strong>Perfil Tipo S2 / S3:</strong> Suelos medianamente rígidos a blandos. Se espera amplificación sísmica en los depósitos cuaternarios (Llanuras Aluviales).
                        </li>
                        <li>
                            <span className="geoltab-tag geoltab-tag-blue">Falla Activa Cercana</span>
                            El Sistema de Fallas Matoriato se encuentra a escasos kilómetros, considerándose una fuente sismogénica cortical capaz de producir eventos de magnitud Mw 6.5 - 7.0.
                        </li>
                    </ul>
                </div>

                <div className="geoltab-block">
                    <h3 className="geoltab-block-title">Curva de Peligro Sísmico MRA</h3>
                    <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Panel del mapa */}
            <div className="geoltab-map-panel">
                <div className="geoltab-map-header">
                    <span className="geoltab-map-label">MAPAS TEMÁTICOS DE SISMICIDAD</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <GeologiaLayerManager tabName="sismicidad" projectData={projectData} onUploadSuccess={() => setMapKey(prev => prev + 1)} accept=".kml,.kmz,.rar,.zip,.pdf,.jpg,.jpeg,.png" />
                        <button type="button" onClick={() => setIsMapExpanded(!isMapExpanded)} className="geoltab-expand-btn">
                            {isMapExpanded ? '◩ Mostrar Información' : '⛶ Expandir Mapa'}
                        </button>
                    </div>
                </div>
                <div className="geoltab-map-container" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, backgroundColor: (isImage || isPdf) ? '#f3f4f6' : 'transparent', overflow: 'hidden' }}>
                    {mapContent}
                </div>
                <div className="geoltab-legend">
                    <div className="geoltab-legend-title">Capas Sísmicas</div>
                    {[
                        { color: '#ef4444', label: 'Epicentros Históricos (Mw > 6.0)' },
                        { color: '#f97316', label: 'Epicentros Instrumentales (Mw < 6.0)' },
                        { color: '#000000', label: 'Fuentes Sismogénicas Corticales' },
                        { color: '#eab308', label: 'Zonificación Sísmica (Isoseistas)' },
                    ].map(l => (
                        <div className="geoltab-legend-item" key={l.label}>
                            <span className="geoltab-legend-dot" style={{ backgroundColor: l.color }} />
                            <span className="geoltab-legend-label">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div >
        </div >
    );
};

export default SismicidadTab;





