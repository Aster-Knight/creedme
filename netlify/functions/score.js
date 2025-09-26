// Importar el SDK de Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Obtener la clave de API desde las variables de entorno seguras de Netlify
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    // Si la clave no está configurada, la función no puede operar
    throw new Error("La variable de entorno GEMINI_API_KEY no está definida.");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);

// La función principal que se ejecuta cuando se llama a la API
exports.handler = async function(event) {
    // Solo permitir solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        // Extraer los datos enviados desde el juego (frontend)
        const { question, idealAnswer, playerAnswer } = JSON.parse(event.body);

        // Obtener el modelo de Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        // Crear el "prompt" o instrucción para la IA
        const prompt = `
            Actúa como un juez experto en un concurso de conocimiento. Tu tarea es evaluar la respuesta de un jugador de manera justa y proporcionar un comentario útil.
            
            La pregunta fue: "${question}"
            La respuesta ideal o correcta es: "${idealAnswer}"
            La respuesta que dio el jugador fue: "${playerAnswer}"

            Por favor, evalúa la respuesta del jugador y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown. El formato debe ser estrictamente:
            {"score": X, "feedback": "tu explicación"}

            - "score" debe ser un número entero entre 0 (totalmente incorrecto) y 10 (perfecto).
            - "feedback" debe ser un texto breve y claro explicando por qué se dio esa puntuación. Considera errores de tipeo menores, respuestas parcialmente correctas o respuestas conceptualmente válidas pero diferentes a la ideal.
        `;

        // Enviar el prompt a Gemini
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Devolver la respuesta JSON de Gemini al frontend
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Permite llamadas desde cualquier origen (importante para GitHub Pages)
            },
            body: responseText
        };

    } catch (error) {
        console.error("Error en la función serverless:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Ocurrió un error al procesar la respuesta con la IA." })
        };
    }
};