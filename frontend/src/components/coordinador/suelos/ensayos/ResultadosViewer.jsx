import React from 'react';

// Este componente recibe un objeto de datos y lo muestra.
export default function ResultadosViewer({ data }) {
    if (!data) {
        return <div className="alert alert-info">Aún no se han calculado resultados. Complete y guarde el formulario.</div>;
    }

    // Filtrar y formatear los datos para una mejor visualización
    const formatKey = (key) => {
        return key
            .replace(/_/g, ' ') // Reemplazar guiones bajos por espacios
            .replace(/\b(\w)/g, s => s.toUpperCase()); // Capitalizar cada palabra
    };

    const formatValue = (value) => {
        if (typeof value === 'number') {
            return value.toFixed(2); // Redondear números a 2 decimales
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value); // Mostrar objetos como JSON
        }
        return String(value);
    };

    return (
        <div className="table-responsive">
            <table className="table table-sm table-bordered table-striped">
                <thead className="table-dark">
                    <tr>
                        <th>Parámetro</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map(([key, value]) => (
                        <tr key={key}>
                            <td>{formatKey(key)}</td>
                            <td>{formatValue(value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
