import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';
import '../../proyectos/GestorProyectos.css'; // Reutilizamos estilos generales

const FormularioProgresiva = ({ onClose, onSave, proyectoId, progresivaData }) => {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Activar el modal con un pequeño retraso para permitir la transición CSS
        const timer = setTimeout(() => {
            setIsActive(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsActive(false);
        // Esperar a que termine la transición antes de cerrar completamente
        const timer = setTimeout(() => {
            onClose();
        }, 300); // Coincide con la duración de la transición en CSS
        return () => clearTimeout(timer);
    };

    const initialFormData = {
        nombre: '',
        linea: '18L',
        coordenada_este: '',
        coordenada_norte: '',
        descripcion: '',
        fecha_ejecucion: '',
        estado: 'pendiente',
        longitud_total: '',
        tipo_via: '500',
        intervalo_manual: '',
        isIntervalManual: false,
    };

    const [formData, setFormData] = useState(initialFormData);
    const [subProgresivasGeneradas, setSubProgresivasGeneradas] = useState([]);
    const [estratos, setEstratos] = useState([]);
    const [estratosPerfil, setEstratosPerfil] = useState([]);
    const [currentEstratoIndex, setCurrentEstratoIndex] = useState(0);

    const API_URL = process.env.REACT_APP_API_BASE || '';
    const token = JSON.parse(localStorage.getItem('user'))?.token;

    useEffect(() => {
        const fetchEstratosDisponibles = async () => {
            try {
                const res = await axios.get(`${API_URL}/estratos`, { headers: { 'Authorization': `Bearer ${token}` } });
                setEstratos(res.data);
            } catch (err) {
                console.error("Error fetching estratos disponibles:", err);
                alertify.error("Error al cargar los estratos disponibles.");
            }
        };
        fetchEstratosDisponibles();
    }, [API_URL, token]);

    useEffect(() => {
        if (estratos.length > 0 && estratosPerfil.length === 0) {
            const defaultEstrato = {
                id: Date.now(),
                estrato_id: estratos[0].id,
                profundidad_inicial: 0,
                profundidad_final: 0,
                descripcion: ''
            };
            setEstratosPerfil([defaultEstrato]);
            setCurrentEstratoIndex(0);
        }
    }, [estratos, estratosPerfil]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEstratoChange = (index, e) => {
        const { name, value } = e.target;
        setEstratosPerfil(prev => {
            const newPerfil = JSON.parse(JSON.stringify(prev));
            newPerfil[index] = { ...newPerfil[index], [name]: value };

            if (name === 'profundidad_final') {
                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    newPerfil[index][name] = numericValue;
                }
                if (index < newPerfil.length - 1) {
                    for (let i = index + 1; i < newPerfil.length; i++) {
                        newPerfil[i].profundidad_inicial = newPerfil[i - 1].profundidad_final;
                    }
                }
            }
            return newPerfil;
        });
    };

    const handleAddEstrato = () => {
        if (estratos.length === 0) {
            alertify.error('No hay estratos disponibles. Por favor, configure los estratos primero.');
            return;
        }
        setEstratosPerfil(prev => {
            // Find the stratum with ID 1, or default to the first available stratum
            const defaultEstrato = estratos.find(est => est.id === 1) || estratos[0];

            const newEstrato = {
                id: Date.now(),
                estrato_id: defaultEstrato.id, // Set to ID 1 or first available
                profundidad_inicial: prev.length > 0 ? prev[prev.length - 1].profundidad_final : 0,
                profundidad_final: 0,
                descripcion: ''
            };
            const newPerfil = [...prev, newEstrato];
            setCurrentEstratoIndex(newPerfil.length - 1);
            return newPerfil;
        });
    };

    const handleRemoveEstrato = () => {
        setEstratosPerfil(prev => {
            const newPerfil = prev.filter((_, index) => index !== currentEstratoIndex);
            if (currentEstratoIndex >= newPerfil.length && newPerfil.length > 0) {
                setCurrentEstratoIndex(newPerfil.length - 1);
            }
            return newPerfil;
        });
    };

    const handleGenerarProgresivas = () => {
        const totalLength = parseFloat(formData.longitud_total);
        let interval = parseFloat(formData.tipo_via);

        if (formData.isIntervalManual) {
            interval = parseFloat(formData.intervalo_manual);
        }

        if (isNaN(totalLength) || totalLength <= 0) {
            alertify.error("La Longitud Total debe ser un número mayor a 0.");
            return;
        }
        if (isNaN(interval) || interval <= 0) {
            alertify.error("El Intervalo debe ser un número mayor a 0.");
            return;
        }

        const generated = [];
        let currentTotalMeters = 0;

        while (currentTotalMeters <= totalLength) {
            const km = Math.floor(currentTotalMeters / 1000);
            const meters = currentTotalMeters % 1000;
            generated.push(`${km}+${String(meters).padStart(3, '0')}`);
            currentTotalMeters += interval;
        }
        setSubProgresivasGeneradas(generated);
        alertify.success("Sub-progresivas generadas correctamente.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const commonData = {
            nombre: formData.nombre,
            linea: formData.linea,
            coordenada_este: formData.coordenada_este,
            coordenada_norte: formData.coordenada_norte,
            descripcion: formData.descripcion,
            fecha_ejecucion: formData.fecha_ejecucion,
            estado: formData.estado,
            estratos_perfil: estratosPerfil.map(ep => ({
                estrato_id: (ep.estrato_id !== null && ep.estrato_id !== '') ? Number(ep.estrato_id) : null,
                profundidad_inicial: Number(ep.profundidad_inicial),
                profundidad_final: Number(ep.profundidad_final),
                descripcion: ep.descripcion,
            })),
            longitud_total: formData.longitud_total,
            tipo_via: formData.tipo_via,
            intervalo_manual: formData.intervalo_manual,
            proyecto_id: proyectoId,
        };

        try {
            if (progresivaData) { // Estamos editando una progresiva existente
                const url = `${API_URL}/api/progresivas/${progresivaData.id}`;
                const dataToSend = {
                    ...commonData,
                    // No se necesitan generationParams para la edición
                };
                console.log("Data to send for update:", dataToSend);
                await axios.put(url, dataToSend, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                alertify.success("Progresiva actualizada correctamente.");
            } else { // Estamos creando una nueva progresiva
                const url = `${API_URL}/proyectos/crear-completo`;
                const dataToSend = {
                    progresivaData: {
                        parentProgresiva: {
                            ...commonData,
                            proyecto_id: proyectoId,
                        },
                        generationParams: {
                            valorTotal: parseFloat(formData.longitud_total),
                            intervalo: formData.isIntervalManual ? parseFloat(formData.intervalo_manual) : parseFloat(formData.tipo_via),
                        },
                    },
                };
                console.log("Data to send for creation:", dataToSend);
                await axios.post(url, dataToSend, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                alertify.success("Progresiva creada y asociada al proyecto correctamente.");
            }
            onSave(); // Notificar al padre que se guardó/actualizó
            onClose(); // Cerrar el modal
        } catch (error) {
            console.error("Error al guardar progresiva:", error);
            alertify.error(`Error al guardar progresiva: ${error.response?.data?.error || error.message}`);
        }
    };

    const finalDepth = estratosPerfil.length > 0 ? estratosPerfil[estratosPerfil.length - 1].profundidad_final : 0;

    return (
        <div className={`modal-overlay ${isActive ? 'modal-active' : ''}`}>
            <div className="modal-content">
                <h3>Registrar nueva Progresiva </h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Longitud Total (metro)</label>
                            <input type="number" name="longitud_total" value={formData.longitud_total} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Intervalo (metros)</label>
                            <div className="intervalo-container">
                                {formData.isIntervalManual ? (
                                    <input
                                        type="number"
                                        name="intervalo_manual"
                                        value={formData.intervalo_manual}
                                        onChange={handleInputChange}
                                        className="intervalo-input"
                                    />
                                ) : (
                                    <select
                                        name="tipo_via"
                                        value={formData.tipo_via}
                                        onChange={handleInputChange}
                                        className="intervalo-select"
                                    >
                                        <option value="100">TIPO I - Autopistas (100m)</option>
                                        <option value="250">Tipo II - Vias principales (250m)</option>
                                        <option value="500">Tipo III - Vias secundarias (500m)</option>
                                        <option value="1000">Tipo IV Vias locales (1000m)</option>
                                    </select>
                                )}
                                <button
                                    type="button"
                                    className="btn-toggle-intervalo"
                                    onClick={() => setFormData(prev => ({ ...prev, isIntervalManual: !prev.isIntervalManual, intervalo_manual: '' }))}
                                >
                                    {formData.isIntervalManual ? 'Seleccionar' : 'Manual'}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Zona</label>
                            <select name="linea" value={formData.linea} onChange={handleInputChange}>
                                <option value="17L">17L</option>
                                <option value="18L">18L</option>
                                <option value="19L">19L</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ubicación</label>
                            <div className="coordenadas-group">
                                <input type="text" name="coordenada_este" placeholder="Coord. Este" value={formData.coordenada_este} onChange={handleInputChange} />
                                <input type="text" name="coordenada_norte" placeholder="Coord. Norte" value={formData.coordenada_norte} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select name="estado" value={formData.estado} onChange={handleInputChange} required>
                                <option value="pendiente">Pendiente</option>
                                <option value="en revision">En Revisión</option>
                                <option value="aprobado">Aprobado</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha Ejecución</label>
                            <input type="date" name="fecha_ejecucion" value={formData.fecha_ejecucion} onChange={handleInputChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} />
                        </div>
                        <div className="form-group full-width">
                            <button type="button" onClick={handleGenerarProgresivas} className="btn-generar-progresivas">Generar Sub-Progresivas</button>
                            {subProgresivasGeneradas.length > 0 && (
                                <div className="sub-progresivas-container">
                                    <h4>Sub-Progresivas Generadas</h4>
                                    <ul className="sub-progresivas-list">
                                        {subProgresivasGeneradas.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="form-group full-width">
                            <h4>Perfil de Estratos</h4>
                            {estratosPerfil.length > 0 && (
                                <div className="estrato-slider">
                                    <div className="estrato-item" key={currentEstratoIndex}>
                                        <h5>Estrato {currentEstratoIndex + 1} / {estratosPerfil.length}</h5>

                                        <label>Profundidad Inicial (m)</label>
                                        <input type="number" name="profundidad_inicial" value={estratosPerfil[currentEstratoIndex].profundidad_inicial} onChange={(e) => handleEstratoChange(currentEstratoIndex, e)} readOnly required />
                                        <label>Profundidad Final (m)</label>
                                        <input type="number" step="any" name="profundidad_final" value={estratosPerfil[currentEstratoIndex].profundidad_final} onChange={(e) => handleEstratoChange(currentEstratoIndex, e)} required />
                                        <label>Descripción del Estrato</label>
                                        <textarea name="descripcion" value={estratosPerfil[currentEstratoIndex].descripcion} onChange={(e) => handleEstratoChange(currentEstratoIndex, e)} />
                                        <button type="button" onClick={handleRemoveEstrato} className="remove-estrato-btn">Eliminar Estrato</button>
                                    </div>
                                    <div className="estrato-slider-nav">
                                        <button type="button" onClick={() => setCurrentEstratoIndex(i => Math.max(0, i - 1))} disabled={currentEstratoIndex === 0}>Anterior</button>
                                        <button type="button" onClick={() => setCurrentEstratoIndex(i => Math.min(estratosPerfil.length - 1, i + 1))} disabled={currentEstratoIndex === estratosPerfil.length - 1}>Siguiente</button>
                                    </div>
                                </div>
                            )}
                            <button type="button" onClick={handleAddEstrato} className="add-estrato-btn">Añadir Estrato</button>
                            {estratosPerfil.length > 0 && (
                                <>
                                    <div className="profundidad-final-display">
                                        <label>Profundidad Final Total (m):</label>
                                        <span>{finalDepth}</span>
                                    </div>
                                    <div className="estratos-summary-container">
                                        <h4>Resumen de Estratos</h4>
                                        <table className="estratos-summary-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Estrato</th>
                                                    <th>Prof. Inicial (m)</th>
                                                    <th>Prof. Final (m)</th>
                                                    <th>Descripción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {estratosPerfil.map((estrato, index) => {
                                                    return (
                                                        <tr key={estrato.id || index}>
                                                            <td>{index + 1}</td>
                                                            <td>{`Estrato ${index + 1}`}</td>
                                                            <td>{estrato.profundidad_inicial}</td>
                                                            <td>{estrato.profundidad_final}</td>
                                                            <td>{estrato.descripcion}</td>
                                                        </tr>
                                                    );
                                                })}

                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn">Guardar Progresiva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioProgresiva;
