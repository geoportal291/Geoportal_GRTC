import React from 'react';

const SubirExcelAlcantarillasView = ({
  utmZone,
  setUtmZone,
  handleFileChange,
  handleProcessExcel,
  handleDeleteExcelData,
  uploadStatus,
  setModalViewMode,
  setUploadStatus,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label htmlFor="utmZone">Zona UTM:</label>
        <select id="utmZone" value={utmZone} onChange={(e) => setUtmZone(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
          <option value="17L">17L</option>
          <option value="18L">18L</option>
          <option value="19L">19L</option>
        </select>
      </div>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
      <button onClick={handleProcessExcel} style={{
        backgroundColor: '#28a745',
        color: 'white',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s ease'
      }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}>Procesar Excel</button>
      <button onClick={handleDeleteExcelData} style={{
        backgroundColor: '#dc3545',
        color: 'white',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s ease'
      }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}>Eliminar Excel y Datos</button>
      {uploadStatus.message && (
        <p style={{
          color: uploadStatus.type === 'error' ? 'red' : (uploadStatus.type === 'success' ? 'green' : 'blue'),
          fontWeight: 'bold',
          textAlign: 'center'
        }}>{uploadStatus.message}</p>
      )}
      <button type="button" onClick={() => { setModalViewMode('list'); setUploadStatus({ message: '', type: '' }); }} style={{
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

export default SubirExcelAlcantarillasView;
