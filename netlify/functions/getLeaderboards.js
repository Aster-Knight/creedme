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
  const { type, questionId } = JSON.parse(event.body);

  try {
    if (type === 'global') {
      // --- LÓGICA PARA EL RANKING GLOBAL ---
      const usersSnapshot = await db.collection('users')
                                    .orderBy('eloRating', 'desc')
                                    .limit(100)
                                    .get();
      const globalLeaderboard = usersSnapshot.docs.map(doc => {
        const { username, eloRating } = doc.data();
        return { username, eloRating: Math.round(eloRating) };
      });
      return { statusCode: 200, body: JSON.stringify(globalLeaderboard) };

    } else if (type === 'question' && questionId) {
      // --- LÓGICA PARA EL RANKING DE UNA PREGUNTA ---
      const allUsersSnapshot = await db.collection('users').get();
      const usersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data().username]));

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