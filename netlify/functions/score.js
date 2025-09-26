const fetch = require('node-fetch');

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            throw new Error("La variable de entorno GEMINI_API_KEY no está definida.");
        }

        const { question, idealAnswer, playerAnswer } = JSON.parse(event.body);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

        const prompt = `
            Actúa como un juez experto en un concurso de conocimiento. Tu tarea es evaluar la respuesta de un jugador de manera justa y proporcionar un comentario útil.
            
            La pregunta fue: "${question}"
            La respuesta ideal o correcta es: "${idealAnswer}"
            La respuesta que dio el jugador fue: "${playerAnswer}"

            Por favor, evalúa la respuesta del jugador y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown. El formato debe ser estrictamente:
            {"score": X, "feedback": "tu explicación"}

            - "score" debe ser un número entero entre 0 (totalmente incorrecto) y 10 (perfecto).
            - "feedback" debe ser un texto breve y claro explicando por qué se dio esa puntuación.
        `;

        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`La API de Gemini respondió con error: ${response.status} ${errorBody}`);
        }

        const geminiResponse = await response.json();

        // --- LÍNEA CORREGIDA ---
        // Accedemos correctamente a los arrays usando [0]
        const rawText = geminiResponse.candidates[0].content.parts[0].text;

        // Limpiamos la respuesta de Gemini para quitarle el Markdown
        const cleanedText = rawText
            .replace("```json", "")
            .replace("```", "")
            .trim();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: cleanedText 
        };

    } catch (error) {
        console.error("Error en la función serverless:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Ocurrió un error al procesar la respuesta con la IA." })
        };
    }
};