import React from 'react';

const SubirExcelMurosView = ({
    filesToUpload,
    handleFileChange,
    handleUpload,
    isUploading,
    uploadProgress,
    uploadStatus,
    utmZone,
    setUtmZone,
    processedRange,
    etr,
    processedFileName,
    handleDownloadExcel,
    excelFileInfo,
    handleDeleteExcel
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <h4 style={{ marginTop: 0, color: '#495057' }}>Subir Excel de Muros</h4>
                <p style={{ fontSize: '0.9em', color: '#6c757d' }}>
                    Seleccione el archivo Excel que contiene los datos de los muros de contención.
                    Asegúrese de que el formato sea correcto.
                </p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Zona UTM:</label>
                    <select
                        value={utmZone}
                        onChange={(e) => setUtmZone(Number(e.target.value))}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', width: '100px' }}
                    >
                        <option value={17}>17</option>
                        <option value={18}>18</option>
                        <option value={19}>19</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        style={{ flex: 1 }}
                    />
                    <button
                        onClick={handleUpload}
                        disabled={!filesToUpload || isUploading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isUploading ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isUploading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isUploading ? `Subiendo ${uploadProgress}%` : 'Subir Excel'}
                    </button>
                </div>

                {uploadStatus.message && (
                    <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        borderRadius: '5px',
                        backgroundColor: uploadStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: uploadStatus.type === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${uploadStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                        {uploadStatus.message}
                    </div>
                )}
            </div>

            {excelFileInfo && (
                <div style={{ padding: '15px', backgroundColor: '#e2e3e5', borderRadius: '8px', border: '1px solid #d6d8db' }}>
                    <h4 style={{ marginTop: 0, color: '#383d41' }}>Archivo Actual</h4>
                    <p><strong>Nombre:</strong> {excelFileInfo.original_name}</p>
                    <p><strong>Fecha de subida:</strong> {new Date(excelFileInfo.upload_date).toLocaleString()}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={handleDownloadExcel} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Descargar
                        </button>
                        <button onClick={handleDeleteExcel} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Eliminar Datos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubirExcelMurosView;
