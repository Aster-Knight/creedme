const admin = require('firebase-admin');
const fetch = require('node-fetch');

// --- INICIALIZACIÓN ROBUSTA DE FIREBASE ---
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
        throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
    }
} catch (e) {
    console.error("Error al parsear la clave de servicio de Firebase:", e);
    throw new Error("La clave de servicio de Firebase no es un JSON válido.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async function(event) {
    const { secret, targetUid } = event.queryStringParameters;
    if (secret !== process.env.ADMIN_SECRET_KEY) {
        return { statusCode: 401, body: 'No autorizado.' };
    }
    if (!targetUid) {
        return { statusCode: 400, body: 'Falta el ID del usuario a promover.' };
    }

    try {
        await admin.auth().setCustomUserClaims(targetUid, { admin: true });
        return { statusCode: 200, body: `El usuario ${targetUid} ahora es administrador.` };
    } catch (error) {
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};