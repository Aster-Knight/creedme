// netlify/functions/getSetDetails.js
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
    // TODO: Añadir seguridad para que solo un admin pueda llamar a esta función
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
        const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Devolvemos los datos en crudo. El frontend se encargará de simular el cálculo.
        return { statusCode: 200, body: JSON.stringify({ set: setDoc.data(), questions, responses, users }) };
    } catch (error) {
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};