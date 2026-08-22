import React, { useState, useCallback } from 'react';
import axiosInstance from '@/api/axios';
import { logAuditEvent } from '@/api/audit';

const UploadTrafficDataModal = ({ isOpen, onClose, entityId, onUploadSuccess, uploadUrl, entityIdName, sourceTypeImage, sourceTypeFile }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [groupDescription, setGroupDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadType, setUploadType] = useState('image'); // 'image' or 'file'

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => {
      if (uploadType === 'image') {
        return file.type.startsWith('image/');
      }
      return true; // Accept all files if type is 'file'
    });
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  }, [uploadType]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => {
      if (uploadType === 'image') {
        return file.type.startsWith('image/');
      }
      return true; // Accept all files if type is 'file'
    });
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Por favor, selecciona al menos un archivo.');
      return;
    }
    if (!groupDescription) {
      alert('Por favor, ingresa una descripción para el grupo.');
      return;
    }

    setIsLoading(true);

    const uploadPromises = selectedFiles.map(async (file, index) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(entityIdName, entityId);
      formData.append('description', groupDescription);
      formData.append('upload_date', new Date().toISOString().split('T')[0]);
      formData.append('index', index + 1); // Añadir el índice (correlativo)
      formData.append('source_type', uploadType === 'image' ? sourceTypeImage : sourceTypeFile);

      try {
        const response = await axiosInstance.post(uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.imageData;
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error al subir el archivo: ' + file.name);
        return null;
      }
    });

    const uploadedFilesData = (await Promise.all(uploadPromises)).filter(data => data !== null);
    if (uploadedFilesData.length > 0) {
      onUploadSuccess(entityId, uploadedFilesData);
      logAuditEvent('FILE_UPLOAD', {
        entityId: entityId,
        entityType: entityIdName,
        files: selectedFiles.map(f => f.name),
        description: groupDescription,
        uploadType: uploadType,
      });
      onClose();
      setSelectedFiles([]);
      setGroupDescription('');
    }
    setIsLoading(false);
  };

  if (!isOpen) return null; // Mover la condición aquí

  const acceptedFileTypes = uploadType === 'image' ? 'image/*' : '*/*';
  const dragDropMessage = uploadType === 'image' ? 'Arrastra y suelta imágenes aquí o haz clic para seleccionar' : 'Arrastra y suelta archivos aquí o haz clic para seleccionar';
  const uploadButtonText = uploadType === 'image' ? 'Subir Imágenes' : 'Subir Archivos';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        width: '500px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#2c3e50', textAlign: 'center' }}>Subir Archivos para {entityId}</h3>

        <div>
          <label htmlFor="uploadType" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Subida:</label>
          <select
            id="uploadType"
            value={uploadType}
            onChange={(e) => {
              setUploadType(e.target.value);
              setSelectedFiles([]); // Clear selected files when type changes
            }}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="image">Subir Grupo de Fotos</option>
            <option value="file">Subir Archivos</option>
          </select>
        </div>

        <div>
          <label htmlFor="groupDescription" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción del Grupo:</label>
          <input
            type="text"
            id="groupDescription"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            placeholder="Ej: Fotos del día 1, Informe de aforo"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#e6f7ff' : '#f9f9f9',
            transition: 'background-color 0.3s ease'
          }}
          onClick={() => document.getElementById('fileInputModal').click()}
        >
          <input
            type="file"
            id="fileInputModal"
            multiple
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <p style={{ margin: 0, color: '#555' }}>{dragDropMessage}</p>
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3em', color: '#007bff', marginTop: '10px' }}></i>
        </div>

        {selectedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
            {selectedFiles.map((file, index) => (
              <div key={index} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', fontSize: '0.7em', textAlign: 'center', wordBreak: 'break-all', padding: '5px' }}>
                    {file.name}
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'rgba(255, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px', 
                    height: '20px',
                    fontSize: '0.8em',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: isLoading ? '#cccccc' : '#007bff',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Cargando...' : uploadButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadTrafficDataModal;

