// netlify/functions/processSet.js

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

exports.handler = async function(event) {
  const { authorization } = event.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
      return { statusCode: 401, body: 'No autorizado: Falta token.' };
  }

  let decodedToken;
  try {
      const token = authorization.split('Bearer ')[1];
      decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken.admin) {
          return { statusCode: 403, body: 'Prohibido: Se requiere rol de administrador.' };
      }
  } catch (error) {
      return { statusCode: 401, body: 'No autorizado: Token inválido.' };
  }

  const { setId, questionIndex, step } = event.queryStringParameters;
  if (!setId) return { statusCode: 400, body: 'Falta el ID del set.' };

  try {
    const setRef = db.collection('sets').doc(setId);

    // --- MODO 1: Procesar una única pregunta ---
    if (questionIndex !== undefined) {
      const qIndex = parseInt(questionIndex, 10);
      
      if (qIndex === 0) {
        await setRef.update({ status: 'evaluando' });
      }

      const questionSnapshot = await db.collection('questions').where('setId', '==', setId).where('order', '==', qIndex + 1).limit(1).get();
      if (questionSnapshot.empty) {
        return { statusCode: 404, body: `Pregunta con orden ${qIndex + 1} no encontrada.`};
      }
      const question = { id: questionSnapshot.docs[0].id, ...questionSnapshot.docs[0].data() };

      const responsesSnapshot = await db.collection('responses').where('questionId', '==', question.id).get();
      const responsesForQuestion = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (responsesForQuestion.length < 1) {
        return { statusCode: 200, body: `Pregunta ${qIndex + 1} no tiene respuestas. Saltando.` };
      }

      const rankingPrompt = `...`; // (Tu prompt de ranking aquí)
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
      const payload = { contents: [{ parts: [{ text: rankingPrompt }] }] };
      const geminiResponse = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const geminiData = await geminiResponse.json();

      if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error(`Gemini no devolvió candidatos para la pregunta ${qIndex + 1}.`);
      }

      const rankedText = geminiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const rankedIds = JSON.parse(rankedText);

      const batch = db.batch();
      rankedIds.forEach((item, index) => {
        const responseRef = db.collection('responses').doc(item.responseId);
        batch.update(responseRef, { ranking: index + 1 });
      });
      await batch.commit();

      return { statusCode: 200, body: `Ranking para la pregunta ${qIndex + 1} completado.` };
    }

    // --- MODO 2: Calcular Elo y crear el siguiente set ---
    if (step === 'calculate') {
      const allUsersSnapshot = await db.collection('users').get();
      const usersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data()]));
      const eloChanges = new Map();

      const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).get();
      for (const questionDoc of questionsSnapshot.docs) {
        const questionId = questionDoc.id;
        const rankedResponsesSnapshot = await db.collection('responses').where('questionId', '==', questionId).orderBy('ranking').get();
        const rankedPlayers = rankedResponsesSnapshot.docs.map(doc => doc.data());
        const N = rankedPlayers.length;

        if (N === 0) continue;
        const k = 100 / (N > 1 ? N : 2);

        if (N === 1) {
          const soloPlayerId = rankedPlayers[0].userId;
          eloChanges.set(soloPlayerId, (eloChanges.get(soloPlayerId) || 0) + k);
          continue;
        }

        for (let i = 0; i < N - 1; i++) {
          // ... (lógica de cálculo de Elo por pares, sin cambios)
        }
      }

      const finalBatch = db.batch();
      for (const [userId, change] of eloChanges.entries()) {
        const userRef = db.collection('users').doc(userId);
        const newElo = usersMap.get(userId).eloRating + change;
        finalBatch.update(userRef, { eloRating: Math.round(newElo) });
      }
      await finalBatch.commit();
      
      await setRef.update({ status: 'cerrado', processedAt: admin.firestore.FieldValue.serverTimestamp() });

      // ... (Lógica para crear el nuevo set, sin cambios)
      
      return { statusCode: 200, body: `Cálculo de Elo y creación del nuevo set completados.` };
    }

    return { statusCode: 400, body: 'Parámetro no válido.' };

  } catch (error) {
    console.error("Error en processSet:", error);
    // Marcamos el set como "abierto" de nuevo si algo falló
    await db.collection('sets').doc(setId).update({ status: 'abierto' });
    return { statusCode: 500, body: `Error procesando el set: ${error.message}` };
  }
};