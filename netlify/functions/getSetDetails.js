// netlify/functions/getSetDetails.js
const admin = require('firebase-admin');

// --- INICIALIZACIÓN DE FIREBASE ---
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!serviceAccountBase64) { throw new Error("..."); }
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

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
        
        // Obtenemos los IDs de todos los usuarios que participaron en este set
        const userIds = [...new Set(responses.map(r => r.userId))];
        if (userIds.length === 0) {
             return { statusCode: 200, body: JSON.stringify({ set: setDoc.data(), questions, responses: [], users: [] }) };
        }

        // Hacemos una única consulta para obtener los datos de todos esos usuarios
        const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { statusCode: 200, body: JSON.stringify({ set: setDoc.data(), questions, responses, users }) };
    } catch (error) {
        console.error("Error en getSetDetails:", error);
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};