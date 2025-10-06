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

// --- Elementos del DOM (Modal de Respuesta) - ¡AQUÍ ESTABA EL ERROR! ---
const modal = document.getElementById('response-modal');
const modalQuestionText = document.getElementById('modal-question-text');
const modalTextarea = document.getElementById('modal-textarea');
const modalFeedback = document.getElementById('modal-feedback');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- Get Resultados del Set ---
const resultsSection = document.getElementById('results-section');
const setsList = document.getElementById('sets-list');

// --- Estado del Juego ---
let gameState = {};
let currentUser = null; 
let currentQuestionInModal = null;

// --- CENTRO DE CONTROL DE LA APLICACIÓN (VERSIÓN MEJORADA) ---
let userListener = null; // Variable para guardar nuestra "suscripción" y poder cancelarla al hacer logout

auth.onAuthStateChanged(user => {
    if (user) {
        // --- ESTADO: Usuario Logueado ---
        currentUser = user;
        
        authContainer.classList.add('hidden');
        mainGame.classList.remove('hidden');
        
        // ¡NUEVA LÓGICA CON LISTENER EN TIEMPO REAL!
        // Nos "suscribimos" al documento del usuario.
        // La función dentro de onSnapshot se ejecutará cada vez que los datos de este usuario cambien.
        const userRef = db.collection('users').doc(user.uid);
        userListener = userRef.onSnapshot(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                // Actualizamos la UI con los datos más recientes
                userInfo.innerHTML = `
                    <span>Jugador: <b>${userData.username}</b></span>
                    <span>Rating: <b id="elo-rating">${Math.round(userData.eloRating)}</b></span>
                    <button id="logout-btn">Cerrar Sesión</button>
                `;
                // Añadimos el evento al botón de logout cada vez que se re-renderiza
                document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
            } else {
                // Esto puede pasar si el documento del usuario se borra por alguna razón
                console.error("No se encontró el documento del usuario.");
                auth.signOut(); // Forzamos el logout para evitar errores
            }
        });

        fetchGameState();
        fetchAndRenderResults(); // <-- AÑADE ESTA LÍNEA
    } else {
        // --- ESTADO: Usuario No Logueado ---
        currentUser = null;
        
        // Si teníamos una "suscripción" activa, la cancelamos para ahorrar recursos.
        if (userListener) {
            userListener(); // Llama a la función de cancelación que nos da onSnapshot
        }
        
        userInfo.innerHTML = '';
        authContainer.classList.remove('hidden');
        mainGame.classList.add('hidden');
        resultsSection.classList.add('hidden'); // Ocultamos los resultados al hacer logout
    }
});

// --- MANEJO DE EVENTOS DE AUTENTICACIÓN ---
showLoginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
authCloseBtn.addEventListener('click', () => authModal.classList.add('hidden'));

registerBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    authError.classList.add('hidden');
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await createUserDocument(userCredential.user);
        authModal.classList.add('hidden');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    authError.classList.add('hidden');
    try {
        await auth.signInWithEmailAndPassword(email, password);
        authModal.classList.add('hidden');
    } catch (error) {
        authError.textContent = error.message;
        authError.classList.remove('hidden');
    }
});

async function createUserDocument(user) {
    const userRef = db.collection('users').doc(user.uid);
    await userRef.set({
        username: user.email.split('@')[0],
        eloRating: 500,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- LÓGICA DEL JUEGO ---
async function fetchGameState() {
    showLoading();
    try {
        const response = await fetch('/.netlify/functions/getSetState', {
            method: 'POST',
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


async function fetchAndRenderResults() {
    if (!currentUser) return;

    try {
        const response = await fetch('/.netlify/functions/getResults', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUser.uid })
        });
        if (!response.ok) throw new Error("No se pudieron cargar los resultados.");

        const closedSets = await response.json();

        if (closedSets.length > 0) {
            setsList.innerHTML = ''; // Limpiar la lista
            closedSets.forEach(set => {
                const setResultCard = document.createElement('div');
                setResultCard.className = 'set-result-card';

                let resultsHTML = set.results.map(res => `
                    <li>
                        <strong>Pregunta #${res.questionOrder}:</strong> Quedaste en el puesto <strong>#${res.yourRanking}</strong>. 
                        <br>
                        <small>El público secreto era: <em>${res.secretAudience}</em></small>
                    </li>
                `).join('');

                setResultCard.innerHTML = `
                    <h3>${set.setName}</h3>
                    <ul class="result-list">${resultsHTML}</ul>
                `;
                setsList.appendChild(setResultCard);
            });
            resultsSection.classList.remove('hidden'); // Mostrar la sección de resultados
        }

    } catch (error) {
        console.error("Error al renderizar los resultados:", error);
    }
}


function renderGame() {
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
        card.addEventListener('click', () => openResponseModal(q));
        questionsGrid.appendChild(card);
    });
}

function openResponseModal(question) {
    currentQuestionInModal = question;
    modalQuestionText.textContent = question.questionText;
    modalTextarea.value = question.responseText || '';
    
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

modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));

async function handleResponseSubmit() {
    const responseText = modalTextarea.value;
    if (!responseText.trim() || !currentQuestionInModal || !currentUser) {
        alert("No se puede enviar una respuesta vacía.");
        return;
    }
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = "Procesando...";
    try {
        const response = await fetch('/.netlify/functions/submitResponse', {
            method: 'POST',
            body: JSON.stringify({
                userId: currentUser.uid,
                questionId: currentQuestionInModal.questionId,
                responseText: responseText
            })
        });
        if (!response.ok) throw new Error("El servidor devolvió un error.");
        const data = await response.json();
        modalTextarea.disabled = true;
        modalSubmitBtn.classList.add('hidden');
        modalFeedback.textContent = `Reacción del público: "${data.geminiFeedback}"`;
        modalFeedback.classList.remove('hidden');
        const questionInState = gameState.questions.find(q => q.questionId === currentQuestionInModal.questionId);
        questionInState.hasResponded = true;
        questionInState.responseText = responseText;
        questionInState.geminiFeedback = data.geminiFeedback;
        renderGame();
    } catch (error) {
        console.error("Error al enviar la respuesta:", error);
        alert("Hubo un problema al enviar tu respuesta. Por favor, inténtalo de nuevo.");
    } finally {
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