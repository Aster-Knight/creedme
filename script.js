// script.js
const globalLeaderboardSection = document.getElementById('global-leaderboard-section');
const globalLeaderboardBody = document.getElementById('global-leaderboard-body');
const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardModalBody = document.getElementById('leaderboard-modal-body');
const leaderboardCloseBtn = document.getElementById('leaderboard-close-btn');

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
let userListener = null;

auth.onAuthStateChanged(async (user) => {
    // Si teníamos una "suscripción" activa al documento de un usuario anterior, la cancelamos.
    if (userListener) {
        userListener();
    }

    if (user) {
        // --- ESTADO: Usuario Logueado ---
        currentUser = user;
        
        // Actualizar la UI principal
        authContainer.classList.add('hidden');
        mainGame.classList.remove('hidden');

        // Forzamos la recarga del token para obtener los 'custom claims' más recientes
        const tokenResult = await user.getIdTokenResult(true);

        // Listener en tiempo real para los datos del usuario (Elo, nombre, etc.)
        const userRef = db.collection('users').doc(user.uid);
        userListener = userRef.onSnapshot(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                userInfo.innerHTML = `
                    <span>Jugador: <b>${userData.username}</b></span>
                    <span>Rating: <b id="elo-rating">${Math.round(userData.eloRating)}</b></span>
                    <button id="logout-btn">Cerrar Sesión</button>
                `;
                document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
            } else {
                console.error("No se encontró el documento del usuario.");
                auth.signOut();
            }
        });

        // --- LÓGICA DE ADMINISTRADOR ---
        if (tokenResult.claims.admin) {
            const adminPanel = document.getElementById('admin-panel');
            adminPanel.classList.remove('hidden');

            const processBtn = document.getElementById('admin-process-set-btn');
            if (!processBtn.hasAttribute('data-listener-attached')) {
                processBtn.setAttribute('data-listener-attached', 'true');
                processBtn.addEventListener('click', async () => {
                    const activeSetId = gameState.setId;
                    if (!activeSetId || !confirm(`Vas a iniciar el procesamiento para el set ${activeSetId}. Este proceso no se puede detener. ¿Continuar?`)) return;

                    processBtn.disabled = true;
                    const originalButtonText = processBtn.textContent;
                    const token = await currentUser.getIdToken();

                    try {
                        // Bucle para procesar cada pregunta
                        for (let i = 0; i < 9; i++) {
                            processBtn.textContent = `Procesando Pregunta ${i + 1}/9...`;
                            
                            const rankResponse = await fetch(`/.netlify/functions/processSet?setId=${activeSetId}&questionIndex=${i}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (!rankResponse.ok) { throw new Error(await rankResponse.text()); }

                            // ¡PROGRESO EN VIVO! Llamamos a la función que renderiza la tabla de admin
                            // para que se actualice después de cada pregunta.
                            await renderAdminSetDetails({ setId: activeSetId, setName: gameState.setName });
                        }

                        // Llamada final para calcular el Elo y crear el nuevo set
                        processBtn.textContent = 'Calculando Elo y creando nuevo set...';
                        const calculateResponse = await fetch(`/.netlify/functions/processSet?setId=${activeSetId}&step=calculate`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        if (!calculateResponse.ok) { throw new Error(await calculateResponse.text()); }

                        alert('¡Set procesado con éxito! La página se recargará.');
                        location.reload();

                    } catch (error) {
                        alert(`Hubo un error al procesar el set: ${error.message}`);
                    } finally {
                        processBtn.disabled = false;
                        processBtn.textContent = originalButtonText;
                    }
                });
            }
        }

        // --- Carga de Datos del Juego ---
        fetchGameState();
        const closedSets = await fetchAndRenderResults(); // Esperamos a que termine y nos devuelva los sets
        
        // Renderizamos los detalles de admin DESPUÉS de tener los sets cerrados
        if (tokenResult.claims.admin && closedSets && closedSets.length > 0) {
            closedSets.forEach(set => renderAdminSetDetails(set));
        }
        
        fetchAndRenderGlobalLeaderboard();

    } else {
        // --- ESTADO: Usuario No Logueado ---
        currentUser = null;
        
        // Ocultar todos los elementos del juego y mostrar el login
        userInfo.innerHTML = '';
        authContainer.classList.remove('hidden');
        mainGame.classList.add('hidden');
        resultsSection.classList.add('hidden');
        globalLeaderboardSection.classList.add('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
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
    if (!currentUser) return []; // Si no hay usuario, devuelve un array vacío

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
                    <li data-question-id="${res.questionId}" data-question-text="Pregunta #${res.questionOrder}">
                        <strong>Pregunta #${res.questionOrder}:</strong> Quedaste en el puesto <strong>#${res.yourRanking}</strong>. 
                        <br>
                        <small>El público secreto era: <em>${res.secretAudience}</em> <a>(Ver ranking completo)</a></small>
                    </li>
                `).join('');

                setResultCard.innerHTML = `<h3>${set.setName}</h3><ul class="result-list">${resultsHTML}</ul>`;
                setsList.appendChild(setResultCard);

                setResultCard.querySelectorAll('.result-list li').forEach(item => {
                    item.addEventListener('click', () => {
                        const qId = item.getAttribute('data-question-id');
                        const qText = item.getAttribute('data-question-text');
                        showQuestionLeaderboard(qId, qText);
                    });
                });
            });
            resultsSection.classList.remove('hidden');
        }
        return closedSets; // Devolvemos los sets para que la lógica de admin los pueda usar
    } catch (error) {
        console.error("Error al renderizar los resultados:", error);
        return []; // En caso de error, devolvemos un array vacío
    }
}


// script.js

function renderGame() {
    questionsGrid.innerHTML = '';
    setNameElement.textContent = gameState.setName;

    gameState.questions.forEach(q => {
        const card = document.createElement('div');
        card.classList.add('question-card');

        // --- LÓGICA DE GRUPOS Y COLORES ---
        if (q.order <= 3) {
            card.classList.add('group-1');
        } else if (q.order <= 6) {
            card.classList.add('group-2');
        } else {
            card.classList.add('group-3');
        }

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

// script.js (pegar estas nuevas funciones)

async function fetchAndRenderGlobalLeaderboard() {
    try {
        const response = await fetch('/.netlify/functions/getLeaderboards', {
            method: 'POST',
            body: JSON.stringify({ type: 'global' })
        });
        if (!response.ok) return;

        const leaderboard = await response.json();
        globalLeaderboardBody.innerHTML = ''; // Limpiar
        leaderboard.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${index + 1}</td>
                <td>${player.username}</td>
                <td>${player.eloRating}</td>
            `;
            globalLeaderboardBody.appendChild(row);
        });
        globalLeaderboardSection.classList.remove('hidden');
    } catch (error) {
        console.error("Error al cargar el ranking global:", error);
    }
}

async function showQuestionLeaderboard(questionId, questionText) {
    leaderboardModalBody.innerHTML = '<p>Cargando ranking...</p>';
    leaderboardModal.classList.remove('hidden');
    
    try {
        const response = await fetch('/.netlify/functions/getLeaderboards', {
            method: 'POST',
            body: JSON.stringify({ type: 'question', questionId })
        });
        if (!response.ok) throw new Error('No se pudo cargar el ranking.');
        
        const leaderboard = await response.json();
        let leaderboardHTML = `<h4>${questionText}</h4><ol>`;
        leaderboard.forEach(entry => {
            leaderboardHTML += `<li><strong>${entry.username}:</strong> "${entry.responseText}"</li>`;
        });
        leaderboardHTML += '</ol>';
        leaderboardModalBody.innerHTML = leaderboardHTML;
    } catch (error) {
        leaderboardModalBody.innerHTML = `<p>${error.message}</p>`;
    }
}

leaderboardCloseBtn.addEventListener('click', () => leaderboardModal.classList.add('hidden'));

// Función para asignar un color consistente a cada jugador
function getPlayerColor(userId) {
    const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
}

// Función para renderizar la tabla de evolución de Elo (es compleja)
async function renderAdminSetDetails(set) {
    const adminDetailsDiv = document.getElementById('admin-set-details');
    
    // Creamos un contenedor específico para este set
    let setContainer = document.getElementById(`admin-set-${set.setId}`);
    if (!setContainer) {
        setContainer = document.createElement('div');
        setContainer.id = `admin-set-${set.setId}`;
        adminDetailsDiv.appendChild(setContainer);
    }
    setContainer.innerHTML = `<p>Cargando detalles para ${set.setName}...</p>`;

    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/.netlify/functions/getSetDetails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ setId: set.setId })
        });
        if (!response.ok) throw new Error('No se pudieron cargar los detalles del set.');

        const { questions, responses, users } = await response.json();
        
        // --- SIMULACIÓN DEL CÁLCULO DE ELO ---
        const userSimulatedElos = new Map(users.map(u => [u.id, u.eloRating]));
        const userEvolution = new Map(users.map(u => [u.id, [u.eloRating]])); // Guardará el Elo tras cada pregunta
        const userNames = new Map(users.map(u => [u.id, u.username]));

        for (const question of questions) {
            const rankedResponses = responses.filter(r => r.questionId === question.id).sort((a, b) => a.ranking - b.ranking);
            const N = rankedResponses.length;
            if (N < 2) {
                // Si no hay suficientes respuestas, el Elo no cambia para esta ronda
                users.forEach(u => userEvolution.get(u.id).push(userSimulatedElos.get(u.id)));
                continue;
            }
            const k = 100 / N;
            
            const roundEloChanges = new Map();

            for (let i = 0; i < N - 1; i++) {
                const playerA_data = rankedResponses[i];
                const playerB_data = rankedResponses[i+1];
                
                const playerA_elo = userSimulatedElos.get(playerA_data.userId);
                const playerB_elo = userSimulatedElos.get(playerB_data.userId);

                if (playerA_elo === undefined || playerB_elo === undefined) continue;

                const expectedScoreA = 1 / (1 + Math.pow(10, (playerB_elo - playerA_elo) / 400));
                const eloChangeA = k * (1 - expectedScoreA);
                const eloChangeB = k * (0 - (1 - expectedScoreA));
                
                roundEloChanges.set(playerA_data.userId, (roundEloChanges.get(playerA_data.userId) || 0) + eloChangeA);
                roundEloChanges.set(playerB_data.userId, (roundEloChanges.get(playerB_data.userId) || 0) + eloChangeB);
            }

            // Aplicamos los cambios simulados y guardamos el nuevo Elo en la evolución
            users.forEach(u => {
                const change = roundEloChanges.get(u.id) || 0;
                const newElo = userSimulatedElos.get(u.id) + change;
                userSimulatedElos.set(u.id, newElo);
                userEvolution.get(u.id).push(newElo);
            });
        }

        // --- CONSTRUCCIÓN DE LA TABLA HTML ---
        let tableHTML = `
            <h4>Evolución de Elo para ${set.setName}</h4>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Jugador</th>
                        <th>Elo Inicial</th>
                        ${questions.map(q => `<th>Preg. #${q.order}</th>`).join('')}
                        <th>Elo Final</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const user of users) {
            const color = getPlayerColor(user.id);
            const evolutionData = userEvolution.get(user.id);
            tableHTML += `
                <tr>
                    <td><span style="color: ${color}; font-weight: bold;">${userNames.get(user.id)}</span></td>
                    <td>${Math.round(evolutionData[0])}</td>
                    ${evolutionData.slice(1).map(elo => `<td>${Math.round(elo)}</td>`).join('')}
                    <td><strong>${Math.round(evolutionData[evolutionData.length - 1])}</strong></td>
                </tr>
            `;
        }

        tableHTML += `</tbody></table>`;
        setContainer.innerHTML = tableHTML;

    } catch (error) {
        console.error(`Error al renderizar detalles del set ${set.setName}:`, error);
        setContainer.innerHTML = `<p>Error al cargar detalles para ${set.setName}.</p>`;
    }
}