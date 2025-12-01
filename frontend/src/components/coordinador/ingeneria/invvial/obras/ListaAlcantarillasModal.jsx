import React, { useRef, useEffect, useState } from 'react';
import DetalleAlcantarillaView from './DetalleAlcantarillaView';
import './ListaAlcantarillasModal.css';

const ListaAlcantarillasModal = ({ show, onClose, alcantarillasData, route, graphicsImages, initialSelectedAlcantarilla }) => {
  const modalRef = useRef();
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedAlcantarillaDetail, setSelectedAlcantarillaDetail] = useState(null);
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

      // Check if there is an initial selection
      if (initialSelectedAlcantarilla) {
        handleRowClick(initialSelectedAlcantarilla);
      } else {
        // Reset view when modal is reopened without initial selection
        setShowDetailView(false);
        setSelectedAlcantarillaDetail(null);
        setDetailedImages([]);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onClose, initialSelectedAlcantarilla]);

  const handleRowClick = (alcantarilla) => {
    // Set the selected manhole for detail view
    setSelectedAlcantarillaDetail(alcantarilla);

    // Filter images based on the selected manhole's photo panel code
    if (alcantarilla && alcantarilla.panel_fotografico_codigo && graphicsImages) {
      const code = alcantarilla.panel_fotografico_codigo;
      const parts = code.split(' - ');
      const rangePart = parts[0];
      const suffix = parts.length > 1 ? `-${parts[1]}` : '';

      const [startStr, endStr] = rangePart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

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

    // Switch to detail view
    setShowDetailView(true);
  };

  const handleCloseDetailView = () => {
    setShowDetailView(false);
    setSelectedAlcantarillaDetail(null);
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
            Lista de Alcantarillas
          </h2>

          {alcantarillasData && alcantarillasData.length > 0 ? (
            <div className="hide-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: '5px' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead style={{ position: 'sticky', top: '0', backgroundColor: '#f8f8f8', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Código</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Tipo</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Diámetro/Lado</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Longitud</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Progresiva</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #e0e0e0', textAlign: 'center', color: '#333' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alcantarillasData.sort((a, b) => {
                    const numA = parseInt(a.codigo.match(/\d+/)?.[0] || '0', 10);
                    const numB = parseInt(b.codigo.match(/\d+/)?.[0] || '0', 10);
                    return numA - numB;
                  }).map((element) => (
                    <tr key={element.id_alcantarilla} className="alcantarilla-row" onClick={() => handleRowClick(element)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.codigo}</td>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.tipo}</td>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.diametro_lado}</td>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.longitud_alcantarilla}</td>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.progresiva}</td>
                      <td style={{ padding: '12px', border: 'none', textAlign: 'center' }}>{element.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>
              <p>No hay alcantarillas para mostrar.</p>
            </div>
          )}
        </div>
      ) : (
        <DetalleAlcantarillaView
          alcantarilla={selectedAlcantarillaDetail}
          images={detailedImages}
          route={route}
          onCloseDetail={handleCloseDetailView}
        />
      )}
    </div>
  );
};

export default ListaAlcantarillasModal;
