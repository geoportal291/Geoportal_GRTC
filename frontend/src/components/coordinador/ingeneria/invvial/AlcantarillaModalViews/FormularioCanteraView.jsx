import React from 'react';

const FormularioCanteraView = ({
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
                    <label htmlFor="nombre" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Nombre Cantera:</label>
                    <input type="text" id="nombre" name="nombre" value={formData.nombre ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="material" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Material:</label>
                    <input type="text" id="material" name="material" value={formData.material ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="estado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Estado:</label>
                    <input type="text" id="estado" name="estado" value={formData.estado ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="accesibilidad" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Accesibilidad:</label>
                    <input type="text" id="accesibilidad" name="accesibilidad" value={formData.accesibilidad ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva:</label>
                    <input type="text" id="progresiva" name="progresiva" value={formData.progresiva ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(25% - 11.25px)' }}>
                    <label htmlFor="lado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Lado:</label>
                    <input type="text" id="lado" name="lado" value={formData.lado ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(25% - 11.25px)' }}>
                    <label htmlFor="desplazamiento_km" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Desplaz. (Km):</label>
                    <input type="number" step="any" id="desplazamiento_km" name="desplazamiento_km" value={formData.desplazamiento_km ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="latitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud:</label>
                    <input type="number" step="any" id="latitud" name="latitud" value={formData.latitud ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud:</label>
                    <input type="number" step="any" id="longitud" name="longitud" value={formData.longitud ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="coordenada_este" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>UTM Este:</label>
                    <input type="number" step="any" id="coordenada_este" name="coordenada_este" value={formData.coordenada_este ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="coordenada_norte" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>UTM Norte:</label>
                    <input type="number" step="any" id="coordenada_norte" name="coordenada_norte" value={formData.coordenada_norte ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 100%' }}>
                    <label htmlFor="descripcion" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Descripción / Observaciones:</label>
                    <textarea id="descripcion" name="descripcion" value={formData.descripcion ?? ''} onChange={handleChange} rows="3" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
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

export default FormularioCanteraView;
