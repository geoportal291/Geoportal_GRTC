import React from 'react';

const FormularioSenalReguladoraView = ({ formData, handleInputChange }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="codigo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Código:</label>
                    <input
                        type="text"
                        id="codigo"
                        name="codigo"
                        value={formData.codigo || ''}
                        onChange={handleInputChange}
                        placeholder="Ej: R-01"
                        required
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Progresiva (Km):</label>
                    <input
                        type="text"
                        id="progresiva"
                        name="progresiva"
                        value={formData.progresiva || ''}
                        onChange={handleInputChange}
                        placeholder="Ej: 10+500"
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="tipo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Tipo:</label>
                    <select
                        id="tipo"
                        name="tipo"
                        value={formData.tipo || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="Señal Vertical">Señal Vertical</option>
                        <option value="Señal Reguladora">Señal Reguladora</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="clasificacion" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Clasificación:</label>
                    <input
                        type="text"
                        id="clasificacion"
                        name="clasificacion"
                        value={formData.clasificacion || ''}
                        onChange={handleInputChange}
                        placeholder="Ej: Señal Reguladora"
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="lado" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Lado:</label>
                    <select
                        id="lado"
                        name="lado"
                        value={formData.lado || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="Derecho">Derecho</option>
                        <option value="Izquierdo">Izquierdo</option>
                        <option value="Eje">Eje</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="soporte" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Soporte:</label>
                    <input
                        type="text"
                        id="soporte"
                        name="soporte"
                        value={formData.soporte || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="material" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Material:</label>
                    <input
                        type="text"
                        id="material"
                        name="material"
                        value={formData.material || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="latitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Latitud:</label>
                    <input
                        type="number"
                        step="any"
                        id="latitud"
                        name="latitud"
                        value={formData.latitud || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="longitud" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Longitud:</label>
                    <input
                        type="number"
                        step="any"
                        id="longitud"
                        name="longitud"
                        value={formData.longitud || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 calc(33.33% - 10px)' }}>
                    <label htmlFor="panel_fotografico_codigo" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Cod. Foto:</label>
                    <input
                        type="text"
                        id="panel_fotografico_codigo"
                        name="panel_fotografico_codigo"
                        value={formData.panel_fotografico_codigo || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 100%' }}>
                    <label htmlFor="observaciones" style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#333' }}>Observaciones:</label>
                    <textarea
                        id="observaciones"
                        rows={3}
                        name="observaciones"
                        value={formData.observaciones || ''}
                        onChange={handleInputChange}
                        style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'vertical' }}
                    />
                </div>

            </div>
        </div>
    );
};

export default FormularioSenalReguladoraView;
