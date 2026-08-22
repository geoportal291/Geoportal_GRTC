import React from 'react';

const FormularioMuroView = ({ formData, handleChange, handleSubmit, modalViewMode, setModalViewMode, submitButtonText }) => {
    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="progresiva">Progresiva:</label>
                    <input type="text" id="progresiva" name="progresiva" value={formData.progresiva || ''} onChange={handleChange} required />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="clase">Clase:</label>
                    <input type="text" id="clase" name="clase" value={formData.clase || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="material">Material:</label>
                    <input type="text" id="material" name="material" value={formData.material || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="estado">Estado:</label>
                    <input type="text" id="estado" name="estado" value={formData.estado || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="lado">Lado:</label>
                    <input type="text" id="lado" name="lado" value={formData.lado || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud_muro">Longitud:</label>
                    <input type="number" step="0.01" id="longitud_muro" name="longitud_muro" value={formData.longitud_muro || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="alto">Alto:</label>
                    <input type="number" step="0.01" id="alto" name="alto" value={formData.alto || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="ancho">Ancho:</label>
                    <input type="number" step="0.01" id="ancho" name="ancho" value={formData.ancho || ''} onChange={handleChange} />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="latitud">Latitud:</label>
                    <input type="number" step="any" id="latitud" name="latitud" value={formData.latitud || ''} onChange={handleChange} required />
                </div>
                <div style={{ flex: '1 1 calc(50% - 7.5px)' }}>
                    <label htmlFor="longitud">Longitud:</label>
                    <input type="number" step="any" id="longitud" name="longitud" value={formData.longitud || ''} onChange={handleChange} required />
                </div>
                <div style={{ flex: '1 1 100%' }}>
                    <label htmlFor="observaciones">Observaciones:</label>
                    <textarea id="observaciones" name="observaciones" value={formData.observaciones || ''} onChange={handleChange} rows="3" style={{ width: '100%' }} />
                </div>
                <div style={{ flex: '1 1 100%' }}>
                    <label htmlFor="panel_fotografico_codigo">Código Panel Fotográfico:</label>
                    <input type="text" id="panel_fotografico_codigo" name="panel_fotografico_codigo" value={formData.panel_fotografico_codigo || ''} onChange={handleChange} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="submit-button">{submitButtonText}</button>
                <button type="button" className="cancel-button" onClick={() => setModalViewMode('list')}>Volver a la Lista</button>
            </div>
        </form>
    );
};

export default FormularioMuroView;
