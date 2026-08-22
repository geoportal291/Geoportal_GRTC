import React from 'react';

const FormularioEstructuraExistenteView = ({
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
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva_inicio" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva Inicio:</label>
                    <input type="text" id="progresiva_inicio" name="progresiva_inicio" value={formData.progresiva_inicio ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva_final" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva Final:</label>
                    <input type="text" id="progresiva_final" name="progresiva_final" value={formData.progresiva_final ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="latitud_inicio" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud Inicio:</label>
                    <input type="number" step="any" id="latitud_inicio" name="latitud_inicio" value={formData.latitud_inicio ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud_inicio" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud Inicio:</label>
                    <input type="number" step="any" id="longitud_inicio" name="longitud_inicio" value={formData.longitud_inicio ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="latitud_final" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud Final:</label>
                    <input type="number" step="any" id="latitud_final" name="latitud_final" value={formData.latitud_final ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud_final" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud Final:</label>
                    <input type="number" step="any" id="longitud_final" name="longitud_final" value={formData.longitud_final ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="ancho_calzada" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Ancho Calzada:</label>
                    <input type="number" step="any" id="ancho_calzada" name="ancho_calzada" value={formData.ancho_calzada ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="panel_fotografico" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Cód. Panel Fotográfico:</label>
                    <input type="text" id="panel_fotografico" name="panel_fotografico" value={formData.panel_fotografico ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 100%' }}>
                    <label htmlFor="observaciones" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Observaciones:</label>
                    <textarea id="observaciones" name="observaciones" value={formData.observaciones ?? ''} onChange={handleChange} rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
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
        </form >
    );
};

export default FormularioEstructuraExistenteView;
