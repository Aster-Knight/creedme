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
  // --- SEGURIDAD POR TOKEN DE ADMIN ---
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

    // --- MODO 1: Procesar una única pregunta (VERSIÓN PARALELA) ---
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

      if (responsesForQuestion.length === 0) {
        return { statusCode: 200, body: `Pregunta ${qIndex + 1} no tiene respuestas. Saltando.` };
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

      // Creamos un array de promesas, una por cada respuesta a puntuar
      const scoringPromises = responsesForQuestion.map(response => {
          const scoringPrompt = `
              Contexto: Un discurso se presenta a un público de "[${question.secretAudience}]".
              Discurso: "${response.responseText}"
              Tarea: Evalúa la calidad de este discurso para ese público específico. Responde ÚNICAMENTE con un objeto JSON con una sola clave, "score", que sea un número entero del 0 al 1000. Ejemplo: {"score": 850}.
          `;
          const payload = { contents: [{ parts: [{ text: scoringPrompt }] }] };

          return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
              .then(res => res.json())
              .then(geminiData => {
                  if (geminiData.candidates && geminiData.candidates[0].content && geminiData.candidates[0].content.parts[0]) {
                      const text = geminiData.candidates[0].content.parts[0].text;
                      try {
                          const match = text.match(/{.*}/s); // Extrae cualquier cosa entre { y }
                          if (match) {
                              const scoreObj = JSON.parse(match[0]);
                              return { responseId: response.id, score: scoreObj.score || 0 };
                          }
                      } catch (e) { 
                          console.warn(`No se pudo parsear el score para la respuesta ${response.id}. Texto: ${text}`);
                      }
                  }
                  console.warn(`No se pudo obtener puntuación para la respuesta ${response.id}`);
                  return { responseId: response.id, score: 0 }; // Devuelve un score por defecto si algo falla
              })
              .catch(err => {
                  console.error(`Error en fetch para la respuesta ${response.id}:`, err);
                  return { responseId: response.id, score: 0 }; // Asegurarse de devolver un objeto en caso de error de red
              });
      });

      // Ejecutamos todas las llamadas a Gemini EN PARALELO
      const scoredResponses = await Promise.all(scoringPromises);

      // Ordenamos localmente basándonos en la puntuación recibida
      scoredResponses.sort((a, b) => b.score - a.score);

      // Guardamos el ranking final en la base de datos
      const batch = db.batch();
      scoredResponses.forEach((item, index) => {
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
          const playerA_data = rankedPlayers[i];
          const playerB_data = rankedPlayers[i+1];
          if (!usersMap.has(playerA_data.userId) || !usersMap.has(playerB_data.userId)) continue;
          const playerA_elo = usersMap.get(playerA_data.userId).eloRating;
          const playerB_elo = usersMap.get(playerB_data.userId).eloRating;
          const expectedScoreA = 1 / (1 + Math.pow(10, (playerB_elo - playerA_elo) / 400));
          const eloChangeA = k * (1 - expectedScoreA);
          const eloChangeB = k * (0 - (1 - expectedScoreA));
          eloChanges.set(playerA_data.userId, (eloChanges.get(playerA_data.userId) || 0) + eloChangeA);
          eloChanges.set(playerB_data.userId, (eloChanges.get(playerB_data.userId) || 0) + eloChangeB);
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

      console.log("Creando el siguiente set...");
      const possibleAudiences = ["Ecologistas", "Empresarios tecnológicos", "Sindicalistas", "Conservadores fiscales", "Jubilados", "Jóvenes universitarios"];
      const shuffledAudiences = possibleAudiences.sort(() => 0.5 - Math.random());
      const nextAudiences = [shuffledAudiences[0], shuffledAudiences[1], shuffledAudiences[2]];
      const possibleQuestions = [
          "¿Cuál es la reforma más urgente para el sistema educativo?", "¿Cómo debería el gobierno abordar la crisis de la vivienda?",
          "¿Qué papel debe jugar la energía nuclear en nuestro futuro energético?", "¿Son los impuestos actuales demasiado altos o demasiado bajos?",
          "¿Cómo equilibramos la privacidad personal con la seguridad nacional?", "¿Cuál es la mejor estrategia para fomentar la innovación en el país?",
          "¿Debería ser la sanidad un servicio público o privado?", "¿Qué medida propondría para combatir el cambio climático?",
          "¿Cómo podemos mejorar la integración de los inmigrantes?", "¿Es necesario reformar el sistema de pensiones?",
          "¿Qué se debe hacer para reducir la delincuencia?", "¿Cuál es su postura sobre la regulación de la inteligencia artificial?"
      ];
      const shuffledQuestions = possibleQuestions.sort(() => 0.5 - Math.random());
      const nextQuestions = shuffledQuestions.slice(0, 9);
      
      const currentSetData = await setRef.get();
      const currentSetName = currentSetData.data().setName || 'Set #0';
      const currentSetNumberMatch = currentSetName.match(/\d+/);
      const currentSetNumber = currentSetNumberMatch ? parseInt(currentSetNumberMatch[0], 10) : 0;
      
      const newSetRef = await db.collection('sets').add({
          setName: `Set Semanal #${currentSetNumber + 1}`, status: 'abierto', createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const questionBatch = db.batch();
      for (let i = 0; i < 9; i++) {
          const questionRef = db.collection('questions').doc();
          let audience;
          if (i < 3) audience = nextAudiences[0]; else if (i < 6) audience = nextAudiences[1]; else audience = nextAudiences[2];
          questionBatch.set(questionRef, {
              questionText: nextQuestions[i], secretAudience: audience, order: i + 1, setId: newSetRef.id
          });
      }
      await questionBatch.commit();
      console.log(`Nuevo set ${newSetRef.id} creado con 9 preguntas.`);
      
      return { statusCode: 200, body: `Cálculo de Elo y creación del nuevo set completados.` };
    }

    return { statusCode: 400, body: 'Parámetro no válido.' };

  } catch (error) {
    console.error("Error en processSet:", error);
    // En caso de error, intentamos revertir el estado del set a "abierto" para poder reintentar.
    await db.collection('sets').doc(setId).update({ status: 'abierto' }).catch(() => {});
    return { statusCode: 500, body: `Error procesando el set: ${error.message}` };
  }
};