// netlify/functions/submitResponse.js

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método no permitido' };
  }

  try {
    const { userId, questionId, responseText } = JSON.parse(event.body);
    if (!userId || !questionId || !responseText) {
      return { statusCode: 400, body: 'Faltan datos (userId, questionId, responseText).' };
    }

    const questionDoc = await db.collection('questions').doc(questionId).get();
    if (!questionDoc.exists) {
      return { statusCode: 404, body: 'La pregunta no fue encontrada.' };
    }
    const secretAudience = questionDoc.data().secretAudience;
    const setId = questionDoc.data().setId;

    const responseData = {
      userId,
      questionId,
      setId,
      responseText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      geminiFeedback: null,
      ranking: null
    };
    const responseDoc = await db.collection('responses').add(responseData);

    const feedbackPrompt = `Actúa como si fueras parte de un grupo de "[${secretAudience}]". 
    Acabas de escuchar el siguiente discurso político breve: "${responseText}".
    Escribe un único comentario destacado, como si fuera un tweet o una reacción en un foro, que refleje la opinión de tu grupo sobre el discurso. Sé conciso y directo.`;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: feedbackPrompt }] }] };

    const geminiApiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!geminiApiResponse.ok) {
        throw new Error('La API de Gemini no respondió correctamente.');
    }

    const geminiData = await geminiApiResponse.json();
    const feedbackText = geminiData.candidates[0].content.parts[0].text.trim();

    // --- LÍNEA CORREGIDA ---
    // El método .add() ya devuelve la referencia al documento (DocumentReference),
    // por lo que llamamos a .update() directamente sobre él, sin .ref.
    await responseDoc.update({ geminiFeedback: feedbackText });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geminiFeedback: feedbackText })
    };

  } catch (error) {
    console.error("Error en submitResponse:", error);
    return { statusCode: 500, body: 'Error interno del servidor.' };
  }
};