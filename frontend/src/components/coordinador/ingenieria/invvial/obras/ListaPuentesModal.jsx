import React, { useRef, useEffect, useState } from 'react';
import DetallePuenteView from './DetallePuenteView'; // Importar la nueva vista de detalle
import './ListaAlcantarillasModal.css'; // Reutilizar CSS

const ListaPuentesModal = ({ show, onClose, puentesData, route, graphicsImages, initialSelectedPuente }) => {
  const modalRef = useRef();
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedPuenteDetail, setSelectedPuenteDetail] = useState(null);
  const [detailedImages, setDetailedImages] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);

      if (initialSelectedPuente) {
        handleRowClick(initialSelectedPuente);
      } else {
        setShowDetailView(false);
        setSelectedPuenteDetail(null);
        setDetailedImages([]);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onClose, initialSelectedPuente]);

  const handleRowClick = (puente) => {
    setSelectedPuenteDetail(puente);

    if (puente && puente.panel_fotografico_codigo && graphicsImages) {
      const code = String(puente.panel_fotografico_codigo);
      const parts = code.split(' - ');
      const rangePart = parts[0];
      const suffix = parts.length > 1 ? `-${parts[1]}` : '';

      let start, end;

      if (rangePart.includes('-')) {
        const [startStr, endStr] = rangePart.split('-');
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);
      } else {
        start = parseInt(rangePart, 10);
        end = start;
      }

      if (!isNaN(start) && !isNaN(end)) {
        const expectedNames = [];
        for (let i = start; i <= end; i++) {
          expectedNames.push(`${i}${suffix}`);
        }

        const filtered = graphicsImages.filter(img => {
          const imgNameWithoutExt = img.index.split('.')[0];
          return expectedNames.includes(imgNameWithoutExt);
        });
        setDetailedImages(filtered);
      } else {
        setDetailedImages([]);
      }
    } else {
      setDetailedImages([]);
    }

    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedPuenteDetail(null);
    setDetailedImages([]);
  };

  if (!show) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      fontFamily: 'Arial, sans-serif'
    }}>
      {!showDetailView ? (
        <div ref={modalRef} className="hide-scrollbar" style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: '900px',
          width: '95%',
          zIndex: 10001,
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#555'
          }}>&times;</button>

          <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
            Lista de Puentes
          </h2>

          {puentesData && puentesData.length > 0 ? (
            <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
              <table className="invvial-table">
                <thead>
                  <tr>
                    <th>Progresiva</th>
                    <th>Nombre</th>
                    <th>Clase</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {puentesData.sort((a, b) => {
                    const progA = a.progresiva || '';
                    const progB = b.progresiva || '';
                    return progA.localeCompare(progB, undefined, { numeric: true, sensitivity: 'base' });
                  }).map((element) => (
                    <tr key={element.id_puente} className="alcantarilla-row" onClick={() => handleRowClick(element)}>
                      <td>{element.progresiva}</td>
                      <td>{element.nombre}</td>
                      <td>{element.clase}</td>
                      <td>{element.tipo}</td>
                      <td>{element.estado}</td>
                      <td>
                        <button onClick={() => handleRowClick(element)} style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '8px 15px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            transition: 'background-color 0.2s ease'
                        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}>Ver Detalle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>
              <p>No hay puentes para mostrar.</p>
            </div>
          )}
        </div>
      ) : (
        <DetallePuenteView
          alcantarilla={selectedPuenteDetail}
          images={detailedImages}
          route={route}
          onCloseDetail={handleCloseDetailView}
        />
      )}
    </div>
  );
};

export default ListaPuentesModal;
