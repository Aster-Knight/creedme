// netlify/functions/setAdminClaim.js
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// --- INICIALIZACIÓN DE FIREBASE ---
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!serviceAccountBase64) {
  throw new Error("La variable de entorno de Firebase no está definida.");
}
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// --- LÓGICA PRINCIPAL DE LA FUNCIÓN ---

exports.handler = async function(event) {
    const { secret, targetUid } = event.queryStringParameters;
    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return { statusCode: 401, body: 'No autorizado.' };
    }
    if (!targetUid) {
        return { statusCode: 400, body: 'Falta el ID del usuario a promover.' };
    }

    try {
        // Asignamos la "etiqueta" de admin al usuario
        await admin.auth().setCustomUserClaims(targetUid, { admin: true });
        return { statusCode: 200, body: `El usuario ${targetUid} ahora es administrador.` };
    } catch (error) {
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};