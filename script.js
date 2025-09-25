
// --- CONFIGURACIÓN ---
// ¡IMPORTANTE! Reemplaza esta URL con la URL de tu función serverless una vez que la hayas desplegado.
const BACKEND_API_URL = 'https://creedme.netlify.app/.netlify/functions/score';

// --- ELEMENTOS DEL DOM ---
const questionElement = document.querySelector('.question-text');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-btn');
const resultArea = document.getElementById('result-area');

// --- DATOS DEL JUEGO ---
// Puedes ampliar esta lista con más preguntas y sus respuestas ideales.
const questions = [
    {
        text: "¿Qué planeta es conocido como el 'Planeta Rojo'?",
        idealAnswer: "Marte"
    },
    {
        text: "¿Quién escribió 'Don Quijote de la Mancha'?",
        idealAnswer: "Miguel de Cervantes"
    },
    {
        text: "¿Cuál es el río más largo del mundo?",
        idealAnswer: "El río Nilo o el río Amazonas (ambas son respuestas debatidas y válidas)"
    }
];
let currentQuestionIndex = 0;

// --- FUNCIONES DEL JUEGO ---

// Función para mostrar la pregunta actual
function displayQuestion() {
    questionElement.textContent = questions[currentQuestionIndex].text;
    answerInput.value = '';
    resultArea.innerHTML = '';
    submitButton.disabled = false;
    answerInput.disabled = false;
}

// Función para enviar la respuesta al backend
async function submitAnswer() {
    const playerAnswer = answerInput.value;
    if (!playerAnswer) {
        alert("Por favor, escribe una respuesta.");
        return;
    }

    // Deshabilitar botón y mostrar estado de carga
    submitButton.disabled = true;
    answerInput.disabled = true;
    resultArea.innerHTML = '<p class="loading">La IA está evaluando tu respuesta</p>';

    const currentQuestion = questions[currentQuestionIndex];

    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: currentQuestion.text,
                idealAnswer: currentQuestion.idealAnswer,
                playerAnswer: playerAnswer
            })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        displayResult(data);

    } catch (error) {
        resultArea.innerHTML = `<p style="color: red;">Error: No se pudo contactar al servicio de puntuación. Inténtalo de nuevo más tarde.</p>`;
        console.error("Error al enviar la respuesta:", error);
        submitButton.disabled = false;
        answerInput.disabled = false;
    }
}

// Función para mostrar el resultado devuelto por la IA
function displayResult(data) {
    resultArea.innerHTML = `
        <h3>Resultado de la IA:</h3>
        <p><strong>Puntuación:</strong> ${data.score} / 10</p>
        <p><strong>Comentario:</strong> ${data.feedback}</p>
    `;

    // Prepara la siguiente pregunta o finaliza el juego
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        submitButton.textContent = 'Siguiente Pregunta';
        submitButton.disabled = false;
        submitButton.onclick = () => {
            displayQuestion();
            submitButton.textContent = 'Enviar Respuesta';
            submitButton.onclick = submitAnswer;
        };
    } else {
        questionElement.textContent = "¡Juego terminado!";
        submitButton.style.display = 'none';
        answerInput.style.display = 'none';
    }
}

// Iniciar el juego al cargar la página
window.onload = displayQuestion;