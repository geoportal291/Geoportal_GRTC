import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/api/axios';
import alertify from 'alertifyjs';

const GeologiaLayerManager = ({ tabName, projectData, onUploadSuccess, accept }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedFile, setSelectedFile] = useState(null);
    const [layerName, setLayerName] = useState('');
    const [driveLink, setDriveLink] = useState('');

    // Current layer data from backend
    const [currentLayer, setCurrentLayer] = useState(null);
    const fileInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = user.rol_nombre === 'ADMIN' || user.rol_nombre === 'COORDINADOR PROYECTO';
    // Especialista en Geología (Código 2)
    const isSpecialistGeology = (user.codigo_esp === 2 || user.codigo_esp === '2');
    // Evaluador (Rol 6) con especialidad en Geología (Código 2)
    const isEvaluatorGeology = (user.rol_id === 6 || user.rol_id === '6') && isSpecialistGeology;

    const canManage = isAdmin || isSpecialistGeology || isEvaluatorGeology;

    const projectId = projectData?.id_proyecto || projectData?.id;

    // Fetch current layer data
    const fetchCurrentLayer = async () => {
        if (!projectId || !tabName) return;
        try {
            const res = await axiosInstance.get(`/api/proyectos/${projectId}/geologia-capas/${tabName}`);
            if (res.data?.status === 'success' && res.data?.data) {
                setCurrentLayer(res.data.data);
            } else {
                setCurrentLayer(null);
            }
        } catch {
            setCurrentLayer(null);
        }
    };

    useEffect(() => {
        fetchCurrentLayer();
    }, [projectId, tabName]);

    if (!canManage) return null;

    const openModal = () => {
        // Pre-populate form with current data
        setLayerName(currentLayer?.file_name || '');
        setDriveLink(currentLayer?.drive_url || '');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFile(null);
        setLayerName('');
        setDriveLink('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file || null);
        // If no custom name was entered yet, use the file name as suggestion
        if (file && !layerName.trim()) {
            setLayerName(file.name);
        }
    };

    const handleSave = async () => {
        if (!projectId) {
            alertify.error('Error: No se encontró el ID del proyecto.');
            return;
        }

        // At least one change is required
        const hasFile = !!selectedFile;
        const nameChanged = layerName.trim() && layerName.trim() !== (currentLayer?.file_name || '');
        const driveChanged = driveLink.trim() !== (currentLayer?.drive_url || '');

        if (!hasFile && !nameChanged && !driveChanged) {
            alertify.warning('No se detectaron cambios. Seleccione un archivo, cambie el nombre o defina un enlace de Drive.');
            return;
        }

        setIsUploading(true);
        let anyError = false;

        try {
            // 1. Upload file if provided
            if (hasFile) {
                alertify.message('Subiendo archivo, por favor espere...');
                const formData = new FormData();
                formData.append('archivo', selectedFile);
                formData.append('tabName', tabName);
                try {
                    await axiosInstance.post(`/api/proyectos/${projectId}/geologia-capas`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    alertify.success('Archivo subido exitosamente.');
                } catch (error) {
                    console.error('Error al subir la capa:', error);
                    const backendMessage = error?.response?.data?.message || error?.response?.data?.error || 'Error al subir el archivo.';
                    alertify.error(String(backendMessage).slice(0, 120));
                    anyError = true;
                }
            }

            // 2. Rename layer if name changed
            const effectiveName = layerName.trim() || (selectedFile ? selectedFile.name : '');
            const shouldRename = effectiveName && effectiveName !== (currentLayer?.file_name || '');
            if (shouldRename && !anyError) {
                try {
                    await axiosInstance.patch(`/api/proyectos/${projectId}/geologia-capas/${tabName}/rename`, {
                        newName: effectiveName
                    });
                    alertify.success('Nombre de capa actualizado.');
                } catch (error) {
                    console.error('Error al renombrar la capa:', error);
                    alertify.error('Error al renombrar la capa.');
                    anyError = true;
                }
            }

            // 3. Update drive link if changed
            if (driveChanged && !anyError) {
                try {
                    await axiosInstance.patch(`/api/proyectos/${projectId}/geologia-capas/${tabName}/drive-link`, {
                        driveUrl: driveLink.trim()
                    });
                    alertify.success('Enlace de Drive actualizado.');
                } catch (error) {
                    console.error('Error al actualizar el enlace de Drive:', error);
                    alertify.error('Error al actualizar el enlace de Drive.');
                    anyError = true;
                }
            }

            // Refresh layer data and close modal
            await fetchCurrentLayer();
            if (!anyError) {
                closeModal();
            }
            if (onUploadSuccess) onUploadSuccess();
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteCapa = async () => {
        if (!projectId) return;

        alertify.confirm(
            "Confirmar Eliminación",
            `¿Está seguro que desea eliminar la capa actual de geología local?`,
            async () => {
                setIsUploading(true);
                try {
                    await axiosInstance.delete(`/api/proyectos/${projectId}/geologia-capas/${tabName}`);
                    alertify.success('Capa geológica eliminada exitosamente.');
                    setCurrentLayer(null);
                    if (onUploadSuccess) onUploadSuccess();
                } catch (error) {
                    console.error('Error al eliminar la capa:', error);
                    alertify.error('Ocurrió un error al eliminar la capa.');
                } finally {
                    setIsUploading(false);
                }
            },
            () => { } // Cancel
        );
    };

    const openDriveFolder = () => {
        if (currentLayer?.drive_url) {
            window.open(currentLayer.drive_url, '_blank', 'noopener,noreferrer');
        }
    };

    const openUploadedFile = () => {
        if (currentLayer?.file_url) {
            window.open(currentLayer.file_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <>
            <div style={{ display: 'inline-flex', gap: '10px' }}>
                {/* Botón Subir Archivo — ahora abre modal */}
                <button
                    type="button"
                    onClick={openModal}
                    disabled={isUploading}
                    className="geoltab-upload-btn"
                    style={{
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        backgroundColor: isUploading ? '#6b7280' : '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: 'none',
                        transition: 'background-color 0.2s',
                        opacity: isUploading ? 0.7 : 1
                    }}
                >
                    <span style={{ fontSize: '16px' }}>📤</span>
                    Subir Archivo
                </button>

                {/* Botón Eliminar Capa */}
                <button
                    onClick={handleDeleteCapa}
                    disabled={isUploading}
                    style={{
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        backgroundColor: isUploading ? '#ef444480' : '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: 'none',
                        transition: 'background-color 0.2s',
                    }}
                >
                    <span style={{ fontSize: '16px' }}>🗑️</span>
                    Eliminar Capa
                </button>

                {currentLayer?.file_url && (
                    <button
                        type="button"
                        onClick={openUploadedFile}
                        style={{
                            cursor: 'pointer',
                            backgroundColor: '#0f766e',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: 'none',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>🔗</span>
                        Abrir Archivo
                    </button>
                )}

                {/* Botón Carpeta de Drive — visible solo si existe un drive_url */}
                {currentLayer?.drive_url && (
                    <button
                        type="button"
                        onClick={openDriveFolder}
                        style={{
                            cursor: 'pointer',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: 'none',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>📂</span>
                        Carpeta Drive
                    </button>
                )}
            </div>

            {/* ====== MODAL ====== */}
            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        zIndex: 10000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isUploading) closeModal();
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            padding: '28px 32px',
                            width: '480px',
                            maxWidth: '92vw',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            position: 'relative',
                            animation: 'fadeInScale 0.2s ease-out',
                        }}
                    >
                        {/* Encabezado */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '22px',
                            borderBottom: '2px solid #e5e7eb',
                            paddingBottom: '12px',
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span>📤</span> Gestión de Capa Geológica
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isUploading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '22px',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.target.style.color = '#ef4444'}
                                onMouseLeave={e => e.target.style.color = '#94a3b8'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Información actual */}
                        {currentLayer && (
                            <div style={{
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '18px',
                                fontSize: '12px',
                                color: '#0369a1',
                            }}>
                                <strong>Capa actual:</strong> {currentLayer.file_name || '(sin nombre)'}
                                {currentLayer.drive_url && (
                                    <div style={{ marginTop: '4px' }}>
                                        <strong>Drive:</strong>{' '}
                                        <a href={currentLayer.drive_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', wordBreak: 'break-all' }}>
                                            {currentLayer.drive_url.length > 50 ? currentLayer.drive_url.substring(0, 50) + '...' : currentLayer.drive_url}
                                        </a>
                                    </div>
                                )}
                                {currentLayer.file_url && (
                                    <div style={{ marginTop: '4px' }}>
                                        <strong>Archivo público:</strong>{' '}
                                        <a href={currentLayer.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', wordBreak: 'break-all' }}>
                                            {currentLayer.file_url.length > 60 ? currentLayer.file_url.substring(0, 60) + '...' : currentLayer.file_url}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Campo: Nombre de la Capa */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '6px',
                            }}>
                                🏷️ Nombre de la Capa
                            </label>
                            <input
                                type="text"
                                value={layerName}
                                onChange={(e) => setLayerName(e.target.value)}
                                placeholder={currentLayer?.file_name || 'Se usará el nombre del archivo'}
                                disabled={isUploading}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1.5px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: '#f9fafb',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                                Si se deja vacío, se mantiene el nombre actual o se usa el del archivo.
                            </div>
                        </div>

                        {/* Campo: Archivo */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '6px',
                            }}>
                                📁 Seleccionar Archivo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(KML, KMZ, ZIP, RAR)</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={accept || '.kml,.kmz,.rar,.zip'}
                                onChange={handleFileChange}
                                disabled={isUploading}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    border: '1.5px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: '#f9fafb',
                                    boxSizing: 'border-box',
                                }}
                            />
                            {selectedFile && (
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                    Archivo seleccionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </div>
                            )}
                        </div>

                        {/* Campo: Link de Drive */}
                        <div style={{ marginBottom: '22px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#374151',
                                marginBottom: '6px',
                            }}>
                                🔗 Enlace Carpeta de Drive
                            </label>
                            <input
                                type="url"
                                value={driveLink}
                                onChange={(e) => setDriveLink(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                disabled={isUploading}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1.5px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    backgroundColor: '#f9fafb',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = '#16a34a'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                                URL de la carpeta en Google Drive para compartir la documentación.
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '16px',
                        }}>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isUploading}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '6px',
                                    border: '1.5px solid #d1d5db',
                                    backgroundColor: '#ffffff',
                                    color: '#374151',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={e => { if (!isUploading) e.target.style.backgroundColor = '#f3f4f6'; }}
                                onMouseLeave={e => e.target.style.backgroundColor = '#ffffff'}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isUploading}
                                style={{
                                    padding: '9px 24px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: isUploading ? '#93c5fd' : '#3b82f6',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={e => { if (!isUploading) e.target.style.backgroundColor = '#2563eb'; }}
                                onMouseLeave={e => { if (!isUploading) e.target.style.backgroundColor = '#3b82f6'; }}
                            >
                                {isUploading ? (
                                    <>
                                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        Guardar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animaciones CSS inline */}
            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default GeologiaLayerManager;
