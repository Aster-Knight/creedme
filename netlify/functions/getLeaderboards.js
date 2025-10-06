// netlify/functions/getLeaderboards.js

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
  const { type, questionId } = JSON.parse(event.body);

  try {
    if (type === 'global') {
      // --- LÓGICA PARA EL RANKING GLOBAL ---
      const usersSnapshot = await db.collection('users')
                                    .orderBy('eloRating', 'desc')
                                    .limit(100) // Limitamos a los 100 mejores para eficiencia
                                    .get();
      const globalLeaderboard = usersSnapshot.docs.map(doc => {
        const { username, eloRating } = doc.data();
        return { username, eloRating: Math.round(eloRating) };
      });
      return { statusCode: 200, body: JSON.stringify(globalLeaderboard) };

    } else if (type === 'question' && questionId) {
      // --- LÓGICA PARA EL RANKING DE UNA PREGUNTA ---
      // Paso 1: Obtener todos los usuarios para mapear ID a nombre (eficiente para pocos usuarios)
      const allUsersSnapshot = await db.collection('users').get();
      const usersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data().username]));

      // Paso 2: Obtener todas las respuestas para esa pregunta, ordenadas por el ranking
      const responsesSnapshot = await db.collection('responses')
                                        .where('questionId', '==', questionId)
                                        .orderBy('ranking', 'asc')
                                        .get();
      
      const questionLeaderboard = responsesSnapshot.docs.map(doc => {
        const { userId, responseText, ranking } = doc.data();
        return {
          ranking,
          username: usersMap.get(userId) || 'Usuario Desconocido',
          responseText
        };
      });
      return { statusCode: 200, body: JSON.stringify(questionLeaderboard) };

    } else {
      return { statusCode: 400, body: 'Tipo de ranking no válido o falta questionId.' };
    }
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    return { statusCode: 500, body: 'Error interno del servidor.' };
  }
};