import React from 'react';

const SubirImagenesAlcantarillasView = ({
  filesToUpload,
  isUploading,
  pollingJobId,
  handleFileChange,
  handleImageUploadProcess,
  handleDeleteAllGraphicImages,
  uploadStatus,
  uploadProgress,
  etr,
  formatEtr,
  graphicsImages,
  searchTerm,
  setSearchTerm,
  handleDeleteGraphicImage,
  setPreviewImageUrl,
  setIsPreviewModalOpen,
  setModalViewMode,
  setUploadStatus,
  setGraphicsImages,
}) => {

  const imagesWithoutDash = graphicsImages.filter(img => !img.index.includes('-'));
  const imagesWithDash = graphicsImages.filter(img => img.index.includes('-'));

  const filteredImagesWithoutDash = imagesWithoutDash.filter(img => img.index.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredImagesWithDash = imagesWithDash.filter(img => img.index.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortFn = (a, b) => a.index.localeCompare(b.index, undefined, { numeric: true, sensitivity: 'base' });
  imagesWithoutDash.sort(sortFn);
  imagesWithDash.sort(sortFn);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{color: '#333'}}>Subir Imágenes de Gráficos</h3>
      <p>Sube directamente las imágenes (.jpg, .png) o un archivo comprimido (.rar) que las contenga.</p>
      <p style={{fontSize: '0.8em', color: '#666'}}>Para archivos grandes (más de 10MB), solo se puede subir un archivo a la vez.</p>
      
      <input 
        type="file" 
        accept="image/png, image/jpeg, .rar" 
        multiple 
        onChange={handleFileChange} 
        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
        disabled={isUploading || pollingJobId}
      />

      {(isUploading || uploadProgress > 0) && !pollingJobId && (
        <div style={{ marginTop: '10px' }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
              <p>{uploadStatus.message}</p>
              <p style={{fontSize: '0.8em', color: '#333'}}>{formatEtr(etr)}</p>
          </div>
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
            <div style={{
              width: `${uploadProgress}%`,
              backgroundColor: '#007bff',
              height: '20px',
              borderRadius: '5px',
              textAlign: 'center',
              color: 'white',
              lineHeight: '20px',
              transition: 'width 0.4s ease'
            }}>
              {uploadProgress > 0 && `${uploadProgress}%`}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
              onClick={handleImageUploadProcess} 
              disabled={!filesToUpload || isUploading || pollingJobId} 
              style={{ 
                  backgroundColor: (!filesToUpload || isUploading || pollingJobId) ? '#ccc' : '#007bff', 
                  color: 'white', 
                  padding: '12px 20px', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer' 
              }}
          >
              {isUploading ? 'Subiendo...' : 'Subir Archivos'}
          </button>
          <button 
              onClick={handleDeleteAllGraphicImages} 
              disabled={isUploading || pollingJobId} 
              style={{ 
                  backgroundColor: (isUploading || pollingJobId) ? '#ccc' : '#dc3545', 
                  color: 'white', 
                  padding: '12px 20px', 
                  border: 'none', 
                  borderRadius: '5px', 
                  cursor: 'pointer' 
              }}
          >
              Eliminar Todas las Imágenes
          </button>
      </div>
      
      {pollingJobId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
              <div className="loader-spinner"></div>
              <p style={{ color: '#333', fontStyle: 'italic' }}>{uploadStatus.message}</p>
          </div>
      )}

      {uploadStatus.message && !isUploading && !pollingJobId && <p style={{ color: uploadStatus.type === 'error' ? 'red' : 'green', textAlign: 'center', marginTop: '10px' }}>{uploadStatus.message}</p>}
      
      {graphicsImages.length > 0 && (
        <>
          <input
            type="text"
            placeholder="Buscar imágenes por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '10px' }}
          />
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
            
            {/* Block for images without dash */}
            {filteredImagesWithoutDash.length > 0 && (
              <div>
                <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Imágenes Principales</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {filteredImagesWithoutDash.map((img) => (
                    <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center', position: 'relative', width: '160px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', fontWeight: 'bold', wordBreak: 'break-all' }}>{img.index}</p>
                      <img src={`${img.url}?v=${img.id}`} alt={`Gráfico ${img.index}`} style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }} />
                      <button onClick={() => handleDeleteGraphicImage(img.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8em', marginTop: '5px', transition: 'background-color 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}>Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Block for images with dash */}
            {filteredImagesWithDash.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '10px' }}>Imágenes Adicionales (con guión)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {filteredImagesWithDash.map((img) => (
                    <div key={img.id} style={{ border: '1px solid #ddd', padding: '5px', borderRadius: '5px', textAlign: 'center', position: 'relative', width: '160px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9em', fontWeight: 'bold', wordBreak: 'break-all' }}>{img.index}</p>
                      <img src={`${img.url}?v=${img.id}`} alt={`Gráfico ${img.index}`} style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', cursor: 'pointer' }} onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }} />
                      <button onClick={() => handleDeleteGraphicImage(img.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8em', marginTop: '5px', transition: 'background-color 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}>Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}
      <button type="button" onClick={() => { setModalViewMode('list'); setUploadStatus({ message: '', type: '' }); setGraphicsImages([]); }} style={{
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s ease'
      }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}>Volver a la Lista</button>
    </div>
  );
};

export default SubirImagenesAlcantarillasView;
