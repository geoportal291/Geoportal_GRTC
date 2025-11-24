import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VerUsuarioModal = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          const response = await axios.get(`/loginusuarios/${userId}`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg pt-2 px-6 pb-6 max-w-lg w-full max-h-[80vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold leading-6">Ver Usuario</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-black text-lg font-bold leading-none">×</button>
        </div>

        {user ? (
          <div>
            <h3 className="font-semibold">Información General</h3>
            <p><strong>DNI:</strong> {user.dni}</p>
            <p><strong>Nombre:</strong> {user.nombre} {user.ap_paterno} {user.ap_materno}</p>
            <p><strong>Fecha de Nacimiento:</strong> {new Date(user.fecha_nacimiento).toLocaleDateString()}</p>
            <p><strong>Fecha de Ingreso:</strong> {new Date(user.fecha_ingreso).toLocaleDateString()}</p>
            <p><strong>Teléfono:</strong> {user.telefono}</p>
            <p><strong>Email Personal:</strong> {user.correo}</p>
            <p><strong>Email Proyecto:</strong> {user.mail_cu_104}</p>
            <p><strong>Profesión:</strong> {user.profesion}</p>
            <p><strong>Rol:</strong> {user.rol_nombre}</p>
            <p><strong>Especialidad:</strong> {user.especialidad_nombre}</p>
            <p><strong>Otros Detalles:</strong> {user.otros_detalles}</p>

            {user.experiencia_academica && user.experiencia_academica.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Experiencia Académica</h3>
                {user.experiencia_academica.map(exp => (
                  <div key={exp.id} className="mb-2">
                    <p><strong>Centro de Estudios:</strong> {exp.centro_estudios}</p>
                    <p><strong>Profesión:</strong> {exp.profesion}</p>
                    <p><strong>Especialidad:</strong> {exp.especialidad}</p>
                    <p><strong>Fecha de Ingreso:</strong> {new Date(exp.fecha_ingreso_academica).toLocaleDateString()}</p>
                    <p><strong>Fecha de Egreso:</strong> {new Date(exp.fecha_egreso_academica).toLocaleDateString()}</p>
                    <p><strong>Información Adicional:</strong> {exp.informacion_adicional_academica}</p>
                  </div>
                ))}
              </div>
            )}

            {user.experiencia_laboral && user.experiencia_laboral.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Experiencia Laboral</h3>
                {user.experiencia_laboral.map(exp => (
                  <div key={exp.id} className="mb-2">
                    <p><strong>Institución:</strong> {exp.institucion}</p>
                    <p><strong>Cargo:</strong> {exp.cargo}</p>
                    <p><strong>Fecha de Ingreso:</strong> {new Date(exp.fecha_ingreso_laboral).toLocaleDateString()}</p>
                    <p><strong>Fecha de Egreso:</strong> {new Date(exp.fecha_egreso_laboral).toLocaleDateString()}</p>
                    <p><strong>Información Adicional:</strong> {exp.informacion_adicional_laboral}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>Cargando...</p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            type="button"
            className="rounded px-4 py-2 text-xs font-semibold leading-5 text-black hover:underline focus:outline-none focus:ring-1 focus:ring-black"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerUsuarioModal;
