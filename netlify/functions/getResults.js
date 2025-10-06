// netlify/functions/getResults.js

const admin = require('firebase-admin');

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

exports.handler = async function(event) {
  const { userId } = JSON.parse(event.body);
  if (!userId) {
    return { statusCode: 400, body: 'Falta el ID del usuario.' };
  }

  try {
    // 1. Obtener todos los sets que están "cerrados" y han sido procesados.
    const closedSetsSnapshot = await db.collection('sets')
                                      .where('status', '==', 'cerrado')
                                      .orderBy('createdAt', 'desc') // Mostrar los más recientes primero
                                      .get();

    if (closedSetsSnapshot.empty) {
      return { statusCode: 200, body: JSON.stringify([]) }; // Devuelve un array vacío si no hay sets cerrados
    }

    const results = [];

    // 2. Para cada set cerrado, obtenemos los detalles
    for (const setDoc of closedSetsSnapshot.docs) {
      const setData = setDoc.data();
      const setId = setDoc.id;

      // 3. Obtenemos las respuestas de ESTE usuario para ESTE set
      const userResponsesSnapshot = await db.collection('responses')
                                            .where('setId', '==', setId)
                                            .where('userId', '==', userId)
                                            .get();

      if (userResponsesSnapshot.empty) continue; // Si el usuario no participó en este set, lo saltamos

      // 4. Obtenemos las preguntas de este set para poder mostrar el público secreto
      const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).get();
      const questionsMap = new Map(questionsSnapshot.docs.map(doc => [doc.id, doc.data()]));
      
      const userResultsForSet = userResponsesSnapshot.docs.map(responseDoc => {
        const responseData = responseDoc.data();
        const questionData = questionsMap.get(responseData.questionId);
        return {
          questionOrder: questionData.order,
          secretAudience: questionData.secretAudience,
          yourRanking: responseData.ranking,
          yourResponse: responseData.responseText
        };
      }).sort((a, b) => a.questionOrder - b.questionOrder); // Ordenamos por número de pregunta

      results.push({
        setId: setId,
        setName: setData.setName,
        results: userResultsForSet
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error("Error al obtener los resultados:", error);
    return { statusCode: 500, body: 'Error interno del servidor.' };
  }
};