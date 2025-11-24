import React, { useState, useEffect, useCallback } from 'react';
import './frmusuarios.css';
import alertify from 'alertifyjs';
import axios from 'axios';
import { useAuth } from '../../../data/contexts/AuthContext'; // Importar useAuth

export default function FrmUsuarios() {
  const { user } = useAuth(); // Obtener el usuario del contexto
  const API_URL = process.env.REACT_APP_API_BASE || '';

  const [usuario, setUsuario] = useState({
    tramo: '', dni: '', usuario: '', password: '', nombre: '',
    ap_paterno: '', ap_materno: '', correo: '', mail_cu_104: '',
    fecha_ingreso: '', codigo_esp: '', nivel: '', subnivel: '',
    tipo_user: '', rol_id: ''
  });

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const fetchRoles = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const res = await axios.get(`${API_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setRoles(res.data);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      alertify.error('Error al cargar roles.');
    }
  }, [API_URL, user]);

  const fetchEspecialidades = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const res = await axios.get(`${API_URL}/especialidades`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      setEspecialidades(res.data);
    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      alertify.error('Error al cargar especialidades.');
    }
  }, [API_URL, user]);

  const fetchUsuarios = useCallback(async () => {
    if (!user || !user.token) return;
    try {
      const res = await axios.get(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      alertify.error(error.response?.data?.error || 'Error al obtener usuarios');
    }
  }, [API_URL, user]);

  useEffect(() => {
    if (user && user.token) {
      fetchRoles();
      fetchEspecialidades();
      fetchUsuarios();
    }
    // Limpiar el formulario cada vez que el componente se renderice
    setUsuario({
      tramo: '', dni: '', usuario: '', password: '', nombre: '',
      ap_paterno: '', ap_materno: '', correo: '', mail_cu_104: '',
      fecha_ingreso: '', codigo_esp: '', nivel: '', subnivel: '',
      tipo_user: '', rol_id: ''
    });
  }, [user, fetchRoles, fetchEspecialidades, fetchUsuarios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...usuario, [name]: value };

    if (name === 'rol_id') {
      const rol = roles.find(r => r.id.toString() === value);
      if (rol) updated.tipo_user = rol.nombre;
    }

    setUsuario(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usuario.dni.length !== 8) {
      alertify.error('El DNI debe tener exactamente 8 dígitos');
      return;
    }

    const url = `${API_URL}/usuarios${editando ? `/${usuario.dni}` : ''}`;
    const method = editando ? 'PUT' : 'POST';

    setEnviando(true);

    if (!user || !user.token) {
      alertify.error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión.');
      setEnviando(false);
      return;
    }

    try {
      const res = await axios({
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        data: usuario
      });

      alertify.success(res.data.mensaje);

      setUsuario({
        tramo: '', dni: '', usuario: '', password: '', nombre: '',
        ap_paterno: '', ap_materno: '', correo: '', mail_cu_104: '',
        fecha_ingreso: '', codigo_esp: '', nivel: '', subnivel: '',
        tipo_user: '', rol_id: ''
      });

      setEditando(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      if (error.response && error.response.data && error.response.data.code === '23505') {
        alertify.error('Error: El DNI ingresado ya existe. Por favor, use un DNI diferente.');
      } else {
        alertify.error(error.response?.data?.mensaje || 'Error de red o del servidor al guardar usuario');
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleEdit = (selectedUser) => {
    setUsuario({
      ...selectedUser,
      fecha_ingreso: selectedUser.fecha_ingreso ? selectedUser.fecha_ingreso.slice(0, 10) : '',
    });
    setEditando(true);
  };

  const handleDelete = async (dni) => {
    alertify.confirm(
      'Confirmar Eliminación',
      '¿Estás seguro de eliminar este usuario?',
      async function () {
        if (!user || !user.token) {
          alertify.error('No has iniciado sesión o tu sesión ha expirado. Por favor, inicia sesión.');
          return;
        }
        try {
          const res = await axios.delete(`${API_URL}/usuarios/${dni}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          alertify.success(res.data.mensaje);
          fetchUsuarios();
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          alertify.error(error.response?.data?.mensaje || 'Error al eliminar usuario');
        }
      },
      function () {
        alertify.message('Eliminación cancelada');
      }
    );
  };

  return (
    <div className="content-wrapper">
      <form onSubmit={handleSubmit} className="formulario">
        <h2>{editando ? 'Editar Usuario' : 'Registro de Usuario'}</h2>

        <div className="form-group">
          <label>Tramo:</label>
          <input type="text" name="tramo" value={usuario.tramo} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>DNI:</label>
          <input
            type="text"
            name="dni"
            value={usuario.dni}
            onChange={e => setUsuario({ ...usuario, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
            required
          />
        </div>

        <div className="form-group">
          <label>Usuario:</label>
          <input type="text" name="usuario" value={usuario.usuario} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Contraseña:</label>
          <input type="password" name="password" value={usuario.password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Nombres:</label>
          <input type="text" name="nombre" value={usuario.nombre} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Apellido Paterno:</label>
          <input type="text" name="ap_paterno" value={usuario.ap_paterno} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Apellido Materno:</label>
          <input type="text" name="ap_materno" value={usuario.ap_materno} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Correo:</label>
          <input type="email" name="correo" value={usuario.correo} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Correo CU-104:</label>
          <input type="email" name="mail_cu_104" value={usuario.mail_cu_104} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Fecha de Ingreso:</label>
          <input type="date" name="fecha_ingreso" value={usuario.fecha_ingreso} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Especialidad:</label>
          <select name="codigo_esp" value={usuario.codigo_esp} onChange={handleChange} required>
            <option value="">Seleccione Especialidad</option>
            {especialidades.map((esp) => (
              <option key={esp.codigo_esp} value={esp.codigo_esp}>{esp.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Nivel:</label>
          <select name="nivel" value={usuario.nivel} onChange={handleChange} required>
            <option value="">Seleccione Nivel</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div className="form-group">
          <label>Subnivel:</label>
          <select name="subnivel" value={usuario.subnivel} onChange={handleChange} required>
            <option value="">Seleccione Subnivel</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div className="form-group">
          <label>Rol:</label>
          <select name="rol_id" value={usuario.rol_id} onChange={handleChange} required>
            <option value="">Seleccione Rol</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : editando ? 'Actualizar Usuario' : 'Guardar Usuario'}
          </button>
          <button
            type="button"
            onClick={() => {
              setUsuario({
                tramo: '', dni: '', usuario: '', password: '', nombre: '',
                ap_paterno: '', ap_materno: '', correo: '', mail_cu_104: '',
                fecha_ingreso: '', codigo_esp: '', nivel: '', subnivel: '',
                tipo_user: '', rol_id: ''
              });
              setEditando(false);
            }}
          >
            Limpiar Formulario
          </button>
        </div>
      </form>

      <h2 style={{ marginTop: '2rem' }}>Lista de Usuarios</h2>
      <table className="tabla-usuarios">
        <thead>
          <tr>
            <th>Tramo</th>
            <th>DNI</th>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios
             .filter(u => !['admin', 'sadmin', 'invitado', 'prueba'].includes(u.usuario))
             .map(u => (
              <tr key={u.dni}>
                <td>{u.tramo}</td>
                <td>{u.dni}</td>
                <td>{u.usuario}</td>
                <td>{u.nombre} {u.ap_paterno}</td>
                <td>{u.correo}</td>
                <td>{u.rol_nombre}</td>
                <td>
                  <button onClick={() => handleEdit(u)}>✏️</button>
                  <button onClick={() => handleDelete(u.dni)}>🗑️</button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
