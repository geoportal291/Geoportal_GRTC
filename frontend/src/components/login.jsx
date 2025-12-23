import { useState } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import alertify from 'alertifyjs';
import fondoLogin from '../imgs/fondo-login1.avif';  // Importamos la imagen

import { useAuth } from '../data/contexts/AuthContext'; // Importar useAuth

import '../login.css';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Obtener la función login del contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post('/login', {
        usuario,
        password
      });

      if (res.data.status === 'ok') {
        const user = res.data.usuario;
        login(user); // Llamar a la función login del contexto
        alertify.success('Inicio de sesión exitoso');

        sessionStorage.setItem('showNewYearViz', 'true'); // Activar animación
        navigate('/coordinador/cordinadords');

      } else {
        alertify.error(res.data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || '❌ Error al conectar con el servidor';
      alertify.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${fondoLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="contenido">

        <div className="bloque-izquierdo">
          <h2 className="titulo-horizontal">UNIDAD FUNCIONAL DE ESTUDIOS</h2>
          <div className="logos">
            <div>
              {/* Ruta de la imagen del logo */}
              <img src="/imgs/Gtrc_login.png" alt="Logo" />
            </div>
            <div>
              <h2>
                2025<br />
                PROYECTO BIM - GIS<br />
                Versión CU-104
              </h2>
            </div>
          </div>
        </div>

        {/* Formulario login a la derecha */}
        <form className="login-form" onSubmit={handleLogin}>
          <h1>BIENVENIDO</h1>
          <div style={{ color: 'white', fontSize: '20px', textAlign: 'center' }}>
            Ingresa tus credenciales para iniciar sesión
          </div>

          <b style={{ display: 'block', textAlign: 'left', marginTop: '20px', color: 'white' }}>
            Usuario
          </b>
          <input
            type="text"
            placeholder="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <b style={{ display: 'block', textAlign: 'left', marginTop: '20px', color: 'white' }}>
            Contraseña
          </b>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? '⏳ Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
