import React, { useState, useEffect } from 'react';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import 'alertifyjs/build/css/themes/default.min.css';
import axiosInstance from '../../../api/axios';

const NuevoUsuarioModal = ({ isOpen, onClose, onUserCreated, onUserUpdated, editingUser }) => {
  const [activeTab, setActiveTab] = useState('general');
  const initialFormData = {
    dni: '',
    password: '',
    apPaterno: '',
    apMaterno: '',
    nombres: '',
    tramo: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    contactoPersonal: '',
    mailPersonal: '',
    mailProyecto: '',
    profesion: '',
    rol: '',
    especialidad: '',
    otrosDetalles: '',
    archivo: null,
    // Campos de Información Académica
    centroEstudios: '',
    profesionAcademica: '',
    especialidadAcademica: '',
    fechaIngresoAcademica: '',
    fechaEgresoAcademica: '',
    informacionAdicionalAcademica: '',
    // Campos de Información Laboral
    institucionLaboral: '',
    cargoLaboral: '',
    fechaIngresoLaboral: '',
    fechaEgresoLaboral: '',
    informacionAdicionalLaboral: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  useEffect(() => {
    const fetchRolesAndEspecialidades = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const [rolesRes, especialidadesRes] = await Promise.all([
          axiosInstance.get('/roles', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axiosInstance.get('/especialidades', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setRoles(rolesRes.data);
        setEspecialidades(especialidadesRes.data);
      } catch (error) {
        console.error('Error fetching roles or especialidades:', error);
      }
    };

    if (isOpen) {
      fetchRolesAndEspecialidades();
      if (editingUser) {
        setFormData({
          ...initialFormData,
          dni: editingUser.dni || '',
          password: editingUser.password || '',
          apPaterno: editingUser.ap_paterno || '',
          apMaterno: editingUser.ap_materno || '',
          nombres: editingUser.nombre || '',
          tramo: editingUser.tramo || '',
          fechaNacimiento: editingUser.fecha_nacimiento ? new Date(editingUser.fecha_nacimiento).toISOString().split('T')[0] : '',
          fechaIngreso: editingUser.fecha_ingreso ? new Date(editingUser.fecha_ingreso).toISOString().split('T')[0] : '',
          contactoPersonal: editingUser.telefono || '',
          mailPersonal: editingUser.correo || '',
          mailProyecto: editingUser.mail_cu_104 || '',
          profesion: editingUser.profesion || '',
          rol: editingUser.rol_id || '',
          especialidad: editingUser.codigo_esp || '',
          otrosDetalles: editingUser.otros_detalles || '',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [editingUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'dni' || name === 'contactoPersonal') {
      processedValue = value.replace(/[^\d]/g, '');
      if (name === 'dni' && processedValue.length > 8) {
        return;
      }
    } 

    setFormData({ ...formData, [name]: processedValue });

    if (name === 'dni' && processedValue.length === 8) {
      handleDniBlur(processedValue);
    }
  };

  const handleDniBlur = async (dni) => {
    if (dni.length === 8) {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const response = await axiosInstance.get(`/usuarios/dni/${dni}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          const userData = response.data;
          setFormData({
            ...initialFormData,
            dni: userData.dni || '',
            password: userData.password || '',
            apPaterno: userData.ap_paterno || '',
            apMaterno: userData.ap_materno || '',
            nombres: userData.nombre || '',
            tramo: userData.tramo || '',
            fechaNacimiento: userData.fecha_nacimiento ? new Date(userData.fecha_nacimiento).toISOString().split('T')[0] : '',
            fechaIngreso: userData.fecha_ingreso ? new Date(userData.fecha_ingreso).toISOString().split('T')[0] : '',
            contactoPersonal: userData.telefono || '',
            mailPersonal: userData.correo || '',
            mailProyecto: userData.mail_cu_104 || '',
            profesion: userData.profesion || '',
            rol: userData.rol_id || '',
            especialidad: userData.codigo_esp || '',
            otrosDetalles: userData.otros_detalles || '',
          });
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // User not found, do nothing
        } else {
          console.error('Error fetching user by dni:', error);
        }
      }
    }
  };

  const validate = () => {
    let tempErrors = {};
    // DNI
    if (formData.dni.length !== 8) tempErrors.dni = 'El DNI debe tener 8 dígitos.';
    // Password
    if (!formData.password) tempErrors.password = 'La contraseña es obligatoria.';
    // Apellidos
    if (!formData.apPaterno) tempErrors.apPaterno = 'El apellido paterno es obligatorio.';
    if (!formData.apMaterno) tempErrors.apMaterno = 'El apellido materno es obligatorio.';
    // Nombres
    if (!formData.nombres) tempErrors.nombres = 'Los nombres son obligatorios.';
    // Tramo
    if (!formData.tramo) tempErrors.tramo = 'El tramo es obligatorio.';
    // Fecha de Nacimiento
    if (!formData.fechaNacimiento) tempErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
    // Fecha de Ingreso
    if (!formData.fechaIngreso) tempErrors.fechaIngreso = 'La fecha de ingreso es obligatoria.';
    // Contacto Personal
    if (!formData.contactoPersonal) tempErrors.contactoPersonal = 'El número de contacto es obligatorio.';
    // Mail Personal
    if (!formData.mailPersonal) {
      tempErrors.mailPersonal = 'El mail personal es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.mailPersonal)) {
      tempErrors.mailPersonal = 'El formato del correo no es válido.';
    }
    // Mail de Proyecto
    if (!formData.mailProyecto) {
      tempErrors.mailProyecto = 'El mail de proyecto es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(formData.mailProyecto)) {
      tempErrors.mailProyecto = 'El formato del correo no es válido.';
    }
    // Profesión
    if (!formData.profesion) tempErrors.profesion = 'La profesión es obligatoria.';
    // Rol
    if (!formData.rol) tempErrors.rol = 'Debe seleccionar un rol.';
    // Especialidad
    if (!formData.especialidad) tempErrors.especialidad = 'Debe seleccionar una especialidad.';
    // Otros Detalles
    if (!formData.otrosDetalles) tempErrors.otrosDetalles = 'Otros detalles son obligatorios.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        if (editingUser) {
          const dataToSend = {
            dni: formData.dni,
            password: formData.password,
            nombre: formData.nombres,
            ap_paterno: formData.apPaterno,
            ap_materno: formData.apMaterno,
            fecha_nacimiento: formData.fechaNacimiento,
            fecha_ingreso: formData.fechaIngreso,
            telefono: formData.contactoPersonal,
            correo: formData.mailPersonal,
            mail_cu_104: formData.mailProyecto,
            profesion: formData.profesion,
            rol_id: formData.rol,
            codigo_esp: formData.especialidad,
            otros_detalles: formData.otrosDetalles,
            tramo: formData.tramo,
            usuario: formData.dni,
          };
          const response = await axiosInstance.put(`/usuarios/${editingUser.dni}`, dataToSend, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          if (response.data.status === 'ok') {
            alertify.success('Usuario actualizado exitosamente!');
            onUserUpdated();
          } else {
            alertify.error('Error al actualizar usuario: ' + (response.data.mensaje || 'Error desconocido'));
          }
        } else {
          const response = await axiosInstance.post('/usuarios', formData, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
            }
          });
          if (response.data.status === 'ok') {
            alertify.success('Usuario creado exitosamente!');
            onUserCreated();
          } else {
            alertify.error('Error al crear usuario: ' + (response.data.mensaje || 'Error desconocido'));
          }
        }
      } catch (error) {
        console.error('Error al enviar datos del usuario:', error);
        alertify.error('Hubo un problema al conectar con el servidor o al crear el usuario.');
        console.error('Detalles del error de la API:', error.response?.data);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <form className="space-y-4 text-xs font-normal leading-5 text-black/90">
            {/* Usuario / Contraseña */}
            <fieldset className="space-y-2">
              <legend className="font-semibold text-black/90">Usuario / Contraseña</legend>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="dni"
                  placeholder="DNI"
                  value={formData.dni}
                  onChange={handleChange}
                  className={`flex-1 rounded border ${errors.dni ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña (por defecto)"
                  value={formData.password}
                  onChange={handleChange}
                  className={`flex-1 rounded border ${errors.password ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
                />
                <button
                  type="button"
                  className="flex items-center justify-center rounded border border-gray-300 px-3 py-2 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-black"
                  aria-label="Mostrar contraseña"
                >
                  <i className="fas fa-eye"></i>
                </button>
              </div>
              {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </fieldset>

            {/* Información de Usuario */}
            <fieldset className="space-y-2">
              <legend className="font-semibold text-black/90">Información de Usuario</legend>
              <input
                type="text"
                name="apPaterno"
                placeholder="Apellido Paterno"
                value={formData.apPaterno}
                onChange={handleChange}
                className={`w-full rounded border ${errors.apPaterno ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.apPaterno && <p className="text-red-500 text-xs mt-1">{errors.apPaterno}</p>}
              <input
                type="text"
                name="apMaterno"
                placeholder="Apellido Materno"
                value={formData.apMaterno}
                onChange={handleChange}
                className={`w-full rounded border ${errors.apMaterno ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.apMaterno && <p className="text-red-500 text-xs mt-1">{errors.apMaterno}</p>}
              <input
                type="text"
                name="nombres"
                placeholder="Nombres"
                value={formData.nombres}
                onChange={handleChange}
                className={`w-full rounded border ${errors.nombres ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.nombres && <p className="text-red-500 text-xs mt-1">{errors.nombres}</p>}
              <input
                type="text"
                name="tramo"
                placeholder="Tramo"
                value={formData.tramo}
                onChange={handleChange}
                className={`w-full rounded border ${errors.tramo ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.tramo && <p className="text-red-500 text-xs mt-1">{errors.tramo}</p>}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-normal mb-1" htmlFor="fecha-nacimiento">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="fecha-nacimiento"
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-normal mb-1" htmlFor="fecha-ingreso">
                    Fecha de ingreso
                  </label>
                  <input
                    id="fecha-ingreso"
                    type="date"
                    name="fechaIngreso"
                    value={formData.fechaIngreso}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </fieldset>

            {/* Información de Contacto */}
            <fieldset className="space-y-2">
              <legend className="font-semibold text-black/90">Información de Contacto</legend>
              <input
                type="text"
                name="contactoPersonal"
                placeholder="Numero de Contacto Personal"
                value={formData.contactoPersonal}
                onChange={handleChange}
                className={`w-full rounded border ${errors.contactoPersonal ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.contactoPersonal && <p className="text-red-500 text-xs mt-1">{errors.contactoPersonal}</p>}
              <input
                type="email"
                name="mailPersonal"
                placeholder="Mail Personal"
                value={formData.mailPersonal}
                onChange={handleChange}
                className={`w-full rounded border ${errors.mailPersonal ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.mailPersonal && <p className="text-red-500 text-xs mt-1">{errors.mailPersonal}</p>}
              <input
                type="email"
                name="mailProyecto"
                placeholder="Mail de Proyecto"
                value={formData.mailProyecto}
                onChange={handleChange}
                className={`w-full rounded border ${errors.mailProyecto ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.mailProyecto && <p className="text-red-500 text-xs mt-1">{errors.mailProyecto}</p>}
            </fieldset>

            {/* Información de Especialidad */}
            <fieldset className="space-y-2">
              <legend className="font-semibold text-black/90">Información de Especialidad</legend>
              <input
                type="text"
                name="profesion"
                placeholder="Profesión"
                value={formData.profesion}
                onChange={handleChange}
                className={`w-full rounded border ${errors.profesion ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
              />
              {errors.profesion && <p className="text-red-500 text-xs mt-1">{errors.profesion}</p>}
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className={`w-full rounded border ${errors.rol ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
                aria-label="Seleccionar Rol"
              >
                <option value="" disabled>Seleccionar Rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                ))}
              </select>
              {errors.rol && <p className="text-red-500 text-xs mt-1">{errors.rol}</p>}
              <select
                name="especialidad"
                value={formData.especialidad}
                onChange={handleChange}
                className={`w-full rounded border ${errors.especialidad ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-black`}
                aria-label="Seleccionar Especialidad"
              >
                <option value="" disabled>Seleccionar Especialidad</option>
                {especialidades.map(especialidad => (
                  <option key={especialidad.codigo_esp} value={especialidad.codigo_esp}>{especialidad.nombre}</option>
                ))}
              </select>
              {errors.especialidad && <p className="text-red-500 text-xs mt-1">{errors.especialidad}</p>}
            </fieldset>

            <textarea
              rows="3"
              name="otrosDetalles"
              placeholder="Otros detalles"
              value={formData.otrosDetalles}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 px-3 py-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black resize-none"
            ></textarea>

            <label
              className="block w-full rounded border border-gray-300 px-3 py-2 text-xs text-black/90"
              htmlFor="archivo"
            >
              <span className="font-semibold">Seleccionar archivo</span> Ningún archivo seleccionado
              <input id="archivo" type="file" className="hidden" />
            </label>
          </form>
        );
      case 'academica':
        return (
          <form className="space-y-6" noValidate>
            {/* Información de Centro Estudios */}
            <fieldset
              className="border border-gray-200 rounded-md p-4 space-y-3"
              aria-labelledby="info-centro-estudios-label"
            >
              <legend
                id="info-centro-estudios-label"
                className="text-sm font-semibold text-gray-900"
              >
                Información de Centro Estudios
              </legend>

              <input
                type="text"
                name="centroEstudios"
                id="centro-estudios"
                placeholder="Centro de estudios"
                value={formData.centroEstudios}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                autoComplete="off"
              />
              <input
                type="text"
                name="profesionAcademica"
                id="profesion"
                placeholder="Profesión"
                value={formData.profesionAcademica}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                autoComplete="off"
              />
              <input
                type="text"
                name="especialidadAcademica"
                id="especialidad"
                placeholder="Especialidad"
                value={formData.especialidadAcademica}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                autoComplete="off"
              />
            </fieldset>

            {/* Fecha de Ingreso y Fecha de Egreso */}
            <div className="flex space-x-4 border border-gray-200 rounded-md p-4">
              <div className="flex-1">
                <label
                  htmlFor="fecha-ingreso"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >Fecha de Ingreso</label>
                <div className="relative">
                  <input
                    type="date"
                    id="fecha-ingreso"
                    name="fechaIngresoAcademica"
                    placeholder="dd/mm/aaaa"
                    value={formData.fechaIngresoAcademica}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                  <i
                    className="fas fa-calendar-alt absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="fecha-egreso"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >Fecha de Egreso</label>
                <div className="relative">
                  <input
                    type="date"
                    id="fecha-egreso"
                    name="fechaEgresoAcademica"
                    placeholder="dd/mm/aaaa"
                    value={formData.fechaEgresoAcademica}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                  <i
                    className="fas fa-calendar-alt absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
            </div>

            {/* Información textarea */}
            <div>
              <label
                htmlFor="informacion-adicional"
                className="block text-xs font-semibold text-gray-900 mb-1"
              >Información</label>
              <textarea
                id="informacion-adicional"
                name="informacionAdicionalAcademica"
                rows="3"
                placeholder="Información adicional académica"
                value={formData.informacionAdicionalAcademica}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 resize-y focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              ></textarea>
            </div>
          </form>
        );
      case 'laboral':
        return (
          <form className="space-y-4 text-xs text-gray-700">
            <fieldset className="border border-gray-300 rounded-md p-3 space-y-2">
              <legend className="font-semibold text-gray-900 text-[11px] px-1">
                Información de Centro de Trabajo
              </legend>
              <input
                type="text"
                name="institucionLaboral"
                placeholder="Institución"
                value={formData.institucionLaboral}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <input
                type="text"
                name="cargoLaboral"
                placeholder="Cargo"
                value={formData.cargoLaboral}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </fieldset>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="ingreso" className="block font-semibold text-[11px] mb-1">
                  Ingreso
                </label>
                <input
                  type="date"
                  id="ingreso"
                  name="ingreso"
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="egreso" className="block font-semibold text-[11px] mb-1">
                  Egreso
                </label>
                <input
                  type="date"
                  id="egreso"
                  name="egreso"
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="info" className="block font-semibold text-[11px] mb-1">
                Información
              </label>
              <textarea
                id="info"
                name="info"
                rows="3"
                placeholder="Información adicional laboral"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
              ></textarea>
            </div>

          
          </form>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg pt-2 px-6 pb-6 max-w-lg w-full max-h-[80vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold leading-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-black text-lg font-bold leading-none">×</button>
        </div>

        <nav className="mb-4 bg-gray-100 rounded-full flex text-xs font-normal leading-5 text-black/90">
          <button
            onClick={() => setActiveTab('general')}
            className={`rounded-full px-3 py-1.5 border ${activeTab === 'general' ? 'bg-white font-semibold border-gray-200' : 'border-transparent hover:border-gray-300'}`}
            type="button"
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('academica')}
            className={`rounded-full px-3 py-1.5 border ${activeTab === 'academica' ? 'bg-white font-semibold border-gray-200' : 'border-transparent hover:border-gray-300'}`}
            type="button"
          >
            Información Académica
          </button>
          <button
            onClick={() => setActiveTab('laboral')}
            className={`rounded-full px-3 py-1.5 border ${activeTab === 'laboral' ? 'bg-white font-semibold border-gray-200' : 'border-transparent hover:border-gray-300'}`}
            type="button"
          >
            Información Laboral
          </button>
        </nav>

        {renderContent()}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            type="button"
            className="rounded px-4 py-2 text-xs font-semibold leading-5 text-black hover:underline focus:outline-none focus:ring-1 focus:ring-black"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="rounded bg-black px-4 py-2 text-xs font-semibold leading-5 text-white hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
          >
            {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoUsuarioModal;