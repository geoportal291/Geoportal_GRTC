import React, { useState, useEffect, useCallback, useRef } from 'react';
import alertify from 'alertifyjs';
import axios from 'axios';
import './tareas.css';
import { useAuth } from '../../../data/contexts/AuthContext';

// --- Componente Auxiliar para Renderizar Archivos Adjuntos ---
const ArchivoAdjunto = ({ url }) => {
  if (!url || url === '') {
    return null; // No renderizar nada si no hay URL o si la URL es una cadena vacía
  }

  const extension = url.split('.').pop().toLowerCase();

  

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension);
  const isPdf = extension === 'pdf';
  const isExcel = ['xls', 'xlsx'].includes(extension);

  // Función para obtener una URL para el visor de documentos
  const getViewerUrl = (fileUrl, fileExtension) => {
    if (!fileUrl) return ''; // Retorna cadena vacía si no hay URL
    
    if (['xls', 'xlsx'].includes(fileExtension)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    } else {
      return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
  };

  const handleDownload = (e) => {
    e.preventDefault();
    window.open(url, '_blank'); // Abrir la URL original para descarga
  };

  if (isImage) {
    return (
      <div className="archivo-adjunto">
        <img src={url} alt="Adjunto" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '1rem' }} />
      </div>
    );
  } else if (isPdf) {
    return (
      <>
        <div className="archivo-adjunto pdf-viewer-container" style={{ marginTop: '1rem', width: '100%', height: '800px' }}>
          <iframe
            src={getViewerUrl(url, extension)}
            title="Visor de PDF"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            webkitallowfullscreen="true"
          ></iframe>
        </div>
        <div className="download-button-container">
          <button onClick={handleDownload} className="pdf-button">
            Descargar PDF
          </button>
        </div>
      </>
    );
  } else if (isExcel) {
    
    return (
      <>
        <div className="archivo-adjunto excel-viewer-container" style={{ marginTop: '1rem', width: '100%', height: '800px' }}>
          <iframe
            src={getViewerUrl(url, extension)}
            title="Visor de Excel"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            webkitallowfullscreen="true"
          ></iframe>
        </div>
        <div className="download-button-container">
          <button onClick={handleDownload} className="excel-button">
            Descargar Excel
          </button>
        </div>
      </>
    );
  }

  // Para cualquier otro tipo de archivo, mostrar un enlace de descarga
  return (
    <div className="archivo-adjunto" style={{ marginTop: '1rem' }}>
      <a href="#" onClick={handleDownload} className="enlace-descarga">
        📄 Descargar Archivo Adjunto ({extension.toUpperCase()})
      </a>
    </div>
  );
};


