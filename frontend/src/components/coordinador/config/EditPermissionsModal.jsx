import React, { useState, useEffect } from 'react';
import axios from 'axios';
import alertify from 'alertifyjs';

const API_BASE_URL = process.env.REACT_APP_API_BASE || '';

const EditPermissionsModal = ({ isOpen, onClose, userId, roleId, onPermissionsUpdated }) => {
  const [generalAccessType, setGeneralAccessType] = useState('none');
  const [permissions, setPermissions] = useState([]); // All available permissions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all available permissions
  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/permissions/all`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
          }
        });
        setPermissions(response.data);
      } catch (err) {
        console.error('Error fetching all permissions:', err);
        setError('Error al cargar permisos disponibles.');
      }
    };
    fetchAllPermissions();
  }, []);

  // Load current permissions for the selected user/role
  useEffect(() => {
    const loadCurrentPermissions = async () => {
      setLoading(true);
      setError(null);
      let currentPerms = {};

      try {
        if (userId) {
          const res = await axios.get(`${API_BASE_URL}/api/permissions/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          currentPerms = res.data;
        } else if (roleId) {
          const res = await axios.get(`${API_BASE_URL}/api/permissions/role/${roleId}`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          currentPerms = res.data;
        }

        // Determine general access type based on currentPerms
        let hasEdit = false;
        let hasRead = false;
        for (const permKey in currentPerms) {
          if (currentPerms[permKey]) {
            if (permKey.endsWith('_edicion')) {
              hasEdit = true;
              break;
            } else if (permKey.endsWith('_lectura')) {
              hasRead = true;
            }
          }
        }

        if (hasEdit) {
          setGeneralAccessType('read_edit');
        } else if (hasRead) {
          setGeneralAccessType('read');
        } else {
          setGeneralAccessType('none');
        }
      } catch (err) {
        console.error('Error loading current permissions:', err);
        setError('Error al cargar permisos actuales.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && (userId || roleId)) {
      loadCurrentPermissions();
    }
  }, [isOpen, userId, roleId]);

  const handleSavePermissions = async () => {
    setLoading(true);
    setError(null);
    let permissionsToSend = {};

    if (generalAccessType === 'read_edit') {
      permissions.forEach(perm => {
        permissionsToSend[`${perm.nombre}_lectura`] = true;
        permissionsToSend[`${perm.nombre}_edicion`] = true;
      });
    } else if (generalAccessType === 'read') {
      permissions.forEach(perm => {
        permissionsToSend[`${perm.nombre}_lectura`] = true;
        permissionsToSend[`${perm.nombre}_edicion`] = false;
      });
    } else if (generalAccessType === 'none') {
      permissions.forEach(perm => {
        permissionsToSend[`${perm.nombre}_lectura`] = false;
        permissionsToSend[`${perm.nombre}_edicion`] = false;
      });
    }

    try {
      if (userId) {
        await axios.post(`${API_BASE_URL}/api/permissions/user/${userId}`, permissionsToSend, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
          }
        });
        alertify.success('Permisos del usuario actualizados correctamente.');
      } else if (roleId) {
        await axios.post(`${API_BASE_URL}/api/permissions/role/${roleId}`, permissionsToSend, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
          }
        });
        alertify.success('Permisos del rol actualizados correctamente.');
      }
      onPermissionsUpdated();
      onClose();
    } catch (err) {
      console.error('Error al guardar permisos:', err);
      alertify.error('Error al guardar permisos. Verifique la consola para más detalles.');
      setError('Error al guardar permisos.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg pt-2 px-6 pb-6 max-w-lg w-full max-h-[80vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold leading-6">Editar Permisos</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-black text-lg font-bold leading-none">×</button>
        </div>

        {loading ? (
          <p>Cargando permisos...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <div>
            <h3 className="font-semibold mb-2">Tipo de Acceso General:</h3>
            <div className="flex flex-col space-y-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="generalAccess"
                  value="none"
                  checked={generalAccessType === 'none'}
                  onChange={() => setGeneralAccessType('none')}
                  className="form-radio"
                />
                <span className="ml-2">Sin Acceso</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="generalAccess"
                  value="read"
                  checked={generalAccessType === 'read'}
                  onChange={() => setGeneralAccessType('read')}
                  className="form-radio"
                />
                <span className="ml-2">Solo Lectura</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="generalAccess"
                  value="read_edit"
                  checked={generalAccessType === 'read_edit'}
                  onChange={() => setGeneralAccessType('read_edit')}
                  className="form-radio"
                />
                <span className="ml-2">Lectura y Edición</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onClose}
                type="button"
                className="rounded px-4 py-2 text-xs font-semibold leading-5 text-black hover:underline focus:outline-none focus:ring-1 focus:ring-black"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                type="button"
                className="rounded bg-black px-4 py-2 text-xs font-semibold leading-5 text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPermissionsModal;
