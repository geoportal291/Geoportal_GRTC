import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axios';
import { usePageTitle } from '../../contexts/PageTitleContext';
import './Auditoria.css';

const Auditoria = () => {
  const { setPageTitle } = usePageTitle();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axiosInstance.get('/api/audit/logs');
        setLogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [setPageTitle]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDetalles = (detalles) => {
    try {
      // First, check if it's a string that looks like a JSON object or array
      if (typeof detalles === 'string' && (detalles.trim().startsWith('{') || detalles.trim().startsWith('['))) {
        const parsed = JSON.parse(detalles);
        return JSON.stringify(parsed); // Stringify without pretty-printing
      }
      // If it's not a JSON-like string, return it as is
      return detalles;
    } catch (error) {
      // If JSON.parse fails, return the original string
      return detalles;
    }
  };

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(logs.length / logsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="auditoria-container">
      <h2>Registros de Auditoría</h2>
      {loading ? (
        <p className="loading-text">Cargando...</p>
      ) : (
        <>
          <table className="auditoria-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalles</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.usuario}</td>
                  <td>{log.accion}</td>
                  <td>
                    <pre>{formatDetalles(log.detalles)}</pre>
                  </td>
                  <td>{formatTimestamp(log.creado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-controls">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">
              Anterior
            </button>
            <span className="page-info">
              Página {currentPage} de {totalPages}
            </span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage >= totalPages} className="pagination-button">
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Auditoria;
