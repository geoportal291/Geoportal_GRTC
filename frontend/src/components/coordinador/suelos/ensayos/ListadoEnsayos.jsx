import React from 'react';

export default function ListadoEnsayos({ ensayos, loading, onSelectEnsayo, error }) {
    if (loading) {
        return <div className="text-center mt-4">Cargando ensayos...</div>;
    }

    if (error) {
        return <div className="alert alert-danger mt-4">{error}</div>;
    }

    if (!ensayos || ensayos.length === 0) {
        return <div className="alert alert-info mt-4">No hay ensayos registrados para este tramo.</div>;
    }

    return (
        <div className="listado-ensayos-container mt-4">
            <h3>Ensayos del Tramo</h3>
            <div className="table-responsive">
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Código</th>
                            <th>Tipo Ensayo</th>
                            <th>Progresiva</th>
                            <th>Estrato</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ensayos.map(ensayo => (
                            <tr key={ensayo.id}>
                                <td>{ensayo.displayCode || ensayo.id}</td>
                                <td>{ensayo.tipo_ensayo_descripcion || 'N/A'}</td>
                                <td>{ensayo.progresiva_codigo || 'N/A'}</td>
                                <td>{ensayo.estrato_descripcion || 'N/A'}</td>
                                <td>{new Date(ensayo.fecha).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className="btn btn-primary btn-sm" 
                                        onClick={() => onSelectEnsayo(ensayo.id)}
                                    >
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
