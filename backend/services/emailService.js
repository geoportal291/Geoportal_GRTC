const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Código de Verificación - Geoportal',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #007bff;">Verificación de Seguridad</h2>
        <p>Has solicitado iniciar sesión en el Geoportal.</p>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>Este código expira en 5 minutos.</p>
        <p>Si no has solicitado este código, por favor ignora este correo.</p>
      </div>
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo de verificación enviado: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error enviando correo de verificación:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail };
