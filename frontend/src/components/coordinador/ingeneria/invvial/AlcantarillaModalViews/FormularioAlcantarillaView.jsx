import React from 'react';

const FormularioAlcantarillaView = ({
  formData,
  handleChange,
  handleSubmit,
  modalViewMode,
  setModalViewMode,
  submitButtonText,
}) => {
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
      {modalViewMode === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
          <label htmlFor="id_alcantarilla" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>ID Alcantarilla:</label>
          <input type="text" id="id_alcantarilla" name="id_alcantarilla" value={formData.id_alcantarilla} disabled style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0', color: '#666' }} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="codigo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Código:</label>
        <input type="text" id="codigo" name="codigo" value={formData.codigo} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="tipo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Tipo:</label>
        <input type="text" id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="diametro_lado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Diámetro/Lado:</label>
        <input type="text" id="diametro_lado" name="diametro_lado" value={formData.diametro_lado} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="longitud_alcantarilla" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud Alcantarilla:</label>
        <input type="number" step="any" id="longitud_alcantarilla" name="longitud_alcantarilla" value={formData.longitud_alcantarilla} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="progresiva" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva:</label>
        <input type="text" id="progresiva" name="progresiva" value={formData.progresiva} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="latitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud:</label>
        <input type="number" step="any" id="latitud" name="latitud" value={formData.latitud} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="longitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud:</label>
        <input type="number" step="any" id="longitud" name="longitud" value={formData.longitud} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="estado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Estado:</label>
        <select id="estado" name="estado" value={formData.estado || ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff' }} required>
          <option value="">Seleccione</option>
          <option value="Bueno">Bueno</option>
          <option value="Regular">Regular</option>
          <option value="Malo">Malo</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
        <label htmlFor="observaciones" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Observaciones:</label>
        <textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
      </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button type="submit" style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '1em',
          transition: 'background-color 0.2s ease'
        }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}>{submitButtonText}</button>
        <button type="button" onClick={() => setModalViewMode('list')} style={{
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
    </form>
  );
};

export default FormularioAlcantarillaView;
