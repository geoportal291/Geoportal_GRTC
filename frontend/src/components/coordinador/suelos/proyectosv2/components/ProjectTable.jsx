import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from "./SharedComponents";
import departamentosData from "../../../../../data/ubigeo/ubigeo_peru_2016_departamentos.json";
import provinciasData from "../../../../../data/ubigeo/ubigeo_peru_2016_provincias.json";

// Helper functions (Consider moving to a utils file if used elsewhere)
const getDepartmentName = (id) => departamentosData.find(d => d.id === id)?.name || id;
const getProvinceName = (id) => provinciasData.find(p => p.id === id)?.name || id;

const ProjectTable = ({ projects, onEdit, onDelete, onAssign, showAssignAction = true }) => {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">ID</TableHead>
                        <TableHead className="text-center">NOMBRE DE PROYECTO</TableHead>
                        <TableHead className="text-center" style={{ width: '100px' }}>ENTIDAD</TableHead>
                        <TableHead className="text-center">UBICACIÓN</TableHead>
                        <TableHead className="text-center">ESTADO</TableHead>
                        <TableHead className="text-center">ACCIONES</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">
                                No hay proyectos registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        projects.map((p) => (
                            <TableRow
                                key={p.id}
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => onEdit(p)}
                            >
                                <TableCell className="font-medium text-center">{p.id}</TableCell>
                                <TableCell className="text-left">{p.nombre_tramo}</TableCell>
                                <TableCell className="text-center" style={{ width: '100px', whiteSpace: 'normal' }}>
                                    {p.proyecto_nom || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {p.departamento ? `${getDepartmentName(p.departamento)} / ${getProvinceName(p.provincia)}` : 'Sin ubicación'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {p.estado}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button size="sm" onClick={(ev) => { ev.stopPropagation(); onEdit(p); }}>
                                            {showAssignAction ? 'Editar' : 'Completar'}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={(ev) => { ev.stopPropagation(); onDelete(p.id); }}>
                                            Eliminar
                                        </Button>
                                        {showAssignAction && (
                                            <Button size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); onAssign(p.id); }}>
                                                Asignar
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ProjectTable;