export default function Tareas() {
  const { user } = useAuth();
  const [anuncio, setAnuncio] = useState({
    titulo: '',
    contenido: '',
    fecha_inicio: '',
    fecha_fin: '',
    usuario_id: '',
    archivo: null,
  });

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const [anuncios, setAnuncios] = useState([]);
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [usuarios, setUsuarios] = useState([]);

  const API_BASE = process.env.REACT_APP_API_BASE;

  const fetchAnuncios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/anuncios/activos`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      setAnuncios(res.data);
    } catch (error) {
      console.error(error);
      alertify.error('Error al cargar anuncios');
    }
  }, [API_BASE, user]);

  const fetchUsuarios = useCallback(async () => {
    if (!user || !user.token) {
      setUsuarios([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (Array.isArray(res.data)) {
        const usuariosFiltrados = res.data.filter(u => !['admin', 'invitado', 'prueba', 'teresita'].includes(u.nombre.toLowerCase()));
        setUsuarios(usuariosFiltrados);
      } else {
        console.error('La respuesta de la API de usuarios no es un array:', res.data);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuarios([]);
      if (error.response && error.response.status === 401) {
        alertify.error('No autorizado para cargar usuarios. Tu sesión puede haber expirado.');
      } else {
        alertify.error('Error al cargar la lista de usuarios.');
      }
    }
  }, [API_BASE, user]);

  useEffect(() => {
    fetchAnuncios();
    fetchUsuarios();
  }, [fetchAnuncios, fetchUsuarios]);

  const limpiarFormulario = () => {
    setAnuncio({
      titulo: '',
      contenido: '',
      fecha_inicio: '',
      fecha_fin: '',
      usuario_id: '',
      archivo: null,
    });
    setEditando(false);
    setIdEdit(null);
    // Limpiar el input de archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnuncio((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAnuncio((prev) => ({ ...prev, archivo: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !anuncio.titulo ||
      !anuncio.contenido ||
      !anuncio.fecha_inicio ||
      !anuncio.fecha_fin ||
      !anuncio.usuario_id
    ) {
      alertify.error('Completa todos los campos correctamente');
      return;
    }

    setEnviando(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('titulo', anuncio.titulo);
    formData.append('contenido', anuncio.contenido);
    formData.append('fecha_inicio', anuncio.fecha_inicio);
    formData.append('fecha_fin', anuncio.fecha_fin);
    formData.append('usuario_id', anuncio.usuario_id);
    formData.append('creador_id', user.id);
    
    if (anuncio.archivo) {
      formData.append('file', anuncio.archivo);
    }

    // La ruta de actualización (PUT) no manejará la subida de archivos en esta lógica.
    // La edición de archivos adjuntos requeriría una lógica más compleja.
    const url = editando ? `${API_BASE}/anuncios/${idEdit}` : `${API_BASE}/anuncios`;
    const method = editando ? 'PUT' : 'POST';

    try {
      const res = await axios({
        method,
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      const data = res.data;

      if (res.status >= 200 && res.status < 300) {
        alertify.success(data.mensaje || (editando ? 'Anuncio actualizado' : 'Anuncio publicado'));
        await fetchAnuncios();
        limpiarFormulario();
      } else {
        alertify.error(data.mensaje || 'Error al guardar anuncio');
      }
    } catch (error) {
      console.error(error);
      alertify.error(error.response?.data?.mensaje || 'Error de red o del servidor');
    } finally {
      setEnviando(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (a) => {
    setAnuncio({
      titulo: a.titulo,
      contenido: a.contenido,
      fecha_inicio: a.fecha_inicio ? new Date(a.fecha_inicio).toISOString().split('T')[0] : '',
      fecha_fin: a.fecha_fin ? new Date(a.fecha_fin).toISOString().split('T')[0] : '',
      usuario_id: a.usuario_id,
      archivo: null, // No se puede "re-editar" el archivo, solo eliminar y volver a subir.
    });
    setEditando(true);
    setIdEdit(a.id);
    window.scrollTo(0, 0); // Scroll al formulario
  };

  const handleDelete = (id) => {
    alertify.confirm(
      'Confirmar Eliminación',
      '¿Seguro que quieres eliminar este anuncio?',
      async () => {
        try {
          await axios.delete(`${API_BASE}/anuncios/${id}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          alertify.success("Anuncio eliminado correctamente");
          fetchAnuncios();
        } catch (error) {
          console.error(error);
          alertify.error(error.response?.data?.mensaje || 'Error al eliminar anuncio');
        }
      },
      () => alertify.message('Eliminación cancelada')
    );
  };

  return (
    <>
      <h2>{editando ? 'Editar Anuncio' : 'Nuevo Anuncio'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Título:</label>
          <input
            type="text"
            name="titulo"
            value={anuncio.titulo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Contenido:</label>
          <textarea
            name="contenido"
            value={anuncio.contenido}
            onChange={handleChange}
            required
            rows={5}
          ></textarea>
        </div>

        <div className="form-group">
          <label>Fecha de inicio:</label>
          <input
            type="date"
            name="fecha_inicio"
            value={anuncio.fecha_inicio}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Fecha de fin:</label>
          <input
            type="date"
            name="fecha_fin"
            value={anuncio.fecha_fin}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Asignar a:</label>
          <select
            name="usuario_id"
            value={anuncio.usuario_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione un usuario</option>
            {usuarios.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Subir archivo (Opcional):</label>
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }} // Ocultar el input original
          />
          <button
            type="button"
            className="custom-file-upload-button"
            onClick={handleButtonClick}
          >
            Seleccionar Archivo
          </button>
          {anuncio.archivo && <span className="selected-file-name">{anuncio.archivo.name}</span>}
        </div>

        <div className="form-buttons">
          <button type="submit" disabled={enviando}>
            {enviando
              ? 'Guardando...'
              : editando
              ? 'Actualizar Anuncio'
              : 'Publicar Anuncio'}
          </button>
          <button type="button" onClick={limpiarFormulario} disabled={enviando}>
            Limpiar
          </button>
        </div>

        {enviando && uploadProgress > 0 && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
              {uploadProgress}%
            </div>
          </div>
        )}
      </form>

      <h2 style={{ marginTop: '2rem' }}>Foro de Anuncios Activos</h2>
      <section className="anuncios-lista">
        {anuncios.length === 0 && <p>No hay anuncios activos.</p>}
        {anuncios.map((a) => (
          <article key={a.id} className="anuncio-card">
            <div className="anuncio-header">
              <h3>{a.titulo}</h3>
              <span className="anuncio-autor">Publicado por: {a.autor}</span>
              <br />
              <span className="anuncio-asignado">Asignado a: {a.asignado_a}</span>
            </div>
            <p className="anuncio-contenido">{a.contenido}</p>
            
            {/* --- Integración del componente de archivo adjunto --- */}
            <ArchivoAdjunto url={a.archivo_url} />

            <div className="anuncio-footer">
              <span className="anuncio-expira">
                Vigencia: {new Date(a.fecha_inicio).toLocaleDateString('es-PE')} - {new Date(a.fecha_fin).toLocaleDateString('es-PE')}
              </span>
              <div className="anuncio-buttons">
                <button onClick={() => handleEdit(a)}>✏️ Editar</button>
                <button onClick={() => handleDelete(a.id)}>🗑️ Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}