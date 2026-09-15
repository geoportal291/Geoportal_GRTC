import React, { useRef } from 'react';
import Swal from 'sweetalert2';
import { API_BASE_URL as API_BASE } from '../../../../../api/config';

export default function ModelImportPanel({
    selectedProjectId,
    userToken,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    onModelUploaded,
    onModelDeleted
}) {
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('proyecto_id', selectedProjectId);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/modelos-3d`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${userToken}`);
        xhr.timeout = 600000;

        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };

        xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const newModel = JSON.parse(xhr.responseText);
                    if (newModel.estado === 'ERROR_PROCESAMIENTO') {
                        throw new Error(newModel.metadata?.detalle || 'El motor 3D no pudo interpretar este archivo.');
                    }
                    Swal.fire({
                        title: '¡IMPORTACIÓN EXITOSA!',
                        text: 'El modelo se ha procesado y renderizado correctamente.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        background: 'var(--slate-900)',
                        color: 'var(--color-surface-alt)'
                    });
                    if (onModelUploaded) onModelUploaded(newModel);
                } catch (err) {
                    Swal.fire({
                        title: 'FALLO DE PROCESAMIENTO',
                        text: err.message,
                        icon: 'error',
                        background: 'var(--slate-900)',
                        color: 'var(--color-surface-alt)'
                    });
                }
            } else {
                Swal.fire({
                    title: 'ERROR DE IMPORTACIÓN',
                    text: 'No se pudo completar la operación.',
                    icon: 'error',
                    background: 'var(--slate-900)',
                    color: 'var(--color-surface-alt)'
                });
            }
            e.target.value = '';
        };

        xhr.onerror = () => {
            setIsUploading(false);
            Swal.fire({
                title: 'FALLO DE CONEXIÓN',
                text: 'La conexión fue interrumpida.',
                icon: 'error',
                background: 'var(--slate-900)',
                color: 'var(--color-surface-alt)'
            });
            e.target.value = '';
        };

        xhr.send(formData);
    };

    return (
        <div className="model-import-trigger">
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".obj,.landxml,.xml"
                onChange={handleFileChange}
            />
            <button
                type="button"
                className="btn-upload-model"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                <i className="fas fa-upload mr-2"></i>
                {isUploading ? `Subiendo... ${uploadProgress}%` : 'Importar Modelo 3D (LandXML/OBJ)'}
            </button>
        </div>
    );
}
