import React from 'react';

const FormularioZonaCriticaView = ({
    formData,
    handleChange,
    handleSubmit,
    modalViewMode,
    setModalViewMode,
    submitButtonText,
}) => {
    // Determine if the record corresponds to 'Ahuellamiento' (Zone 2) or 'Deslizamiento' (Zone 1)
    // Logic based on backend service import structure:
    // Zone 1 (Deslizamiento): Has Lado, Longitud, Panel, Entregable. No Clase/Condicion.
    // Zone 2 (Ahuellamiento): Has Clase/Condicion. No Lado/Longitud/Panel/Entregable.
    const isAhuellamiento = formData.numero_seguimiento === 2 ||
        (formData.tipo && formData.tipo.toString().toLowerCase().includes('ahuellamiento'));

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {modalViewMode === 'edit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                        <label htmlFor="id_zona_critica" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>ID Zona Crítica:</label>
                        <input type="text" id="id_zona_critica" name="id_zona_critica" value={formData.id_zona_critica ?? ''} disabled style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0', color: '#666' }} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="codigo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Código:</label>
                    <input type="text" id="codigo" name="codigo" value={formData.codigo ?? ''} onChange={handleChange} disabled style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0', color: '#666' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva:</label>
                    <input type="text" id="progresiva" name="progresiva" value={formData.progresiva ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="tipo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Tipo:</label>
                    <input type="text" id="tipo" name="tipo" value={formData.tipo ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>

                {/* Fields for Deslizamiento / Zone 1 */}
                {!isAhuellamiento && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="lado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Lado:</label>
                            <input type="text" id="lado" name="lado" value={formData.lado ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="longitud_zona" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud Zona:</label>
                            <input type="text" id="longitud_zona" name="longitud_zona" value={formData.longitud_zona ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="latitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud:</label>
                    <input type="number" step="any" id="latitud" name="latitud" value={formData.latitud ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud:</label>
                    <input type="number" step="any" id="longitud" name="longitud" value={formData.longitud ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="altitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Altitud:</label>
                    <input type="text" id="altitud" name="altitud" value={formData.altitud ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                </div>

                {/* Fields for Ahuellamiento / Zone 2 */}
                {isAhuellamiento && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="clase_dano" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Clase de Daño:</label>
                            <input type="text" id="clase_dano" name="clase_dano" value={formData.clase_dano ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="condicion" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Condición:</label>
                            <input type="text" id="condicion" name="condicion" value={formData.condicion ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>
                    </>
                )}

                {/* More Fields for Deslizamiento / Zone 1 */}
                {!isAhuellamiento && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="entregable" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Entregable:</label>
                            <input type="text" id="entregable" name="entregable" value={formData.entregable ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                            <label htmlFor="panel_fotografico_codigo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Cód. Panel Fotográfico:</label>
                            <input type="text" id="panel_fotografico_codigo" name="panel_fotografico_codigo" value={formData.panel_fotografico_codigo ?? ''} onChange={handleChange} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(100%)' }}>
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

export default FormularioZonaCriticaView;
