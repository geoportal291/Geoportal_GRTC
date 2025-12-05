import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Select, Label } from './SharedComponents';

const SimpleCreateModal = ({ isOpen, onClose, onSave, users = [], entidades = [] }) => {
    const [formData, setFormData] = useState({
        nombre_tramo: '',
        proyecto_nom: '',
        coordinator_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre_tramo: '',
                proyecto_nom: '',
                coordinator_id: ''
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nuevo Proyecto (Básico)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nombre_tramo">Nombre del Tramo / Proyecto</Label>
                            <Input
                                id="nombre_tramo"
                                name="nombre_tramo"
                                value={formData.nombre_tramo}
                                onChange={handleChange}
                                placeholder="Ej. Carretera Cusco - Abancay"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="proyecto_nom">Entidad Solicitante</Label>
                            <Select
                                id="proyecto_nom"
                                name="proyecto_nom"
                                value={formData.proyecto_nom}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Seleccione Entidad</option>
                                {entidades.map(e => (
                                    <option key={e.id} value={e.nombre}>{e.nombre}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="coordinator_id">Asignar Coordinador</Label>
                            <Select
                                id="coordinator_id"
                                name="coordinator_id"
                                value={formData.coordinator_id}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione Coordinador (Opcional)</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombre}</option>
                                ))}
                            </Select>
                            <p className="text-xs text-gray-500">
                                La persona seleccionada será responsable de completar la información del proyecto.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Crear Proyecto
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SimpleCreateModal;
