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

  // States for 2FA
  const [step, setStep] = useState('credentials'); // 'credentials' | 'verification'
  const [verificationCode, setVerificationCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');

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
        // Login directo (sin 2FA o fallback)
        const user = res.data.usuario;
        login(user);
        alertify.success('Inicio de sesión exitoso');
        navigate('/coordinador/cordinadords');
      } else if (res.data.status === 'require_2fa') {
        // Requiere 2FA
        setStep('verification');
        setUserId(res.data.userId);
        setMaskedEmail(res.data.emailMasked);
        alertify.success(`Código enviado a ${res.data.emailMasked}`);
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

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post('/verify-2fa', {
        userId,
        code: verificationCode
      });

      if (res.data.status === 'ok') {
        const user = res.data.usuario;
        login(user);
        alertify.success('Verificación exitosa');
        navigate('/coordinador/cordinadords');
      } else {
        alertify.error(res.data.mensaje || 'Código inválido');
      }
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || '❌ Error al verificar código';
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
        <div className="login-form-wrapper" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {step === 'credentials' ? (
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
          ) : (
            <form className="login-form" onSubmit={handleVerify}>
              <h1>VERIFICACIÓN</h1>
              <div style={{ color: 'white', fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>
                Ingresa el código enviado a <br /> <strong>{maskedEmail}</strong>
              </div>

              <b style={{ display: 'block', textAlign: 'left', marginTop: '20px', color: 'white' }}>
                Código de 6 dígitos
              </b>
              <input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                maxLength={6}
                style={{ letterSpacing: '5px', textAlign: 'center', fontSize: '24px' }}
              />

              <button type="submit" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? '⏳ Verificando...' : 'Verificar'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('credentials'); setVerificationCode(''); }}
                style={{ marginTop: '10px', backgroundColor: 'transparent', border: '1px solid white' }}
              >
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
