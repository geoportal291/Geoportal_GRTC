import React, { useState, useEffect } from 'react';
import './FormatosRecoleccionTab.css';

const pdfFiles = {
  CV: {
    name: 'Clasificacion Vehicular',
    url: 'https://ikdfvx3qktpvypgb.public.blob.vercel-storage.com/formato_de_recoleccion/Aforos%20Vehiculares.pdf',
  },
  EV: {
    name: 'Encuesta de Velocidad',
    url: 'https://ikdfvx3qktpvypgb.public.blob.vercel-storage.com/formato_de_recoleccion/encuesta%20de%20velocidad.pdf',
  },
  OD: {
    name: 'Encuesta OD Pasajeros',
    url: 'https://ikdfvx3qktpvypgb.public.blob.vercel-storage.com/formato_de_recoleccion/Encuesta%20OD%20Pasajeros.pdf',
  },
  CC: {
    name: 'Censo de Carga',
    url: 'https://ikdfvx3qktpvypgb.public.blob.vercel-storage.com/formato_de_recoleccion/Censo%20de%20Carga.pdf',
  },
};

const FormatosRecoleccionTab = () => {
  const [activePdf, setActivePdf] = useState('IMD'); 
  const [isLoading, setIsLoading] = useState(true); 

  //funcion para obtener la URL del visor de Google Docs para PDFs
  const getPdfViewerUrl = (fileUrl) => {
    if (!fileUrl) return '';
    return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };

  const handleDownload = () => {
    if (activePdf && pdfFiles[activePdf]) {
      const fileUrl = pdfFiles[activePdf].url;
      const fileName = pdfFiles[activePdf].name + '.pdf';
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSetActivePdf = (key) => {
    setIsLoading(true); 
    setActivePdf(key);
  };

  const handleIframeLoad = () => {
    setIsLoading(false); 
  };

  return (
    <div className="formatos-recoleccion-container">
      <div className="buttons-panel">
        <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>Formatos Disponibles</h3>
        {Object.keys(pdfFiles).map((key) => (
          <button
            key={key}
            className={`format-button ${activePdf === key ? 'active' : ''}`}
            onClick={() => handleSetActivePdf(key)}
            disabled={isLoading && activePdf === key} 
          >
            {key === 'OD' ? <><span>O/D</span><br/><span>Encuesta Origen/Destino</span></> : key === 'CC' ? <><span>C/C</span><br/><span>Censo De Cargas</span></> : key === 'CV' ? <><span>CV</span><br/><span>Clasificacion Vehicular</span></> : key === 'EV' ? <><span>EV</span><br/><span>Estudio De Velocidades</span></> : key}
          </button>
        ))}
      </div>
      <div className="viewer-panel">
        {activePdf && pdfFiles[activePdf] ? (
          <>
            {isLoading && (
              <div className="loading-spinner-container">
                <div className="loading-spinner"></div>
                <p>Cargando PDF...</p>
              </div>
            )}
            <iframe
              src={getPdfViewerUrl(pdfFiles[activePdf].url)}
              title={`Visor de ${pdfFiles[activePdf].name}`}
              style={{ width: '100%', height: '100%', border: 'none', display: isLoading ? 'none' : 'block' }} 
              allowFullScreen
              webkitallowfullscreen="true"
              onLoad={handleIframeLoad} 
            ></iframe>
            {!isLoading && (
              <button className="download-viewer-button" onClick={handleDownload}>
                Descargar
              </button>
            )}
          </>
        ) : (
          <p>Selecciona un formato para visualizar.</p>
        )}
      </div>
    </div>
  );
};

export default FormatosRecoleccionTab;  
