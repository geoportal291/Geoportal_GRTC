import React, { useState } from 'react';
import './SubirImagenesAlcantarillasView.css';

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

  handleBulkOcr, // New Bulk Prop
  bulkProgress,
  bulkEtr,
  entregableToUpload,
  setEntregableToUpload,
  isExplorerOpen,
  setIsExplorerOpen,
  handleDeleteFolderImages // New prop
}) => {

  // State for File Explorer
  const [currentFolder, setCurrentFolder] = useState(null); // null = root, string = folder name (e.g., 'E-1')

  // Helper to group images by Entregable
  const getGroupedImages = () => {
    const groups = {
      'E-1': [],
      'E-2': [],
      'E-3': [],
      'Sin Asignar': []
    };

    graphicsImages.forEach(img => {
      if (img.entregable === 'E-1') groups['E-1'].push(img);
      else if (img.entregable === 'E-2') groups['E-2'].push(img);
      else if (img.entregable === 'E-3') groups['E-3'].push(img);
      else groups['Sin Asignar'].push(img);
    });

    return groups;
  };

  const groupedImages = getGroupedImages();

  // Filter images based on current view (All, Folder, Search)
  // If search is active, we might want to show results across all folders or just current?
  // Let's stick to folder navigation. If search is used, maybe show a global search result view?
  // For simplicity: Search filters within the CURRENT view (Root or Folder).
  // Actually simplest UX: Search works globally but results are shown in a list.
  // Folder view shows images in that folder.

  const getImagesToDisplay = () => {
    let images = [];
    if (currentFolder) {
      images = groupedImages[currentFolder] || [];
    } else {
      // If in root, we don't display images directly, we display folders.
      return [];
    }

    // Apply search filter if needed
    if (searchTerm) {
      images = images.filter(img => img.index.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply sorting
    return images.sort((a, b) => a.index.localeCompare(b.index, undefined, { numeric: true, sensitivity: 'base' }));
  };

  const displayImages = getImagesToDisplay();

  // Determine if main status is success or error
  const statusClass = uploadStatus.type === 'error' ? 'error' : (uploadStatus.type === 'success' ? 'success' : 'info');

  // Determine selected view in explorer
  // currentFolder can be null (Home/Root), or a folder name.
  // We want sidebar selection to reflect this.

  // If we are in gallery explorer mode, we render ONLY the explorer layout
  if (isExplorerOpen) {
    return (
      <div className="explorer-layout-container">
        {/* LEFT SIDEBAR */}
        <div className="explorer-sidebar">
          <div className="sidebar-header" style={{ marginTop: '0px' }}>Carpetas</div>
          {Object.keys(groupedImages).map(folderName => (
            <div
              key={folderName}
              className={`sidebar-item ${currentFolder === folderName ? 'active' : ''}`}
              onClick={() => { setCurrentFolder(folderName); setSearchTerm(''); }}
            >
              <span className="sidebar-icon">📁</span> {folderName}
              <span style={{ marginLeft: 'auto', fontSize: '0.8em', color: '#888' }}>
                {groupedImages[folderName].length}
              </span>
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '15px' }}>
            <button
              className="btn-back"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setIsExplorerOpen(false)}
            >
              <i className="fa-solid fa-arrow-left"></i> Volver a Subir
            </button>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="explorer-main">
          {/* Top Address Bar */}
          <div className="explorer-top-bar">
            <div className="explorer-address-bar">
              <span style={{ marginRight: '5px', color: '#888' }}>Ubicación: </span>
              {/* Breadcrumbs simplified */}
              <i className="fa-solid fa-folder" style={{ color: '#ffc107', marginRight: '5px' }}></i>
              {currentFolder ? currentFolder : 'Seleccione una carpeta'}
            </div>

            {/* Search and Bulk Actions in Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentFolder && (
                <button
                  className="btn-delete-mini"
                  style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => handleDeleteFolderImages(currentFolder)}
                >
                  <i className="fa-solid fa-trash-can"></i> Eliminar Carpeta
                </button>
              )}

              <div className="gallery-search" style={{ margin: 0, width: '250px' }}>
                <input
                  type="text"
                  placeholder={currentFolder ? `🔍 Buscar en ${currentFolder}...` : "🔍 Buscar..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input-file"
                  style={{ padding: '4px 10px', fontSize: '0.9rem', height: '30px' }}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="explorer-content-area">
            {!currentFolder ? (
              /* ROOT VIEW: Show Grid of Folders */
              <div className="folder-grid">
                {Object.keys(groupedImages).map(folderName => (
                  <div key={folderName} className="folder-card" onClick={() => { setCurrentFolder(folderName); setSearchTerm(''); }}>
                    <span className="folder-icon">📁</span>
                    <div className="folder-name">{folderName}</div>
                    <div className="folder-count">{groupedImages[folderName].length} archivos</div>
                  </div>
                ))}
              </div>
            ) : (
              /* FOLDER VIEW: Show Images */
              <div className="images-grid-view">
                {displayImages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#777', padding: '30px' }}>
                    {searchTerm ? 'No se encontraron imágenes con ese nombre.' : 'Esta carpeta está vacía.'}
                  </p>
                ) : (
                  <div className="gallery-grid">
                    {displayImages.map((img) => (
                      <div key={img.id} className="image-card">
                        <div className="image-card-header">
                          <p className="image-name" title={img.index}>{img.index}</p>
                        </div>
                        <img
                          src={`${img.url}?v=${img.id}`}
                          alt={img.index}
                          className="image-preview"
                          onClick={() => { setPreviewImageUrl(img.url); setIsPreviewModalOpen(true); }}
                        />
                        <div className="image-actions">
                          <button
                            className="btn-delete-mini"
                            onClick={() => handleDeleteGraphicImage(img.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="image-upload-container">
      {/* HEADER */}
      <div className="upload-header">
        <h3>Gestión de Imágenes Gráficas</h3>
        <button
          type="button"
          className="btn-back"
          onClick={() => {
            setModalViewMode('list');
            setUploadStatus({ message: '', type: '' });
            setGraphicsImages([]);
          }}
        >
          <i className="fa-solid fa-arrow-left"></i> Volver a la Lista
        </button>
      </div>

      {/* CARD 1: SUBIDA MANUAL */}
      <div className="upload-card">
        <h4 className="card-title">📷 Subida Manual</h4>
        <p className="upload-subtitle">Sube imágenes individuales (.jpg, .png) o archivos comprimidos (.rar) para asociarlos manualmente.</p>

        <div className="form-group">
          <label className="form-label">Seleccionar Entregable (Opcional):</label>
          <select
            className="form-select"
            value={entregableToUpload}
            onChange={(e) => setEntregableToUpload(e.target.value)}
            disabled={isUploading || pollingJobId}
          >
            <option value="">-- Sin Asignar (General/Legacy) --</option>
            <option value="E-1">Entregable 1 (E-1)</option>
            <option value="E-2">Entregable 2 (E-2)</option>
            <option value="E-3">Entregable 3 (E-3)</option>
          </select>
          <p className="help-text">Todas las imágenes de este lote se marcarán con este entregable.</p>
        </div>

        <div className="form-group">
          <label className="form-label">Seleccionar Archivos:</label>
          <input
            type="file"
            accept="image/png, image/jpeg, .rar"
            multiple
            onChange={handleFileChange}
            className="form-input-file"
            disabled={isUploading || pollingJobId}
          />
        </div>

        {/* PROGRESO DE SUBIDA */}
        {(isUploading || uploadProgress > 0) && !pollingJobId && (
          <div className="progress-container">
            <div className="progress-info">
              <span>{uploadStatus.message}</span>
              <span>{formatEtr(etr)}</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STATUS MESSAGE GENERAL */}
        {uploadStatus.message && !isUploading && !pollingJobId && (
          <div className={`status-message ${statusClass}`}>
            {uploadStatus.message}
          </div>
        )}

        <div className="action-buttons">
          <button
            className="btn-primary"
            onClick={handleImageUploadProcess}
            disabled={!filesToUpload || isUploading || pollingJobId}
          >
            {isUploading ? <><span className="loader-spinner" style={{ display: 'inline-block', width: '12px', height: '12px', marginRight: '8px' }}></span> Subiendo...</> : '📤 Subir Archivos'}
          </button>

          <button
            className="btn-danger"
            onClick={handleDeleteAllGraphicImages}
            disabled={isUploading || pollingJobId}
          >
            🗑️ Eliminar Todo
          </button>
        </div>
      </div>

      {/* CARD 2: EXTRACCIÓN MASIVA (OCULTO TEMPORALMENTE) */}
      {/* 
      <div className="upload-card bulk-section">
          ... (Contenido Oculto) ...
      </div> 
      */}

      {/* POLLING SPINNER */}
      {pollingJobId && (
        <div className="status-message info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div className="loader-spinner"></div>
          <span>{uploadStatus.message}</span>
        </div>
      )}

      {/* BOTÓN PARA MOSTRAR GALERÍA */}
      {!isExplorerOpen && (
        <button className="btn-toggle-gallery" onClick={() => setIsExplorerOpen(true)}>
          📂 Abrir Explorador de Imágenes ({graphicsImages.length})
        </button>
      )}

      {/* --- EXPLORADOR DE ARCHIVOS --- */}
      <button type="button" onClick={() => { setModalViewMode('list'); setUploadStatus({ message: '', type: '' }); setGraphicsImages([]); }} style={{
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s ease',
        marginTop: '10px'
      }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}>Volver a la Lista</button>
    </div>
  );
};

export default SubirImagenesAlcantarillasView;
