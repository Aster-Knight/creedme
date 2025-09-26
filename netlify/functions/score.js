// Usaremos node-fetch para hacer una llamada HTTP directa, igual que en curl
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

        // 1. Construimos la URL exacta que funcionó en curl
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

        // 2. Creamos el prompt que le enviamos a Gemini
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

        // 3. Creamos el cuerpo de la petición (payload), igual que en curl
        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // 4. Hacemos la llamada con fetch, replicando los parámetros de curl
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Si la respuesta no es exitosa, lanzamos un error para verlo en los logs
            const errorBody = await response.text();
            throw new Error(`La API de Gemini respondió con error: ${response.status} ${errorBody}`);
        }

        const geminiResponse = await response.json();

        // 5. Extraemos el texto de la respuesta, que debería ser el JSON que pedimos
        const jsonText = geminiResponse.candidates[0].content.parts[0].text;

        // 6. Devolvemos ese JSON directamente al frontend
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: jsonText 
        };

    } catch (error) {
        console.error("Error en la función serverless:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Ocurrió un error al procesar la respuesta con la IA." })
        };
    }
};