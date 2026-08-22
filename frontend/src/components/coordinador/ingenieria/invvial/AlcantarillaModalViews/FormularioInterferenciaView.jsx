import React, { useState, useEffect } from 'react';

const FormularioInterferenciaView = ({ formData, handleChange, handleSave, isEditing, onClose }) => {
    const [localFormData, setLocalFormData] = useState({
        progresiva: '',
        tipo_interferencia: '',
        material: '',
        tension: '',
        lado: 'L.D.',
        latitud: '',
        longitud: '',
        observaciones: '',
        panel_fotografico: '',
        entregable: ''
    });

    useEffect(() => {
        if (formData) {
            setLocalFormData({
                progresiva: formData.progresiva || '',
                tipo_interferencia: formData.tipo_interferencia || '',
                material: formData.material || '',
                tension: formData.tension || '',
                lado: formData.lado || 'L.D.',
                latitud: formData.latitud || '',
                longitud: formData.longitud || '',
                observaciones: formData.observaciones || '',
                panel_fotografico: formData.panel_fotografico || '',
                entregable: formData.entregable || ''
            });
        }
    }, [formData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLocalFormData(prev => {
            const newData = { ...prev, [name]: value };
            handleChange({ target: { name, value } }); // Propagate change up
            return newData;
        });
    };

    const handleSubmit = (e) => {
        handleSave(e);
    };

    return (
        <div className="formulario-container">
            <h3>{isEditing ? 'Editar Interferencia' : 'Nueva Interferencia'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group-row">
                    <div className="form-group">
                        <label>Progresiva:</label>
                        <input
                            type="text"
                            name="progresiva"
                            value={localFormData.progresiva}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipo:</label>
                        <input
                            type="text"
                            name="tipo_interferencia"
                            value={localFormData.tipo_interferencia}
                            onChange={handleInputChange}
                            placeholder="Ej. Poste, Torre, etc."
                        />
                    </div>
                </div>

                <div className="form-group-row">
                    <div className="form-group">
                        <label>Material:</label>
                        <input
                            type="text"
                            name="material"
                            value={localFormData.material}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Tensión:</label>
                        <input
                            type="text"
                            name="tension"
                            value={localFormData.tension}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="form-group-row">
                    <div className="form-group">
                        <label>Lado:</label>
                        <select name="lado" value={localFormData.lado} onChange={handleInputChange}>
                            <option value="L.D.">L.D.</option>
                            <option value="L.I.">L.I.</option>
                            <option value="EJE">EJE</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Entregable:</label>
                        <input
                            type="text"
                            name="entregable"
                            value={localFormData.entregable}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="form-group-row">
                    <div className="form-group">
                        <label>Latitud:</label>
                        <input
                            type="number"
                            step="any"
                            name="latitud"
                            value={localFormData.latitud}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Longitud:</label>
                        <input
                            type="number"
                            step="any"
                            name="longitud"
                            value={localFormData.longitud}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Panel Fotográfico (Código):</label>
                    <input
                        type="text"
                        name="panel_fotografico"
                        value={localFormData.panel_fotografico}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label>Observaciones:</label>
                    <textarea
                        name="observaciones"
                        value={localFormData.observaciones}
                        onChange={handleInputChange}
                        rows="3"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-save">Guardar</button>
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                </div>
            </form>
        </div>
    );
};

export default FormularioInterferenciaView;
