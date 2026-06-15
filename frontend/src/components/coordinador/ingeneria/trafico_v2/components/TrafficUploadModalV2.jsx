import { useCallback, useState } from 'react';
import axiosInstance from '../../../../../api/axios';

const TrafficUploadModalV2 = ({ isOpen, onClose, entityId, moduleConfig, onUploadSuccess, setExtractedTrafficData }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [groupDescription, setGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState(moduleConfig.sourceTypeFile ? 'image' : 'image');

  const allowFiles = Boolean(moduleConfig.sourceTypeFile);
  const acceptedFileTypes = uploadType === 'image' ? 'image/*' : '*/*';

  const handleFileSelection = useCallback((incomingFiles) => {
    const files = Array.from(incomingFiles).filter((file) => {
      if (uploadType === 'image') {
        return file.type.startsWith('image/');
      }
      return true;
    });
    setSelectedFiles((previous) => [...previous, ...files]);
  }, [uploadType]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  }, [handleFileSelection]);

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      alert('Selecciona al menos un archivo para continuar.');
      return;
    }

    if (!groupDescription.trim()) {
      alert('Ingresa una descripción para el grupo.');
      return;
    }

    setIsLoading(true);

    try {
      const uploaded = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        const formData = new FormData();
        formData.append(moduleConfig.uploadFieldName, file);
        formData.append(moduleConfig.entityIdName, entityId);
        formData.append('description', groupDescription);
        formData.append('upload_date', new Date().toISOString().split('T')[0]);
        formData.append('index', index + 1);

        if (uploadType === 'file' && moduleConfig.sourceTypeFile) {
          formData.append('source_type', moduleConfig.sourceTypeFile);
        } else if (moduleConfig.sourceTypeImage) {
          formData.append('source_type', moduleConfig.sourceTypeImage);
        }

        const response = await axiosInstance.post(moduleConfig.uploadUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response?.data?.imageData) {
          uploaded.push(response.data.imageData);
        }
      }

      if (uploaded.length > 0) {
        onUploadSuccess(uploaded);
      }

      setSelectedFiles([]);
      setGroupDescription('');
      onClose();
    } catch (error) {
      console.error('Error cargando archivos en Tráfico V2:', error);
      alert('No se pudo completar la carga. Revisa el tipo de archivo o el endpoint configurado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="traffic-v2-modal-overlay">
      <div className="traffic-v2-modal">
        <div className="traffic-v2-modal-header">
          <div>
            <h3>Subir datos</h3>
            <p>{moduleConfig.label} · {entityId}</p>
          </div>
          <button type="button" className="traffic-v2-close-btn" onClick={onClose}>&times;</button>
        </div>

        {allowFiles ? (
          <label className="traffic-v2-field">
            Tipo de carga
            <select value={uploadType} onChange={(event) => {
              setUploadType(event.target.value);
              setSelectedFiles([]);
            }}>
              <option value="image">Grupo de fotos</option>
              <option value="file">Archivos</option>
            </select>
          </label>
        ) : null}

        <label className="traffic-v2-field">
          Descripción del grupo
          <input
            type="text"
            value={groupDescription}
            onChange={(event) => setGroupDescription(event.target.value)}
            placeholder="Ej: campaña 01, aforo semanal, registro de campo"
          />
        </label>

        <div
          className={`traffic-v2-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={acceptedFileTypes}
            onChange={(event) => handleFileSelection(event.target.files)}
          />
          <strong>{uploadType === 'image' ? 'Arrastra fotos o selecciónalas' : 'Arrastra archivos o selecciónalos'}</strong>
          <span>La carga usa el endpoint actual del módulo, mantiene la V1 intacta y conserva el almacenamiento central en NAS.</span>
        </div>

        {selectedFiles.length ? (
          <div className="traffic-v2-selected-files">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="traffic-v2-selected-file">
                <span>{file.name}</span>
                <button type="button" onClick={() => setSelectedFiles((previous) => previous.filter((_, current) => current !== index))}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="traffic-v2-modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary" onClick={handleUpload} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Subir al módulo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficUploadModalV2;
