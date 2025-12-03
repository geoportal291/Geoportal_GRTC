import React from 'react';

const SubirExcelBadenesView = ({
    utmZone,
    setUtmZone,
    handleFileChange,
    handleProcessExcel,
    handleDeleteExcelData,
    uploadStatus,
    setModalViewMode,
    setUploadStatus,
    filesToUpload,
    existingExcelFile,
    handleDownloadExcel,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '0px 10px 10px 10px' }}>

            {/* Zone Selection Card */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
            }}>
                <label htmlFor="utmZone" style={{ fontWeight: '600', color: '#495057' }}>Zona UTM:</label>
                <select
                    id="utmZone"
                    value={utmZone}
                    onChange={(e) => setUtmZone(e.target.value)}
                    style={{
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <option value="17L">17L</option>
                    <option value="18L">18L</option>
                    <option value="19L">19L</option>
                </select>
            </div>

            {/* Upload Area */}
            <div style={{ position: 'relative' }}>
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    id="excel-upload-input"
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 2
                    }}
                />
                <div style={{
                    border: '2px dashed #adb5bd',
                    borderRadius: '10px',
                    padding: '20px 20px',
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f5'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                >
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '2.5rem', color: '#6c757d' }}></i>
                    <div>
                        <p style={{ margin: '0', fontSize: '1rem', fontWeight: '500', color: '#343a40' }}>
                            Arrastra tu archivo Excel aquí
                        </p>
                        <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                            o haz clic para buscar en tu equipo
                        </p>
                    </div>
                </div>
            </div>

            {/* Selected File Info */}
            {filesToUpload && filesToUpload.length > 0 ? (
                <div style={{
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #90caf9',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="fas fa-file-excel" style={{ fontSize: '1.5rem', color: '#2e7d32' }}></i>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: '0', fontWeight: '600', color: '#1565c0' }}>{filesToUpload[0].name}</p>
                        <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#546e7a' }}>
                            {(filesToUpload[0].size / 1024).toFixed(2)} KB
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            // Reset file input logic would go here if we had a ref, 
                            // but for now re-clicking the upload area works.
                            // Ideally we should clear the state in parent.
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#d32f2f',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                        }}
                        title="Cambiar archivo"
                    >
                        <i className="fas fa-times-circle"></i>
                    </button>
                </div>
            ) : (
                existingExcelFile ? (
                    <div style={{
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeeba',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-file-excel" style={{ fontSize: '1.5rem', color: '#2e7d32' }}></i>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0', fontWeight: '600', color: '#856404' }}>{existingExcelFile.original_filename || 'Nombre de archivo no disponible'}</p>
                            <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#856404' }}>
                                Archivo cargado
                            </p>
                        </div>
                        {existingExcelFile.excel_url && (
                            <button
                                onClick={handleDownloadExcel}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0056b3',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '5px'
                                }}
                                title="Descargar archivo"
                            >
                                <i className="fas fa-download"></i>
                            </button>
                        )}
                        <i className="fas fa-check-circle" style={{ fontSize: '1.2rem', color: '#28a745' }} title="Archivo procesado"></i>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <i className="fas fa-exclamation-circle" style={{ fontSize: '1.5rem', color: '#dc3545' }}></i>
                        <p style={{ margin: '0', fontWeight: '600', color: '#721c24' }}>No hay archivo Excel cargado para este entregable.</p>
                    </div>
                )
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                <button onClick={handleProcessExcel} style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)',
                    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <i className="fas fa-cog"></i> Procesar Excel
                </button>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={handleDeleteExcelData} style={{
                        flex: 1,
                        backgroundColor: '#fff',
                        color: '#dc3545',
                        padding: '12px',
                        border: '2px solid #dc3545',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                    }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc3545';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.color = '#dc3545';
                        }}
                    >
                        <i className="fas fa-trash-alt"></i> Eliminar Datos
                    </button>

                    <button type="button" onClick={() => { setModalViewMode('list'); setUploadStatus({ message: '', type: '' }); }} style={{
                        flex: 1,
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        Volver a la Lista
                    </button>
                </div>
            </div>

            {/* Status Message */}
            {uploadStatus.message && (
                <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    borderRadius: '8px',
                    backgroundColor: uploadStatus.type === 'error' ? '#f8d7da' : (uploadStatus.type === 'success' ? '#d4edda' : '#cce5ff'),
                    color: uploadStatus.type === 'error' ? '#721c24' : (uploadStatus.type === 'success' ? '#155724' : '#004085'),
                    border: `1px solid ${uploadStatus.type === 'error' ? '#f5c6cb' : (uploadStatus.type === 'success' ? '#c3e6cb' : '#b8daff')}`,
                    textAlign: 'center',
                    fontWeight: '500'
                }}>
                    {uploadStatus.type === 'processing' && <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>}
                    {uploadStatus.message}
                </div>
            )}
        </div>
    );
};

export default SubirExcelBadenesView;
