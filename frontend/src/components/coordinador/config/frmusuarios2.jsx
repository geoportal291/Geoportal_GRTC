import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../api/axios';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import NuevoUsuarioModal from './NuevoUsuarioModal';
import VerUsuarioModal from './VerUsuarioModal';
import GestionPermisos from './GestionPermisos';
import './loading.css';

function GestionUsuarios() {
  const [activeTab, setActiveTab] = useState('gestion');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

const fetchUsers = useCallback(async () => {
        setLoading(true);
       try {
       const response = await axiosInstance.get('/usuarios', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      });
      const filteredUsers = response.data.filter(user => {
        const role = user.rol_nombre ? user.rol_nombre.toUpperCase() : '';
        const name = user.nombre ? user.nombre.toUpperCase() : '';
        return role !== 'ADMIN' && 
               role !== 'INVITADO' && 
               name !== 'PRUEBA' &&
               role !== 'PRUEBA PRUEBA PRUEBA' &&
               name !== 'invitado' &&
               name !== 'CHESCOP';
      });
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openModal = (user = null) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setModalOpen(false);
  };

  const openViewModal = (userId) => {
    setViewingUserId(userId);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewingUserId(null);
    setViewModalOpen(false);
  };

  const handleUserCreated = () => {
    fetchUsers();
    closeModal();
  };

  const handleUserUpdated = () => {
    fetchUsers();
    closeModal();
  };

  const handleDelete = async (dni) => {
    alertify.confirm('Eliminar Usuario', '¿Estás seguro de que quieres eliminar este usuario?', 
      async function(){
        try {
          await axiosInstance.delete(`/usuarios/${dni}`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          alertify.success('Usuario eliminado exitosamente!');
          fetchUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          alertify.error('Error al eliminar usuario.');
        }
      },
      function(){
        alertify.error('Eliminación cancelada');
      }
    );
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.nombre || ''} ${user.ap_paterno || ''} ${user.ap_materno || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const renderContent = () => {
    if (loading) {
      return <div className="loader-container"><div className="loader"></div></div>;
    }

    switch (activeTab) {
      case 'gestion':
        return (
          <section
            aria-label="Lista de Usuarios"
            className="rounded-lg border border-gray-200 p-4 text-center"
          >
            <h3 className="font-semibold text-base mb-0.5">Lista de Usuarios</h3>
            <p className="text-xs text-gray-500 mb-4">{filteredUsers.length} de {users.length} usuarios encontrados</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse border border-gray-200">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">
                      Tramo
                    </th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">
                      Usuario
                    </th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">DNI</th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">Rol</th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">
                      Especialidad
                    </th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">Contacto</th>
                    <th className="border border-gray-200 px-3 py-2 font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200">
                      <td className="border border-gray-200 px-3 py-2 align-top">{user.tramo}</td>
                      <td className="border border-gray-200 px-3 py-2 align-top">
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700"
                            aria-hidden="true"
                          >
                            {user.nombre ? user.nombre.charAt(0) : ''}{user.ap_paterno ? user.ap_paterno.charAt(0) : ''}
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-gray-900">{user.nombre} {user.ap_paterno} {user.ap_materno}</p>
                            <p className="text-xs text-gray-500">{user.profesion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 align-top">{user.dni}</td>
                      <td className="border border-gray-200 px-3 py-2 align-top">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase bg-blue-100 text-blue-700`}
                        >
                          {user.rol_nombre}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 align-top">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold uppercase bg-gray-200 text-gray-700`}
                        >
                          {user.especialidad_nombre}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 align-top">
                        <div className="text-xs text-gray-700 leading-tight">
                          <p className="flex items-center space-x-1">
                            <i className="far fa-envelope"></i>
                            <span>{user.correo}</span>
                          </p>
                          <p className="flex items-center space-x-1">
                            <i className="fas fa-phone-alt"></i>
                            <span>{user.telefono}</span>
                          </p>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 align-top">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            aria-label={`Ver usuario ${user.nombre}`}
                            className="rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => openViewModal(user.id)}
                          >
                            <i className="far fa-eye"></i>
                          </button>
                          <button
                            type="button"
                            aria-label={`Editar usuario ${user.nombre}`}
                            className="rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => openModal(user)}
                          >
                            <i className="far fa-edit"></i>
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar usuario ${user.nombre}`}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-700"
                            onClick={() => handleDelete(user.dni)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      case 'informacion':
        return <InformacionUsuarios />;
      case 'permisos':
        return <GestionPermisos />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-gray-900 font-sans p-4 sm:p-6 md:p-8">
      <h1 className="font-bold text-lg mb-3">Gestión de Usuarios</h1>

      <nav
        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold mb-6"
        role="tablist"
        aria-label="Gestión de Usuarios Tabs"
      >
        <button
          type="button"
          aria-selected={activeTab === 'gestion'}
          className={activeTab === 'gestion' ? 'rounded-l-lg bg-white px-4 py-1.5 text-gray-900 shadow-inner' : 'px-4 py-1.5 text-gray-700 hover:text-gray-900'}
          role="tab"
          tabIndex="0"
          onClick={() => setActiveTab('gestion')}
        >
          Gestión de Usuarios
        </button>
        <button
          type="button"
          aria-selected={activeTab === 'informacion'}
          className={activeTab === 'informacion' ? 'bg-white px-4 py-1.5 text-gray-900 shadow-inner' : 'px-4 py-1.5 text-gray-700 hover:text-gray-900'}
          role="tab"
          tabIndex="-1"
          onClick={() => setActiveTab('informacion')}
        >
          Información de Usuarios
        </button>
        <button
          type="button"
          aria-selected={activeTab === 'permisos'}
          className={activeTab === 'permisos' ? 'rounded-r-lg bg-white px-4 py-1.5 text-gray-900 shadow-inner' : 'rounded-r-lg px-4 py-1.5 text-gray-700 hover:text-gray-900'}
          role="tab"
          tabIndex="-1"
          onClick={() => setActiveTab('permisos')}
        >
          Gestión de Permisos
        </button>
      </nav>

      {activeTab === 'gestion' && (
        <section aria-labelledby="usuarios-title" className="mb-4 relative">
          <h2 id="usuarios-title" className="font-bold text-lg mb-3">
            Usuarios
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0 mb-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                 &nbsp;Buscar por nombre o apellido
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="search"
                  placeholder="Buscar por nombre o apellido..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <i className="fas fa-search"></i>
                </span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <i className="fas fa-filter"></i>
              <span>Mostrar Filtros</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="absolute top-0 right-0 -translate-y-1/2 rounded-md bg-black px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700"
          >
            Nuevo Usuario
          </button>
        </section>
      )}

      {renderContent()}
      <NuevoUsuarioModal isOpen={isModalOpen} onClose={closeModal} onUserCreated={handleUserCreated} onUserUpdated={handleUserUpdated} editingUser={editingUser} />
      <VerUsuarioModal isOpen={isViewModalOpen} onClose={closeViewModal} userId={viewingUserId} />
    </div>
  );
}

function InformacionUsuarios() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showPasswordId, setShowPasswordId] = useState(null);
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

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswordId(showPasswordId === userId ? null : userId);
  };

  const filteredUsers = users.filter(user => {
    const searchTerm = search.toLowerCase();
    return (
      user.dni?.toLowerCase().includes(searchTerm) ||
      user.correo?.toLowerCase().includes(searchTerm) ||
      user.nombre?.toLowerCase().includes(searchTerm) ||
      user.ap_paterno?.toLowerCase().includes(searchTerm) ||
      user.ap_materno?.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return <div className="loader-container"><div className="loader"></div></div>;
  }

  return (
    <section
      aria-labelledby="info-usuarios-title"
      className="border border-gray-200 rounded-lg p-5 overflow-x-auto"
    >
      <h2
        id="info-usuarios-title"
        className="font-semibold text-center text-[13px] mb-1"
      >
        Información de Usuarios
      </h2>
      <p className="text-center text-gray-500 text-[11px] mb-4">
        Listado completo de todos los usuarios registrados en el sistema
      </p>

      <form className="flex items-center gap-2 mb-4" role="search" aria-label="Buscar usuarios">
        <label htmlFor="search" className="sr-only">Buscar por DNI, correo o nombre</label>
        <input
          id="search"
          type="search"
          placeholder="Buscar por DNI, correo o nombre..."
          className="flex-grow border border-gray-300 rounded-md py-2 px-3 text-[11px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="flex items-center gap-1 border border-gray-300 rounded-md py-2 px-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          aria-label="Mostrar Filtros"
        >
          <i className="fas fa-filter"></i>
          Mostrar Filtros
        </button>
      </form>

      <table className="w-full min-w-[720px] text-[11px] text-left border border-gray-200 rounded-md table-fixed">
        <thead className="bg-white border-b border-gray-200">
          <tr>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[7.5rem]">DNI</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[7rem]">Contraseña</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[14rem]">Correo</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[9rem]">Fecha Nacimiento</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[5rem]">Edad</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[11rem]">Nro. Contacto</th>
            <th className="py-2 px-3 font-semibold border-r border-gray-200 w-[11rem]">Profesión</th>
            <th className="py-2 px-3 font-semibold w-[9rem]">Rol</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} className="border-t border-gray-200">
              <td className="py-2 px-3 border-r border-gray-200 font-semibold">{user.dni}</td>
              <td className="py-2 px-3 border-r border-gray-200 flex items-center gap-2">
                <span>{showPasswordId === user.id ? user.password : '••••••••'}</span>
                <button type="button" onClick={() => togglePasswordVisibility(user.id)}>
                  <i className="fas fa-eye text-gray-600"></i>
                </button>
              </td>
              <td className="py-2 px-3 border-r border-gray-200">{user.correo}</td>
              <td className="py-2 px-3 border-r border-gray-200">{new Date(user.fecha_nacimiento).toLocaleDateString()}</td>
              <td className="py-2 px-3 border-r border-gray-200">{calculateAge(user.fecha_nacimiento)}</td>
              <td className="py-2 px-3 border-r border-gray-200">{user.telefono}</td>
              <td className="py-2 px-3 border-r border-gray-200">{user.profesion}</td>
              <td className="py-2 px-3">
                <span
                  className="inline-block border border-gray-300 rounded-full px-3 py-0.5 text-[9px] font-semibold"
                >
                  {user.rol_nombre}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default GestionUsuarios;
