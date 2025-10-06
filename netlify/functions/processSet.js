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
  // 1. SEGURIDAD: Verificamos que la llamada venga con una clave secreta
  const { secret, setId } = event.queryStringParameters;
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return { statusCode: 401, body: 'No autorizado.' };
  }
  if (!setId) {
    return { statusCode: 400, body: 'Falta el ID del set.' };
  }

  try {
    console.log(`Iniciando procesamiento para el set: ${setId}`);

    // 2. ACTUALIZAR ESTADO DEL SET: Marcamos el set como "cerrado" para que nadie más pueda responder.
    const setRef = db.collection('sets').doc(setId);
    await setRef.update({ status: 'cerrado' });

    // 3. OBTENER DATOS: Recolectamos todas las preguntas y respuestas del set.
    const questionsSnapshot = await db.collection('questions').where('setId', '==', setId).get();
    const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const responsesSnapshot = await db.collection('responses').where('setId', '==', setId).get();
    const allResponses = responsesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 4. RANKING CON GEMINI: Por cada pregunta, enviamos todas sus respuestas a Gemini para que las ordene.
    for (const question of questions) {
      const responsesForQuestion = allResponses.filter(r => r.questionId === question.id);
      if (responsesForQuestion.length < 2) continue; // No se puede rankear si hay menos de 2 respuestas

      const rankingPrompt = `
        Contexto: Estás evaluando discursos para un público de "[${question.secretAudience}]".
        Tarea: Analiza la siguiente lista de discursos. Tu única salida debe ser un array JSON ordenado. 
        El array debe contener objetos con la clave "responseId", ordenados desde el mejor discurso (índice 0) hasta el peor, según la perspectiva del público.
        
        Discursos:
        ${responsesForQuestion.map(r => JSON.stringify({ responseId: r.id, text: r.responseText })).join('\n')}
      `;

      // Llamada a Gemini (reutilizando nuestra lógica)
      const geminiApiKey = process.env.GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
      const payload = { contents: [{ parts: [{ text: rankingPrompt }] }] };
      const geminiResponse = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const geminiData = await geminiResponse.json();

      const rankedText = geminiData.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const rankedIds = JSON.parse(rankedText);

      // Guardamos el ranking en la base de datos
      const batch = db.batch();
      rankedIds.forEach((item, index) => {
        const responseRef = db.collection('responses').doc(item.responseId);
        batch.update(responseRef, { ranking: index + 1 });
      });
      await batch.commit();
      console.log(`Ranking para la pregunta ${question.id} guardado.`);
    }

    // 5. CÁLCULO DE ELO: Ahora que todos los rankings están guardados, calculamos los puntos.
    const allUsersSnapshot = await db.collection('users').get();
    const usersMap = new Map(allUsersSnapshot.docs.map(doc => [doc.id, doc.data()]));
    const eloChanges = new Map();

    for (const question of questions) {
      const rankedResponsesSnapshot = await db.collection('responses').where('questionId', '==', question.id).orderBy('ranking').get();
      const rankedPlayers = rankedResponsesSnapshot.docs.map(doc => doc.data());
      const N = rankedPlayers.length;
      if (N < 2) continue;

      const k = 100 / N; // Factor K dinámico
      const cutoffIndex = Math.floor(N * 2 / 3); // Punto de corte

      for (let i = 0; i < N - 1; i++) {
        const playerA_data = rankedPlayers[i]; // Jugador en posición i
        const playerB_data = rankedPlayers[i+1]; // Jugador en posición i+1

        const playerA_elo = usersMap.get(playerA_data.userId).eloRating;
        const playerB_elo = usersMap.get(playerB_data.userId).eloRating;

        const expectedScoreA = 1 / (1 + Math.pow(10, (playerB_elo - playerA_elo) / 400));
        
        // La "partida" real: El jugador A (mejor ranking) siempre "gana" (resultado real = 1)
        const eloChangeA = k * (1 - expectedScoreA);
        const eloChangeB = k * (0 - (1 - expectedScoreA));

        // Acumulamos los cambios de Elo
        eloChanges.set(playerA_data.userId, (eloChanges.get(playerA_data.userId) || 0) + eloChangeA);
        eloChanges.set(playerB_data.userId, (eloChanges.get(playerB_data.userId) || 0) + eloChangeB);
      }
    }

    // 6. ACTUALIZACIÓN FINAL: Aplicamos los cambios de Elo a todos los jugadores.
    const finalBatch = db.batch();
    for (const [userId, change] of eloChanges.entries()) {
      const userRef = db.collection('users').doc(userId);
      const newElo = usersMap.get(userId).eloRating + change;
      finalBatch.update(userRef, { eloRating: Math.round(newElo) });
    }
    await finalBatch.commit();
    console.log("Ratings Elo actualizados.");

    // 7. FINALIZAR: Marcamos el set como completamente procesado.
    await setRef.update({ processedAt: admin.firestore.FieldValue.serverTimestamp() });

    return {
      statusCode: 200,
      body: `Procesamiento del set ${setId} completado con éxito.`
    };

  } catch (error) {
    console.error("Error procesando el set:", error);
    return { statusCode: 500, body: 'Error interno del servidor al procesar el set.' };
  }
};

// processSet.js (PEGAR ESTO AL FINAL DEL BLOQUE 'try')

// 8. CREAR NUEVO SET: Hacemos que el juego continúe automáticamente.
console.log("Creando el siguiente set...");

// Lista de posibles públicos. ¡Puedes ampliarla!
const possibleAudiences = ["Ecologistas", "Empresarios tecnológicos", "Sindicalistas", "Conservadores fiscales", "Jubilados", "Jóvenes universitarios"];

// Barajamos la lista para elegir 3 públicos únicos al azar
const shuffledAudiences = possibleAudiences.sort(() => 0.5 - Math.random());
const nextAudiences = [shuffledAudiences[0], shuffledAudiences[1], shuffledAudiences[2]];

// Lista de posibles preguntas. ¡Puedes ampliarla!
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

// Barajamos las preguntas para elegir 9 únicas al azar
const shuffledQuestions = possibleQuestions.sort(() => 0.5 - Math.random());
const nextQuestions = shuffledQuestions.slice(0, 9);

// Creamos el nuevo documento de set
const nextSetNumber = parseInt(setId.slice(-1) || '1', 10) + 1; // Intenta obtener el número del set anterior
const newSetRef = await db.collection('sets').add({
    setName: `Set Semanal #${nextSetNumber}`,
    status: 'abierto',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Creamos las 9 preguntas para el nuevo set
const questionBatch = db.batch();
for (let i = 0; i < 9; i++) {
    const questionRef = db.collection('questions').doc(); // Nuevo documento de pregunta
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

// La función termina con el return que ya tenías
return {
  statusCode: 200,
  body: `Procesamiento del set ${setId} completado y nuevo set ${newSetRef.id} creado.`
};