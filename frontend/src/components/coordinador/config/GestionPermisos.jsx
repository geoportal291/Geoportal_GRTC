import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axios';
import EditPermissionsModal from './EditPermissionsModal';
import './loading.css';

function GestionPermisos() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/usuarios', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (userId) => {
    setEditingUserId(userId);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUserId(null);
    fetchUsers(); // Refresh user list after potential permission update
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = search.toLowerCase();
    return (
      user.dni?.toLowerCase().includes(searchTerm) ||
      `${user.nombre} ${user.ap_paterno} ${user.ap_materno}`.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <section
      className="border border-gray-200 rounded-lg p-4 max-w-full overflow-x-auto"
      aria-label="Gestión de Permisos"
    >
      <div className="text-center mb-3">
        <p className="font-semibold text-sm">Gestión de Permisos</p>
        <p className="text-xs text-gray-500">
          Asignación de permisos y niveles de acceso a los usuarios
        </p>
      </div>

      <form className="flex items-center gap-2 mb-4 max-w-full">
        <label htmlFor="search" className="sr-only">Buscar</label>
        <input
          id="search"
          type="search"
          placeholder="Buscar por nombre, DNI o proyecto..."
          className="flex-grow border border-gray-300 rounded-md px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        >
          <i className="fas fa-filter text-xs"></i>
          Mostrar Filtros
        </button>
      </form>

      <table className="w-full text-xs border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Proyecto
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Apellidos y Nombres
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              DNI
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Especialidad
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Rol
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Tipo de Acceso
            </th>
            <th className="border border-gray-200 text-left px-3 py-2 font-semibold">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} className="border-b border-gray-200">
              <td className="border border-gray-200 px-3 py-2">Proyecto Vial Norte</td>
              <td className="border border-gray-200 px-3 py-2 font-semibold">
                {user.ap_paterno} {user.ap_materno} {user.nombre}
              </td>
              <td className="border border-gray-200 px-3 py-2">{user.dni}</td>
              <td className="border border-gray-200 px-3 py-2">
                <span
                  className="inline-block border border-gray-300 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                >
                  {user.especialidad_nombre}
                </span>
              </td>
              <td className="border border-gray-200 px-3 py-2">
                <span
                  className="inline-block border border-gray-300 rounded-full px-2 py-0.5 text-[9px] font-semibold"
                >
                  {user.rol_nombre}
                </span>
              </td>
              <td className="border border-gray-200 px-3 py-2">Lectura y Edición</td>
              <td className="border border-gray-200 px-3 py-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  onClick={() => handleEditClick(user.id)}
                >
                  <i className="fas fa-edit text-xs"></i>Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <EditPermissionsModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        userId={editingUserId}
        onPermissionsUpdated={handleCloseEditModal}
      />
    </section>
  );
}

export default GestionPermisos;
