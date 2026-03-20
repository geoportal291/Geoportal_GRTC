import React, { useState } from 'react';
import axiosInstance from '../../../../../api/axios';
import alertify from 'alertifyjs';

const GeologiaLayerManager = ({ tabName, projectData, onUploadSuccess, accept }) => {
    const [isUploading, setIsUploading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const isAdmin = user.rol_nombre === 'ADMIN' || user.rol_nombre === 'COORDINADOR PROYECTO';

    if (!isAdmin) return null;

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const projectId = projectData?.id_proyecto || projectData?.id;
        if (!projectId) {
            alertify.error('Error: No se encontró el ID del proyecto.');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('tabName', tabName);

        setIsUploading(true);
        alertify.message('Subiendo archivo, por favor espere...');

        try {
            await axiosInstance.post(`/api/proyectos/${projectId}/geologia-capas`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alertify.success('Capa geológica guardada exitosamente.');
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error('Error al subir la capa:', error);
            alertify.error('Ocurrió un error al subir el archivo Vercel Blob.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = null;
        }
    };

    const handleDeleteCapa = async () => {
        const projectId = projectData?.id_proyecto || projectData?.id;
        if (!projectId) return;

        alertify.confirm(
            "Confirmar Eliminación",
            `¿Está seguro que desea eliminar la capa actual de geología local?`,
            async () => {
                setIsUploading(true);
                try {
                    await axiosInstance.delete(`/api/proyectos/${projectId}/geologia-capas/${tabName}`);
                    alertify.success('Capa geológica eliminada exitosamente.');
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

    return (
        <div style={{ display: 'inline-flex', gap: '10px' }}>
            <label className="geoltab-upload-btn" style={{
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
            }}>
                <span style={{ fontSize: '16px' }}>
                    {isUploading ? '⏳' : '📤'}
                </span>
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                <input
                    type="file"
                    accept={accept || '.kml,.kmz,.rar,.zip'}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={isUploading}
                />
            </label>

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
        </div>
    );
};

export default GeologiaLayerManager;
