// netlify/functions/getResults.js

const admin = require('firebase-admin');

// --- INICIALIZACIÓN DE FIREBASE ---
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
// ... (resto de la inicialización, sin cambios)
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

exports.handler = async function(event) {
  const { userId } = JSON.parse(event.body);
  if (!userId) {
    return { statusCode: 400, body: 'Falta el ID del usuario.' };
  }

  try {
    const closedSetsSnapshot = await db.collection('sets')
                                      .where('status', '==', 'cerrado')
                                      .orderBy('createdAt', 'desc')
                                      .get();

    if (closedSetsSnapshot.empty) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const results = [];
    for (const setDoc of closedSetsSnapshot.docs) {
      const setData = setDoc.data();
      const setId = setDoc.id;

      const userResponsesSnapshot = await db.collection('responses')
                                            .where('setId', '==', setId)
                                            .where('userId', '==', userId)
                                            .get();

      if (userResponsesSnapshot.empty) continue;

      const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).get();
      const questionsMap = new Map(questionsSnapshot.docs.map(doc => [doc.id, doc.data()]));
      
      const userResultsForSet = userResponsesSnapshot.docs.map(responseDoc => {
        const responseData = responseDoc.data();
        const questionData = questionsMap.get(responseData.questionId);
        
        // --- ¡AQUÍ ESTÁ LA LÍNEA CORREGIDA! ---
        // Añadimos el ID de la pregunta al objeto que devolvemos.
        return {
          questionId: responseData.questionId, // <--- LA LÍNEA QUE FALTABA
          questionOrder: questionData.order,
          secretAudience: questionData.secretAudience,
          yourRanking: responseData.ranking,
          yourResponse: responseData.responseText
        };
      }).sort((a, b) => a.questionOrder - b.questionOrder);

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