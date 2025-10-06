// script.js

// --- Elementos del DOM ---
const questionsGrid = document.getElementById('questions-grid');
const setNameElement = document.getElementById('set-name');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');

// --- Elementos del Modal ---
const modal = document.getElementById('response-modal');
const modalQuestionText = document.getElementById('modal-question-text');
const modalTextarea = document.getElementById('modal-textarea');
const modalFeedback = document.getElementById('modal-feedback');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- Estado del Juego ---
let gameState = {};
let currentUserId = null; // Lo obtendremos de Firebase Auth
let currentQuestionInModal = null;

// --- Funcion Principal ---
window.onload = () => {
    // Escucha los cambios de autenticación de Firebase
    auth.onAuthStateChanged(user => {
        if (user) {
            // --- Caso 1: Usuario ha iniciado sesión ---
            console.log("Usuario autenticado:", user.uid);
            currentUserId = user.uid;
            
            // TODO: Obtener y mostrar nombre de usuario y elo de Firestore
            document.getElementById('username').textContent = user.email; // Placeholder
            
            // Llamamos a la función SOLO si tenemos un usuario válido
            fetchGameState();

        } else {
            // --- Caso 2: Usuario no ha iniciado sesión ---
            console.log("No hay usuario logueado.");
            
            // Por ahora, para poder probar sin un sistema de login completo,
            // vamos a simular un inicio de sesión con un usuario de prueba.
            // **IMPORTANTE**: Asegúrate de que este ID existe en tu colección 'users' de Firestore.
            const testUserId = "sVkuMhYfxNSOibWuDHQR";

            if (testUserId.startsWith("PEGA_AQUI")) {
                 showError("Error de configuración: Debes añadir un ID de usuario de prueba en script.js");
                 return;
            }
            
            console.log("Usando usuario de prueba:", testUserId);
            currentUserId = testUserId;
            document.getElementById('username').textContent = "Usuario de Prueba";
            
            // Llamamos a la función con el ID de prueba
            fetchGameState();
        }
    });
};

// --- Funciones de Lógica ---

async function fetchGameState() {
    showLoading();
    try {
        const response = await fetch('/.netlify/functions/getSetState', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUserId })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        gameState = await response.json();
        renderGame();
    } catch (error) {
        showError("No se pudo cargar el estado del juego. Inténtalo de nuevo más tarde.");
        console.error("Error al obtener el estado del juego:", error);
    } finally {
        hideLoading();
    }
}

function renderGame() {
    // Limpiamos la cuadrícula antes de renderizar
    questionsGrid.innerHTML = '';
    setNameElement.textContent = gameState.setName;

    gameState.questions.forEach(q => {
        const card = document.createElement('div');
        card.classList.add('question-card');
        
        const title = document.createElement('h4');
        title.textContent = `Pregunta #${q.order}`;
        
        const status = document.createElement('p');

        if (q.hasResponded) {
            card.classList.add('answered');
            status.textContent = "Ya has respondido.";
        } else {
            status.textContent = "Pendiente de respuesta.";
        }
        
        card.appendChild(title);
        card.appendChild(status);

        // Añadimos el evento para abrir el modal al hacer clic
        card.addEventListener('click', () => openResponseModal(q));
        
        questionsGrid.appendChild(card);
    });
}

function openResponseModal(question) {
    currentQuestionInModal = question;
    modalQuestionText.textContent = question.questionText;
    modalTextarea.value = question.responseText || '';
    
    // Si ya ha respondido, mostramos su feedback y deshabilitamos la edición
    if (question.hasResponded) {
        modalFeedback.textContent = `Reacción del público: "${question.geminiFeedback}"`;
        modalFeedback.classList.remove('hidden');
        modalTextarea.disabled = true;
        modalSubmitBtn.classList.add('hidden');
    } else {
        modalFeedback.classList.add('hidden');
        modalTextarea.disabled = false;
        modalSubmitBtn.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
}

// Event listener para cerrar el modal
modalCloseBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

async function handleResponseSubmit() {
    const responseText = modalTextarea.value;
    if (!responseText.trim() || !currentQuestionInModal || !currentUserId) {
        alert("No se puede enviar una respuesta vacía.");
        return;
    }

    // Deshabilitar el botón para evitar envíos múltiples
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = "Procesando...";

    try {
        const response = await fetch('/.netlify/functions/submitResponse', {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUserId,
                questionId: currentQuestionInModal.questionId,
                responseText: responseText
            })
        });

        if (!response.ok) { throw new Error("El servidor devolvió un error."); }

        const data = await response.json();

        // Actualizar la UI del modal inmediatamente
        modalTextarea.disabled = true;
        modalSubmitBtn.classList.add('hidden');
        modalFeedback.textContent = `Reacción del público: "${data.geminiFeedback}"`;
        modalFeedback.classList.remove('hidden');

        // Actualizar el estado del juego localmente para no tener que recargar
        const questionInState = gameState.questions.find(q => q.questionId === currentQuestionInModal.questionId);
        questionInState.hasResponded = true;
        questionInState.responseText = responseText;
        questionInState.geminiFeedback = data.geminiFeedback;
        
        // Re-renderizar la cuadrícula para que la tarjeta cambie de color
        renderGame();

    } catch (error) {
        console.error("Error al enviar la respuesta:", error);
        alert("Hubo un problema al enviar tu respuesta. Por favor, inténtalo de nuevo.");
    } finally {
        // Volver a habilitar el botón en caso de error o para futuros usos
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = "Enviar Respuesta";
    }
}

modalSubmitBtn.addEventListener('click', handleResponseSubmit);


// --- Funciones de UI ---
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    questionsGrid.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
    questionsGrid.classList.remove('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
    questionsGrid.classList.add('hidden');
}