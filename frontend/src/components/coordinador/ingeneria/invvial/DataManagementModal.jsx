import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { toLatLon } from 'utm';
import axiosInstance from '../../../../api/axios';
import alertify from 'alertifyjs';

// Import new sub-components
import ListaAlcantarillasView from './AlcantarillaModalViews/ListaAlcantarillasView';
import FormularioAlcantarillaView from './AlcantarillaModalViews/FormularioAlcantarillaView';
import FormularioBadenView from './AlcantarillaModalViews/FormularioBadenView'; // Import Badenes Form
import SubirExcelAlcantarillasView from './AlcantarillaModalViews/SubirExcelAlcantarillasView';
import SubirImagenesAlcantarillasView from './AlcantarillaModalViews/SubirImagenesAlcantarillasView';

const DataManagementModal = ({
  show,
  onClose,
  listData: allData, // Renamed for clarity
  editData,
  mode: initialMode = 'list',
  onSaveManualData,
  onUploadExcelData,
  projectId,
  vialHeaderOption,
  type = 'alcantarillas', // Default type
  isNavbarExpanded,
}) => {
  const initialFormData = {
    id_alcantarilla: '',
    id_baden: '', // Add id_baden
    codigo: '',
    tipo: '',
    material: '',
    diametro_lado: '',
    longitud_alcantarilla: '',
    longitud_baden: '', // Add longitud_baden
    estado: '',
    observaciones: '',
    progresiva: '',
    latitud: '',
    longitud: '',
    luz: '',
    alto: '',
    ancho: '',
    altitud: '',
    caracteristicas: '',
    clase: '',
    panel_fotografico_codigo: '',
  };

  const modalRef = useRef();
  const [formData, setFormData] = useState(initialFormData);
  const [modalViewMode, setModalViewMode] = useState(initialMode);
  const [filesToUpload, setFilesToUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });
  const [utmZone, setUtmZone] = useState(18);
  const [graphicsImages, setGraphicsImages] = useState([]);

  const [processedRange, setProcessedRange] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pollingJobId, setPollingJobId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [etr, setEtr] = useState(null);
  const [processedFileName, setProcessedFileName] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  const [excelFileInfo, setExcelFileInfo] = useState(null);

  const fetchExcelInfo = useCallback(async () => {
    if (!projectId) {
      return;
    }
    try {
      const entregableMatch = vialHeaderOption.match(/(\d+)/);
      const entregableNum = entregableMatch ? entregableMatch[1] : null;

      if (!entregableNum) {
        setExcelFileInfo(null);
        return;
      }
      // Siempre consulta la información del excel de alcantarillas, ya que es el global
      const response = await axiosInstance.get(`/api/alcantarillas/excel-info/${projectId}/${entregableNum}`);
      setExcelFileInfo(response.data);
    } catch (error) {
      setExcelFileInfo(null);
      if (error.response && error.response.status !== 404) {
        alertify.error('Error al cargar la información del archivo Excel.');
      }
    }
  }, [projectId, vialHeaderOption, allData]);

  useEffect(() => {
    if (show && modalViewMode === 'upload_excel') {
      fetchExcelInfo();
    }
  }, [show, modalViewMode, fetchExcelInfo]);

  const handleDownloadExcel = () => {
    if (excelFileInfo && excelFileInfo.excel_url) {
      window.open(excelFileInfo.excel_url, '_blank');
    } else {
      alertify.error('No se encontró la URL del archivo para descargar.');
    }
  };

  const formatEtr = (seconds) => {
    if (seconds === null || seconds < 0 || !isFinite(seconds)) return '';
    if (seconds < 60) return `~${Math.round(seconds)}s restantes`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `~${minutes}m ${remainingSeconds}s restantes`;
  };

  const fetchGraphicsImages = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await axiosInstance.get(`/api/alcantarillas/graphics/${projectId}`);
      setGraphicsImages(response.data);
    } catch (error) {
      alertify.error('Error al cargar imágenes de gráficos.');
    }
  }, [projectId]);

  useEffect(() => {
    if (!pollingJobId) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await axiosInstance.get(`/api/jobs/${pollingJobId}/status`);
        const { status, result } = response.data;

        if (status === 'completed') {
          clearInterval(interval);
          setPollingJobId(null);
          setIsUploading(false);
          setUploadProgress(0);
          setEtr(null);
          setUploadStatus({ message: `${processedFileName} ha sido procesado. ${result.message || 'Proceso completado exitosamente.'}`, type: 'success' });
          fetchGraphicsImages();
        } else if (status === 'failed') {
          clearInterval(interval);
          setPollingJobId(null);
          setIsUploading(false);
          setUploadProgress(0);
          setEtr(null);
          setUploadStatus({ message: `Error en el procesamiento: ${result.error || 'Error desconocido.'}`, type: 'error' });
        } else if (status === 'processing') {
          setUploadStatus({ message: 'Procesando imágenes... Esto puede tardar varios minutos.', type: 'info' });
        } else if (status === 'pending') {
          setUploadStatus({ message: 'En cola para procesar...', type: 'info' });
        }

      } catch (error) {
        clearInterval(interval);
        setPollingJobId(null);
        setIsUploading(false);
        setUploadProgress(0);
        setEtr(null);
        setUploadStatus({ message: 'No se pudo verificar el estado del proceso.', type: 'error' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingJobId, processedFileName, fetchGraphicsImages]); // Added projectId to dependencies

  const handleDeleteGraphicImage = async (imageId) => {
    alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar esta imagen de gráfico? Esta acción no se puede deshacer.',
      async () => {
        setUploadStatus({ message: 'Eliminando imagen...', type: 'info' });
        try {
          await axiosInstance.delete(`/api/alcantarillas/graphics/${imageId}?projectId=${projectId}`);
          setUploadStatus({ message: 'Imagen eliminada correctamente.', type: 'success' });
          fetchGraphicsImages();
        } catch (error) {
          if (error.response && error.response.status === 403) {
            alertify.error('Usted solo tiene acceso a lectura, no puede eliminar archivos');
          } else {
            setUploadStatus({ message: 'Error al eliminar imagen de gráfico: ' + (error.response?.data?.message || error.message), type: 'error' });
          }
        }
      },
      () => {
        setUploadStatus({ message: 'Eliminación cancelada.', type: 'info' });
      }
    ).set('labels', { ok: 'Sí, eliminar', cancel: 'Cancelar' });
  };

  const handleDeleteAllGraphicImages = async () => {
    alertify.confirm('Confirmar Eliminación', '¿Estás seguro de que quieres eliminar TODAS las imágenes de gráfico de este proyecto? Esta acción no se puede deshacer.',
      async () => {
        try {
          setUploadStatus({ message: 'Eliminando todas las imágenes...', type: 'info' });
          await axiosInstance.delete(`/api/alcantarillas/graphics/all/${projectId}`);
          setUploadStatus({ message: 'Todas las imágenes eliminadas correctamente.', type: 'success' });
          setGraphicsImages([]);
        } catch (error) {
          if (error.response && error.response.status === 403) {
            alertify.error('Usted solo tiene acceso a lectura, no puede eliminar archivos');
          } else {
            setUploadStatus({ message: 'Error al eliminar todas las imágenes de gráfico: ' + (error.response?.data?.message || error.message), type: 'error' });
          }
        }
      },
      () => {
        setUploadStatus({ message: 'Eliminación cancelada.', type: 'info' });
      }
    ).set('labels', { ok: 'Sí, eliminar', cancel: 'Cancelar' });
  };

  useEffect(() => {
    if (show) {
      setModalViewMode(initialMode);
      if (initialMode === 'edit' && editData) {
        const normalizedData = {
          ...editData,
          estado: editData.estado ? editData.estado.trim() : ''
        };
        setFormData(normalizedData);
      } else {
        setFormData(initialFormData);
      }
      if (projectId) {
        fetchGraphicsImages();
      }
    } else {
      setFormData(initialFormData);
      setModalViewMode('list');
      setFilesToUpload(null);
      setGraphicsImages([]);
      setProcessedRange(null);
      setUploadStatus({ message: '', type: '' });
      setUploadProgress(0);
      setIsUploading(false);
      setEtr(null);
      setUploadStartTime(null);
      setProcessedFileName(null);
    }
  }, [show, initialMode, editData, projectId, fetchGraphicsImages]); // Added fetchGraphicsImages to dependencies

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
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveManualData) {
      onSaveManualData(formData);
    }
  };

  const handleEditClick = (element) => {
    setFormData(element);
    setModalViewMode('edit');
  };

  const handleCreateNewClick = () => {
    setFormData(initialFormData);
    setModalViewMode('create');
  };

  const handleFileChange = (e) => {
    setFilesToUpload(e.target.files);
    setProcessedRange(null);
    setUploadProgress(0);
    setUploadStatus({ message: '', type: '' });
    setEtr(null);
    setProcessedFileName(null);
  };

  const handleProcessExcel = async () => {
    if (!filesToUpload) {
      alertify.warning('Por favor, selecciona un archivo Excel.');
      return;
    }
    if (!projectId) {
      alertify.error('Error: No se ha proporcionado un ID de proyecto.');
      return;
    }
    setUploadStatus({ message: 'Subiendo y procesando archivo Excel...', type: 'info' });
    const formData = new FormData();
    formData.append('excelFile', filesToUpload[0]);
    formData.append('projectId', projectId);
    formData.append('utmZone', utmZone);
    const entregableMatch = vialHeaderOption.match(/(\d+)/);
    if (entregableMatch) {
      formData.append('entregableNum', entregableMatch[1]);
    }
    try {
      // SIEMPRE usar el endpoint de alcantarillas para la subida global
      const response = await axiosInstance.post(`/api/alcantarillas/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus({ message: response.data.message, type: 'success' });

      // Use the fileInfo from the POST response directly to avoid a race condition
      if (response.data && response.data.fileInfo) {
        setExcelFileInfo(response.data.fileInfo);
      } else {
        // Fallback to fetching if the fileInfo is not in the response
        fetchExcelInfo();
      }

      if (onUploadExcelData) {
        onUploadExcelData();
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alertify.error('Usted solo tiene acceso a lectura, no puede subir archivos');
      } else {
        setUploadStatus({ message: 'Error al subir o procesar el archivo Excel: ' + (error.response?.data?.message || error.message), type: 'error' });
      }
    }
  };

  const handleImageUploadProcess = async () => {
    if (!filesToUpload || filesToUpload.length === 0) {
      alertify.error('Por favor, selecciona uno o más archivos.');
      return;
    }
    if (!projectId) {
      alertify.error('Error: No se ha proporcionado un ID de proyecto.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setEtr(null);
    const startTime = Date.now();
    setUploadStartTime(startTime);

    const totalFiles = filesToUpload.length;
    for (let i = 0; i < totalFiles; i++) {
      const file = filesToUpload[i];
      setProcessedFileName(file.name);
      setUploadStatus({ message: `Subiendo archivo ${i + 1} de ${totalFiles}: ${file.name}`, type: 'info' });

      setUploadProgress(0);
      setEtr(null);

      if (file.size > 50 * 1024 * 1024) {
        await handleChunkedUpload(file, startTime);
      } else {
        await handleSimpleUpload(file, startTime);
      }

      if (pollingJobId) {
        await new Promise(resolve => {
          const checkInterval = setInterval(() => {
            if (!pollingJobId) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 1000);
        });
      }
    }

    setIsUploading(false);
    setFilesToUpload(null);
    setUploadStatus({ message: `Proceso completado. Se han procesado ${totalFiles} archivos.`, type: 'success' });
  };

  const handleSimpleUpload = async (file, startTime) => {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('files', file);

    setUploadStatus({ message: 'Subiendo archivo...', type: 'info' });

    try {
      const response = await axiosInstance.post('/api/alcantarillas/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          setUploadStatus({ message: `Subiendo archivo... ${progress}%`, type: 'info' });

          const elapsedTime = (Date.now() - startTime) / 1000;
          if (elapsedTime > 0 && progressEvent.loaded > 0) {
            const speed = progressEvent.loaded / elapsedTime;
            const bytesRemaining = progressEvent.total - progressEvent.loaded;
            const remainingSeconds = bytesRemaining / speed;
            setEtr(remainingSeconds);
          }
        }
      });

      if (response.status === 202) {
        setUploadStatus({ message: response.data.message, type: 'info' });
        setPollingJobId(response.data.jobId);
      } else {
        setUploadStatus({ message: `${file.name} ha sido procesado. ${response.data.message || 'Operación completada.'}`, type: 'success' });
        fetchGraphicsImages();
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alertify.error('Usted solo tiene acceso a lectura, no puede subir archivos');
      } else {
        setUploadStatus({ message: 'Error al subir el archivo: ' + (error.response?.data?.message || error.message), type: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleChunkedUpload = async (file, startTime) => {
    const chunkSize = 50 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadId = `${file.name}-${Date.now()}`;

    setUploadStatus({ message: `Subiendo archivo grande en ${totalChunks} partes...`, type: 'info' });

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append('projectId', projectId);
      chunkFormData.append('fileChunk', chunk);
      chunkFormData.append('uploadId', uploadId);
      chunkFormData.append('chunkIndex', chunkIndex);
      chunkFormData.append('totalChunks', totalChunks);
      chunkFormData.append('originalFilename', file.name);

      let success = false;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await axiosInstance.post('/api/alcantarillas/upload-chunk', chunkFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          success = true;
          break;
        } catch (error) {
          if (error.response && error.response.status === 403) {
            alertify.error('Usted solo tiene acceso a lectura, no puede subir archivos. La subida se ha detenido.');
            setIsUploading(false);
            setEtr(null);
            return; // Detener la subida completa
          }
          if (attempt === maxRetries) {
            setUploadStatus({ message: `Error de red al subir la parte ${chunkIndex + 1}. Por favor, verifica tu conexión.`, type: 'error' });
            setIsUploading(false);
            setEtr(null);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!success) return;

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      setUploadProgress(progress);

      const elapsedTime = (Date.now() - startTime) / 1000;
      if (elapsedTime > 0) {
        const bytesUploadedSoFar = Math.min((chunkIndex + 1) * chunkSize, file.size);
        const speed = bytesUploadedSoFar / elapsedTime;
        const bytesRemaining = file.size - bytesUploadedSoFar;
        const remainingSeconds = bytesRemaining / speed;
        setEtr(remainingSeconds);
      }

      setUploadStatus({ message: `Subiendo parte ${chunkIndex + 1} de ${totalChunks}...`, type: 'info' });

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      setEtr(null);
      setUploadStatus({ message: 'Ensamblando archivo en el servidor...', type: 'info' });
      const response = await axiosInstance.post('/api/alcantarillas/complete-upload', {
        projectId,
        uploadId,
        originalFilename: file.name,
      });

      if (response.status === 202) {
        setUploadStatus({ message: response.data.message, type: 'info' });
        setPollingJobId(response.data.jobId);
      } else {
        setUploadStatus({ message: `${file.name} ha sido procesado. ${response.data.message || 'Subida completada.'}`, type: 'success' });
        fetchGraphicsImages();
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alertify.error('Usted solo tiene acceso a lectura, no puede subir archivos');
      } else {
        setUploadStatus({ message: 'Error al finalizar la subida: ' + (error.response?.data?.message || error.message), type: 'error' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExcelData = async () => {
    if (!projectId) {
      alertify.error('Error: No se ha proporcionado un ID de proyecto.');
      return;
    }

    const confirmContent = `
        <div style="text-align: left; padding: 10px;">
            <p>¿Estás seguro de que quieres eliminar el archivo Excel y los datos asociados?</p>
            <p><strong>Seleccione los tipos de datos a eliminar:</strong></p>
            <label for="delete-alcantarillas" style="display: block; margin: 5px 0;">
                <input type="checkbox" id="delete-alcantarillas" value="alcantarillas" checked> Alcantarillas
            </label>
            <label for="delete-badenes" style="display: block; margin: 5px 0;">
                <input type="checkbox" id="delete-badenes" value="badenes" checked> Badenes
            </label>
            <p style="font-size: 0.8em; color: #888; margin-top: 15px;">Esta acción no se puede deshacer.</p>
        </div>
    `;

    alertify.confirm('Confirmar Eliminación', confirmContent,
      async () => {
        const deleteAlcantarillas = document.getElementById('delete-alcantarillas').checked;
        const deleteBadenes = document.getElementById('delete-badenes').checked;
        
        const typesToDelete = [];
        if (deleteAlcantarillas) typesToDelete.push('alcantarillas');
        if (deleteBadenes) typesToDelete.push('badenes');

        if (typesToDelete.length === 0) {
            setUploadStatus({ message: 'No se seleccionó ningún tipo de dato para eliminar. Operación cancelada.', type: 'info' });
            return;
        }

        setUploadStatus({ message: 'Eliminando archivo Excel y datos seleccionados...', type: 'info' });
        try {
          const entregableMatch = vialHeaderOption.match(/(\d+)/);
          const entregableNum = entregableMatch ? entregableMatch[1] : '';
          
          const response = await axiosInstance.delete(`/api/alcantarillas/delete-excel/${projectId}?entregableNum=${entregableNum}&tipos=${typesToDelete.join(',')}`);
          
          setUploadStatus({ message: response.data.message, type: 'success' });
          fetchExcelInfo();
          if (onUploadExcelData) {
            onUploadExcelData();
          }
          setFilesToUpload(null);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alertify.error('Usted solo tiene acceso a lectura, no puede eliminar archivos');
            } else {
                setUploadStatus({ message: 'Error al eliminar el archivo Excel y los datos: ' + (error.response?.data?.message || error.message), type: 'error' });
            }
        }
      },
      () => {
        setUploadStatus({ message: 'Eliminación cancelada.', type: 'info' });
      }
    ).set('labels', { ok: 'Sí, eliminar', cancel: 'Cancelar' });
  };

  const submitButtonText = modalViewMode === 'edit' ? 'Actualizar Alcantarilla' : 'Guardar Alcantarilla';

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
      fontFamily: 'Arial, sans-serif',
      paddingLeft: isNavbarExpanded ? '260px' : '0px'
    }}>
      <div ref={modalRef} className="hide-scrollbar" style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
        maxWidth: '900px',
        width: '95%',
        zIndex: 10001,
        position: 'relative',
        maxHeight: '85vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        margin: '90px auto auto auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: '#555',
          transition: 'color 0.2s ease'
        }} onMouseOver={(e) => e.currentTarget.style.color = '#333'} onMouseOut={(e) => e.currentTarget.style.color = '#555'}>&times;</button>

        <h2 style={{ marginBottom: '20px', color: '#333', textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          {modalViewMode === 'edit' ? `Editar ${type === 'badenes' ? 'Badén' : 'Alcantarilla'}` : (modalViewMode === 'create' ? `Ingresar Nueva ${type === 'badenes' ? 'Badén' : 'Alcantarilla'}` : `Gestión de ${type === 'badenes' ? 'Badenes' : 'Alcantarillas'}`)}
        </h2>

        {modalViewMode === 'list' && (
          <ListaAlcantarillasView
            allAlcantarillasData={allData}
            handleCreateNewClick={handleCreateNewClick}
            handleEditClick={handleEditClick}
            setModalViewMode={setModalViewMode}
            setUploadStatus={setUploadStatus} // Not strictly needed here, but passed for consistency if sub-component changes
          />
        )}

        {(modalViewMode === 'create' || modalViewMode === 'edit') && (
          type === 'badenes' ? (
            <FormularioBadenView
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              modalViewMode={modalViewMode}
              setModalViewMode={setModalViewMode}
              submitButtonText={submitButtonText}
            />
          ) : (
            <FormularioAlcantarillaView
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              modalViewMode={modalViewMode}
              setModalViewMode={setModalViewMode}
              submitButtonText={submitButtonText}
            />
          )
        )}

        {modalViewMode === 'upload_excel' && (
            <SubirExcelAlcantarillasView
              utmZone={utmZone}
              setUtmZone={setUtmZone}
              handleFileChange={handleFileChange}
              handleProcessExcel={handleProcessExcel}
              handleDeleteExcelData={handleDeleteExcelData}
              uploadStatus={uploadStatus}
              setModalViewMode={setModalViewMode}
              setUploadStatus={setUploadStatus}
              filesToUpload={filesToUpload}
              existingExcelFile={excelFileInfo}
              handleDownloadExcel={handleDownloadExcel}
            />
        )}

        {modalViewMode === 'upload_graphics_excel' && (
          <SubirImagenesAlcantarillasView
            filesToUpload={filesToUpload}
            isUploading={isUploading}
            pollingJobId={pollingJobId}
            handleFileChange={handleFileChange}
            handleImageUploadProcess={handleImageUploadProcess}
            handleDeleteAllGraphicImages={handleDeleteAllGraphicImages}
            uploadStatus={uploadStatus}
            uploadProgress={uploadProgress}
            etr={etr}
            formatEtr={formatEtr}
            graphicsImages={graphicsImages}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleDeleteGraphicImage={handleDeleteGraphicImage}
            setPreviewImageUrl={setPreviewImageUrl}
            setIsPreviewModalOpen={setIsPreviewModalOpen}
            setModalViewMode={setModalViewMode}
            setUploadStatus={setUploadStatus}
            setGraphicsImages={setGraphicsImages}
          />
        )}

        {isPreviewModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10002,
          }}>
            <img src={previewImageUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
            <button onClick={() => setIsPreviewModalOpen(false)} style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#333',
            }}>&times;</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagementModal;