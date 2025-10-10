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

// --- LÓGICA PRINCIPAL DE LA FUNCIÓN ---
exports.handler = async function(event) {
  // --- ¡NUEVA LÓGICA DE SEGURIDAD POR TOKEN! ---
  const { authorization } = event.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
      return { statusCode: 401, body: 'No autorizado: Falta token.' };
  }

  const token = authorization.split('Bearer ')[1];
  let decodedToken;
  try {
      decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
      return { statusCode: 401, body: 'No autorizado: Token inválido.' };
  }

  // Verificamos que el usuario tenga el "claim" de admin
  if (!decodedToken.admin) {
      return { statusCode: 403, body: 'Prohibido: Se requiere rol de administrador.' };
  }
  // --- FIN DE LA LÓGICA DE SEGURIDAD ---

  const { setId } = event.queryStringParameters;
  if (!setId) {
    return { statusCode: 400, body: 'Falta el ID del set.' };
  }

  try {
    console.log(`Procesamiento iniciado por el admin: ${decodedToken.uid} para el set: ${setId}`);
    const setRef = db.collection('sets').doc(setId);
    await setRef.update({ status: 'cerrado' });

    const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).get();
    const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const responsesSnapshot = await db.collection('responses').where('setId', '==', setId).get();
    const allResponses = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const question of questions) {
      const responsesForQuestion = allResponses.filter(r => r.questionId === question.id);
      if (responsesForQuestion.length < 2) continue;

      const rankingPrompt = `
        Contexto: Estás evaluando discursos para un público de "[${question.secretAudience}]".
        Tarea: Analiza la siguiente lista de discursos. Tu única salida debe ser un array JSON ordenado. 
        El array debe contener objetos con la clave "responseId", ordenados desde el mejor discurso (índice 0) hasta el peor, según la perspectiva del público.
        
        Discursos:
        ${responsesForQuestion.map(r => JSON.stringify({ responseId: r.id, text: r.responseText })).join('\n')}
      `;

      const geminiApiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
      const payload = { contents: [{ parts: [{ text: rankingPrompt }] }] };
      const geminiResponse = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const geminiData = await geminiResponse.json();

      const rankedText = geminiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const rankedIds = JSON.parse(rankedText);

      const batch = db.batch();
      rankedIds.forEach((item, index) => {
        const responseRef = db.collection('responses').doc(item.responseId);
        batch.update(responseRef, { ranking: index + 1 });
      });
      await batch.commit();
      console.log(`Ranking para la pregunta ${question.id} guardado.`);
    }

    const allUsersSnapshot = await db.collection('users').get();
    const usersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data()]));
    const eloChanges = new Map();

    for (const question of questions) {
      const rankedResponsesSnapshot = await db.collection('responses').where('questionId', '==', question.id).orderBy('ranking').get();
      const rankedPlayers = rankedResponsesSnapshot.docs.map(doc => doc.data());
      const N = rankedPlayers.length;

      if (N === 0) {
          continue; // No hay nada que hacer si nadie respondió
      }
      
      const k = 100 / (N > 1 ? N : 2); // Ajustamos k para que no sea excesivo si solo juega uno

      if (N === 1) {
          // --- LÓGICA DEL JUGADOR SOLITARIO ---
          const soloPlayerId = rankedPlayers[0].userId;
          // Le damos una recompensa fija, como la mitad del valor de k
          const eloChange = k; 
          eloChanges.set(soloPlayerId, (eloChanges.get(soloPlayerId) || 0) + eloChange);
          console.log(`Jugador solitario ${soloPlayerId} gana ${eloChange} Elo en la pregunta.`);
          continue; // Pasamos a la siguiente pregunta
      }

      for (let i = 0; i < N - 1; i++) {
        const playerA_data = rankedPlayers[i];
        const playerB_data = rankedPlayers[i+1];
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
    console.log("Ratings Elo actualizados.");

    await setRef.update({ processedAt: admin.firestore.FieldValue.serverTimestamp() });

    // --- ¡AQUÍ ESTÁ EL BLOQUE DE CÓDIGO MOVIDO A SU LUGAR CORRECTO! ---
    console.log("Creando el siguiente set...");

    const possibleAudiences = ["Ecologistas", "Empresarios tecnológicos", "Sindicalistas", "Conservadores fiscales", "Jubilados", "Jóvenes universitarios"];
    const shuffledAudiences = possibleAudiences.sort(() => 0.5 - Math.random());
    const nextAudiences = [shuffledAudiences[0], shuffledAudiences[1], shuffledAudiences[2]];

    const possibleQuestions = [
        "¿Cuál es la reforma más urgente para el sistema educativo?",
        "¿Cómo debería el gobierno abordar la crisis de la vivienda?",
        "¿Qué papel debe jugar la energía nuclear en nuestro futuro energético?",
        "¿Son los impuestos actuales demasiado altos o demasiado bajos?",
        "¿Cómo equilibramos la privacidad personal con la seguridad nacional?",
        "¿Cuál es la mejor estrategia para fomentar la innovación en el país?",
        "¿Debería ser la sanidad un servicio público o privado?",
        "¿Qué medida propondría para combatir el cambio climático?",
        "¿Cómo podemos mejorar la integración de los inmigrantes?",
        "¿Es necesario reformar el sistema de pensiones?",
        "¿Qué se debe hacer para reducir la delincuencia?",
        "¿Cuál es su postura sobre la regulación de la inteligencia artificial?"
    ];

    const shuffledQuestions = possibleQuestions.sort(() => 0.5 - Math.random());
    const nextQuestions = shuffledQuestions.slice(0, 9);
    
    // Obtenemos el número del set actual para nombrar el siguiente
    const currentSetData = await setRef.get();
    const currentSetName = currentSetData.data().setName || 'Set #0';
    const currentSetNumberMatch = currentSetName.match(/\d+/);
    const currentSetNumber = currentSetNumberMatch ? parseInt(currentSetNumberMatch[0], 10) : 0;
    
    const newSetRef = await db.collection('sets').add({
        setName: `Set Semanal #${currentSetNumber + 1}`,
        status: 'abierto',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const questionBatch = db.batch();
    for (let i = 0; i < 9; i++) {
        const questionRef = db.collection('questions').doc();
        let audience;
        if (i < 3) audience = nextAudiences[0];
        else if (i < 6) audience = nextAudiences[1];
        else audience = nextAudiences[2];

        questionBatch.set(questionRef, {
            questionText: nextQuestions[i],
            secretAudience: audience,
            order: i + 1,
            setId: newSetRef.id
        });
    }
    await questionBatch.commit();
    console.log(`Nuevo set ${newSetRef.id} creado con 9 preguntas.`);
    // --- FIN DEL BLOQUE MOVIDO ---

    return {
      statusCode: 200,
      body: `Procesamiento del set ${setId} completado y nuevo set ${newSetRef.id} creado.`
    };

  } catch (error) {
    console.error("Error procesando el set:", error);
    return { statusCode: 500, body: 'Error interno del servidor al procesar el set.' };
  }
};