// =====================================================
// Envío de correos (alertas a los usuarios).
// Se configura en backend/.env:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Con Gmail: SMTP_HOST = smtp.gmail.com, SMTP_PORT = 465 y en
// SMTP_PASS una "contraseña de aplicación" (no la contraseña normal).
// =====================================================

import nodemailer from 'nodemailer';

let transporte = null;

function obtenerTransporte() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }

    transporte ??= nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 465,
        secure: Number(SMTP_PORT) !== 587,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 10000,
    });

    return transporte;
}

export function correoConfigurado() {
    return Boolean(obtenerTransporte());
}

// Devuelve true si se envió; nunca lanza error (una alerta no debe romper el guardado)
export async function enviarCorreo({ para, asunto, texto, html }) {
    const envio = obtenerTransporte();

    if (!envio) {
        console.warn(`Correo no configurado (SMTP_* en .env). No se envió: "${asunto}" a ${para}`);
        return false;
    }

    try {
        await envio.sendMail({
            from: `"PetCare" <${process.env.SMTP_USER}>`,
            to: para,
            subject: asunto,
            text: texto,
            html,
        });
        return true;
    } catch (error) {
        console.error('No se pudo enviar el correo:', error.message);
        return false;
    }
}
