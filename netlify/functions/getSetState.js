// netlify/functions/getSetState.js

const admin = require('firebase-admin');

// Decodificamos la clave de servicio desde la variable de entorno de Netlify
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!serviceAccountBase64) {
  throw new Error("La variable de entorno de Firebase no está definida.");
}
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

// Inicializamos la app de Firebase SOLO SI no ha sido inicializada antes.
// Esto es importante en entornos serverless para evitar errores en ejecuciones "cálidas".
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

exports.handler = async function(event) {
  // Por ahora, pasaremos el ID del usuario en el cuerpo de la petición.
  // Más adelante, lo haremos más seguro con tokens de autenticación.
  const { userId } = JSON.parse(event.body);
  if (!userId) {
    return { statusCode: 400, body: 'Falta el ID del usuario.' };
  }

  try {
    // 1. Encontrar el set que está actualmente "abierto"
    const setsRef = db.collection('sets');
    const activeSetSnapshot = await setsRef.where('status', '==', 'abierto').limit(1).get();

    if (activeSetSnapshot.empty) {
      return { statusCode: 404, body: 'No hay ningún set activo en este momento.' };
    }

    const activeSet = activeSetSnapshot.docs[0];
    const setId = activeSet.id;

    // 2. Obtener todas las preguntas de ese set, ordenadas
    const questionsRef = db.collection('questions');
    const questionsSnapshot = await questionsRef.where('setId', '==', setId).orderBy('order').get();
    const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Obtener todas las respuestas que este usuario ha dado para este set
    const responsesRef = db.collection('responses');
    const userResponsesSnapshot = await responsesRef.where('setId', '==', setId).where('userId', '==', userId).get();
    
    // Creamos un mapa para buscar fácilmente las respuestas del usuario
    const userResponsesMap = new Map();
    userResponsesSnapshot.forEach(doc => {
      const data = doc.data();
      userResponsesMap.set(data.questionId, data);
    });

    // 4. Combinar la información: añadir el estado y la info de la respuesta a cada pregunta
    const fullState = questions.map(question => {
      const userResponse = userResponsesMap.get(question.id);
      return {
        questionId: question.id,
        questionText: question.questionText,
        order: question.order,
        hasResponded: !!userResponse, // true si el usuario ha respondido
        responseText: userResponse ? userResponse.responseText : null,
        geminiFeedback: userResponse ? userResponse.geminiFeedback : null,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setId: setId,
        setName: activeSet.data().setName,
        questions: fullState
      })
    };

  } catch (error) {
    console.error("Error al obtener el estado del set:", error);
    return { statusCode: 500, body: 'Error interno del servidor.' };
  }
};