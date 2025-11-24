import React, { useState, useCallback } from 'react';
import './GestorProyectos.css'; // Reutilizaremos los estilos
import ListaProgresivas from '../../gestion_tramos/ListaProgresivas';
import GraficosProyecto from './GraficosProyecto';
import ReportesProyecto from './ReportesProyecto';
import FormularioProgresiva from '../../gestion_tramos/FormularioProgresiva'; // Importar el nuevo formulario

const DetalleProyecto = ({ proyecto, departamentos, provincias, distritos }) => {
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'graph', 'reports'
    const [showProgresivaForm, setShowProgresivaForm] = useState(false); // Estado para controlar la visibilidad del formulario
    const [refreshProgresivas, setRefreshProgresivas] = useState(0); // Estado para forzar la actualización de ListaProgresivas

    const handleSaveProgresiva = useCallback(() => {
        setRefreshProgresivas(prev => prev + 1); // Incrementar para forzar la actualización
        setShowProgresivaForm(false);
    }, []);

    if (!proyecto) {
        return <div className="detalle-vacio">Seleccione un proyecto para ver los detalles.</div>;
    }

    const getUbicacionNombre = (departamentoId, provinciaId, distritoId) => {
        const departamento = departamentos.find(d => d.id === departamentoId);
        const provincia = provincias.find(p => p.id === provinciaId);
        const distrito = distritos.find(d => d.id === distritoId);
        return `${departamento?.name || ''}, ${provincia?.name || ''}, ${distrito?.name || ''}`;
    };

    const handleNewProgresiva = () => {
        setShowProgresivaForm(true);
    };

    const handleCloseProgresivaForm = () => {
        setShowProgresivaForm(false);
    };

    return (
        <div className="detalle-proyecto-content">
            <div className="tabs">
                <div 
                    className={`tab ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    Progresivas
                </div>
                <div 
                    className={`tab ${activeTab === 'graph' ? 'active' : ''}`}
                    onClick={() => setActiveTab('graph')}
                >
                    Gráficos
                </div>
                <div 
                    className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    Reportes
                </div>
            </div>
            
            <div className={`tab-content ${activeTab === 'list' ? 'active' : ''}`} id="list-tab">
                <ListaProgresivas proyecto={proyecto} refreshTrigger={refreshProgresivas} />
            </div>
            
            <div className={`tab-content ${activeTab === 'graph' ? 'active' : ''}`} id="graph-tab">
                <GraficosProyecto proyectoId={proyecto.id} />
            </div>

            <div className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`} id="reports-tab">
                <ReportesProyecto proyectoId={proyecto.id} />
            </div>

            {showProgresivaForm && (
                <FormularioProgresiva 
                    onClose={handleCloseProgresivaForm} 
                    onSave={handleSaveProgresiva} 
                    proyectoId={proyecto.id} 
                />
            )}
        </div>
    );
};

export default DetalleProyecto;