// script.js

// --- Elementos del DOM (Autenticación) ---
const authContainer = document.getElementById('auth-container');
const userInfo = document.getElementById('user-info');
const authModal = document.getElementById('auth-modal');
const showLoginBtn = document.getElementById('show-login-btn');
const authCloseBtn = document.getElementById('auth-close-btn');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');

// --- Elementos del DOM (Juego) ---
const mainGame = document.querySelector('main');
const questionsGrid = document.getElementById('questions-grid');
const setNameElement = document.getElementById('set-name');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const modal = document.getElementById('response-modal');
// ... (resto de elementos del modal de respuesta)

// --- Estado del Juego ---
let gameState = {};
let currentUser = null; // Guardará el objeto de usuario de Firebase
let currentQuestionInModal = null;

// --- CENTRO DE CONTROL DE LA APLICACIÓN ---
auth.onAuthStateChanged(async user => {
    if (user) {
        // --- ESTADO: Usuario Logueado ---
        currentUser = user;
        
        // Ocultar UI de login, mostrar UI del juego
        authContainer.classList.add('hidden');
        mainGame.classList.remove('hidden');
        
        // Obtener datos del perfil del usuario desde Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userInfo.innerHTML = `
                <span>Jugador: <b>${userData.username}</b></span>
                <span>Rating: <b id="elo-rating">${userData.eloRating}</b></span>
                <button id="logout-btn">Cerrar Sesión</button>
            `;
            // Añadir evento al nuevo botón de logout
            document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
        }

        fetchGameState();
    } else {
        // --- ESTADO: Usuario No Logueado ---
        currentUser = null;
        
        // Mostrar UI de login, ocultar UI del juego
        userInfo.innerHTML = '';
        authContainer.classList.remove('hidden');
        mainGame.classList.add('hidden');
    }
});

// --- MANEJO DE EVENTOS DE AUTENTICACIÓN ---
showLoginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
authCloseBtn.addEventListener('click', () => authModal.classList.add('hidden'));

registerBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        // Al registrarse, creamos su documento en Firestore
        await createUserDocument(userCredential.user);
        authModal.classList.add('hidden'); // Cerramos el modal al tener éxito
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.classList.add('hidden'); // Cerramos el modal al tener éxito
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
});

async function createUserDocument(user) {
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
        username: user.email.split('@')[0], // Un nombre de usuario por defecto
        eloRating: 500,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- LÓGICA DEL JUEGO (La mayoría sin cambios) ---
async function fetchGameState() {
    showLoading();
    try {
        const response = await fetch('/.netlify/functions/getSetState', {
            method: 'POST',
            // Ahora enviamos el ID del usuario real
            body: JSON.stringify({ userId: currentUser.uid })
        });
        if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
        gameState = await response.json();
        renderGame();
    } catch (error) {
        showError("No se pudo cargar el estado del juego.");
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