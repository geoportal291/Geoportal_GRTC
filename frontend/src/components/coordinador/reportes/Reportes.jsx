import React, { useState } from 'react';
import './Reportes.css'; // Assuming a new CSS file for styling

const Reportes = () => {
  // Placeholder data for reports
  const [reports, setReports] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('Todas');

  const disciplines = ['Todas', 'Mecánica de Suelos', 'Tráfico', 'Geología', 'Seguridad Vial']; // Example disciplines

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = filterDiscipline === 'Todas' || report.discipline === filterDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  const handleDownload = (url) => {
    // In a real application, you might trigger a backend download or open in a new tab
    window.open(url, '_blank');
  };

  return (
    <div className="reports-dashboard-container">
      <div className="reports-header">
        <h2><i className="fas fa-file-alt"></i> Dashboard de Reportes</h2>
        <div className="reports-controls">
          <input
            type="text"
            placeholder="Buscar reporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="reports-search-input"
          />
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="reports-filter-select"
          >
            {disciplines.map(disc => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="reports-table-container">
        {filteredReports.length > 0 ? (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Nombre del Reporte</th>
                <th>Ingeniería</th>
                <th>Fecha de Subida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>{report.name}</td>
                  <td>{report.discipline}</td>
                  <td>{report.date}</td>
                  <td>
                    <button onClick={() => handleDownload(report.url)} className="btn-action btn-download">
                      <i className="fas fa-download"></i> Descargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">
            <i className="fas fa-info-circle"></i>
            <p>No se encontraron reportes que coincidan con los criterios de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;