import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axios';
import { usePageTitle } from '@/data/contexts/PageTitleContext';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.css';
import './Auditoria.css';

const Auditoria = () => {
  const { setPageTitle } = usePageTitle();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

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

  useEffect(() => {
    fetchLogs();
  }, [setPageTitle]);

  const handleClearLogs = () => {
    alertify.confirm(
      'Limpiar Auditoría',
      '¿Estás seguro de que deseas eliminar todos los registros de auditoría? Esta acción no se puede deshacer.',
      async () => {
        try {
          await axiosInstance.delete('/api/audit/logs');
          alertify.success('Registros de auditoría limpiados correctamente.');
          setLogs([]);
          setCurrentPage(1);
        } catch (error) {
          console.error('Error al limpiar logs:', error);
          alertify.error('Error al limpiar los registros.');
        }
      },
      () => {}
    ).set('labels', {ok:'Sí, Limpiar', cancel:'Cancelar'});
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDetalles = (detalles) => {
    try {
      if (typeof detalles === 'string' && (detalles.trim().startsWith('{') || detalles.trim().startsWith('['))) {
        const parsed = JSON.parse(detalles);
        return JSON.stringify(parsed);
      }
      return detalles;
    } catch (error) {
      return detalles;
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Registros de Auditoría</h2>
        <button 
          onClick={handleClearLogs} 
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            padding: '10px 15px', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Limpiar Auditoría
        </button>
      </div>
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
