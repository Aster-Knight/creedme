const admin = require('firebase-admin');

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
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

exports.handler = async function(event) {
    // --- LÓGICA DE SEGURIDAD POR TOKEN DE ADMIN ---
    const { authorization } = event.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return { statusCode: 401, body: 'No autorizado.' };
    }
    const token = authorization.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!decodedToken.admin) {
            return { statusCode: 403, body: 'Prohibido.' };
        }
    } catch (error) {
        return { statusCode: 401, body: 'Token inválido.' };
    }
    // --- FIN DE LA LÓGICA DE SEGURIDAD ---

    const { setId } = JSON.parse(event.body);
    if (!setId) return { statusCode: 400, body: 'Falta setId.' };

    try {
        const setDoc = await db.collection('sets').doc(setId).get();
        if (!setDoc.exists) return { statusCode: 404, body: 'Set no encontrado.' };

        const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).orderBy('order').get();
        const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const responsesSnapshot = await db.collection('responses').where('setId', '==', setId).get();
        const responses = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const userIds = [...new Set(responses.map(r => r.userId))];
        if (userIds.length === 0) {
             return { statusCode: 200, body: JSON.stringify({ set: setDoc.data(), questions, responses: [], users: [] }) };
        }

        const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { statusCode: 200, body: JSON.stringify({ set: setDoc.data(), questions, responses, users }) };
    } catch (error) {
        console.error("Error en getSetDetails:", error);
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};