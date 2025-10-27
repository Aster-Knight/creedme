# Documentación de Despliegue y Arquitectura - Versión 1.0 ("CreedMe" Jamstack)

## 1. Introducción y Arquitectura General

Esta documentación detalla la estructura técnica, los flujos de datos y el proceso de despliegue de la Versión 1.0 del proyecto "CreedMe". La aplicación está construida sobre una **arquitectura Jamstack/Serverless**, que se caracteriza por un frontend estático desacoplado de un backend de funciones efímeras, ofreciendo alta escalabilidad, seguridad y bajo costo.

- **Frontend:** Archivos estáticos (HTML, CSS, JS) servidos globalmente.
- **Backend:** Funciones Serverless que se ejecutan bajo demanda.
- **Base de Datos y Auth:** Servicios gestionados en la nube.

![Arquitectura v1.0](https://i.imgur.com/your-diagram-url.png) <!-- Reemplaza con una URL de un diagrama si lo creas -->

---

## 2. Componentes del Sistema

### 2.1. Frontend (Código Cliente)

El frontend es responsable de la renderización de la interfaz y la interacción con el usuario.

- **Archivos Principales:**
    - `index.html`: La estructura semántica de la aplicación, incluyendo los contenedores para la UI del juego, los modales y el panel de admin.
    - `style.css`: Define la apariencia visual, el diseño responsivo y los estilos de los componentes.
    - `firebase-init.js`: Contiene la configuración del SDK de Firebase para el cliente y la inicialización de los servicios de `auth` y `firestore`.
    - `script.js`: El cerebro del frontend. Contiene toda la lógica de la aplicación, incluyendo:
        - **Gestión de Estado de Autenticación (`auth.onAuthStateChanged`):** Orquesta toda la aplicación. Detecta si un usuario está logueado, muestra/oculta la UI correspondiente, obtiene los datos del usuario en tiempo real y gestiona la lógica de administrador.
        - **Funciones de Fetch (`fetchGameState`, `fetchAndRenderResults`, etc.):** Realizan las llamadas `fetch` a las Netlify Functions para obtener y enviar datos.
        - **Funciones de Renderizado (`renderGame`, `renderAdminSetDetails`, etc.):** Toman los datos JSON recibidos del backend y los transforman en el HTML que el usuario ve en pantalla.

### 2.2. Backend (Netlify Functions)

La lógica de negocio reside en funciones Node.js desplegadas en Netlify. Se encuentran en el directorio `netlify/functions/`.

- **`getSetState.js`**:
    - **Propósito:** Obtener el estado del juego para el usuario actual.
    - **Input:** `userId` en el body.
    - **Lógica:** Busca en Firestore el set con `status: 'abierto'`, obtiene sus 9 preguntas y las respuestas que el usuario ya ha enviado para ese set.
    - **Output:** Un objeto JSON con los detalles del set y el progreso del jugador.

- **`submitResponse.js`**:
    - **Propósito:** Recibir, procesar y guardar la respuesta de un jugador.
    - **Input:** `userId`, `questionId`, `responseText` en el body.
    - **Lógica:** 1) Guarda la respuesta en Firestore. 2) Llama a la API de Gemini para generar el "comentario destacado". 3) Actualiza el documento de la respuesta con el feedback de Gemini.
    - **Output:** El `geminiFeedback` generado.

- **`processSet.js` (Multi-Paso):**
    - **Propósito:** El motor principal de cálculo del juego, ejecutado por un admin. Es a prueba de timeouts.
    - **Input:** `setId` y (`questionIndex` o `step=calculate`) en los query parameters. `Authorization: Bearer <token>` en las cabeceras.
    - **Lógica:**
        - **Modo `questionIndex`:** Procesa una única pregunta. Obtiene las respuestas, llama a Gemini para puntuarlas en paralelo, y guarda el ranking en Firestore.
        - **Modo `step=calculate`:** Se ejecuta al final. Itera sobre todas las preguntas ya rankeadas, calcula los cambios de Elo para todos los jugadores, actualiza el `eloRating` en la colección `users`, y crea automáticamente el siguiente set.

- **Otras Funciones:** `getResults.js`, `getLeaderboards.js`, `setAdminClaim.js` para vistas de resultados, rankings y promoción de administradores.

### 2.3. Base de Datos (Firebase Firestore)

La base de datos NoSQL es el único punto de verdad de la aplicación.

- **Colección `users`:** Almacena los perfiles de los jugadores.
    - `userId` (ID del Documento): UID de Firebase Auth.
    - `username` (string): Nombre del jugador.
    - `eloRating` (number): Puntuación actual.
    - `customClaims` (en Firebase Auth): `{ admin: true }` para administradores.

- **Colección `sets`:** Gestiona las temporadas.
    - `setName` (string): Nombre del set (ej: "Set Semanal #2").
    - `status` (string): Estado actual (`abierto`, `evaluando`, `cerrado`).
    - `createdAt` (timestamp): Fecha de creación.

- **Colección `questions`:** Almacena las 9 preguntas de cada set.
    - `setId` (string): Referencia al set al que pertenece.
    - `questionText` (string): El texto de la pregunta.
    - `secretAudience` (string): El criterio de evaluación para la IA.
    - `order` (number): El número de la pregunta (1-9).

- **Colección `responses`:** Guarda cada respuesta individual.
    - `userId`, `setId`, `questionId` (strings): Referencias.
    - `responseText` (string): El discurso del jugador.
    - `geminiFeedback` (string): El comentario generado por la IA.
    - `ranking` (number): El puesto obtenido en la evaluación final.

---

## 3. Proceso de Despliegue (CI/CD)

El despliegue está **completamente automatizado** gracias a la integración entre GitHub y Netlify. Este es el flujo que no queremos perder.

1.  **Desarrollo Local:** Se trabaja en una rama de Git (ej: `dev`).
2.  **Subida a GitHub:** El desarrollador ejecuta `git push origin dev`.
3.  **Pull Request:** Se crea un Pull Request (PR) de `dev` a `main`.
4.  **Deploy Preview (Netlify):** Netlify detecta el PR automáticamente y crea una **"Deploy Preview"**. Esto es un despliegue completo y funcional de la rama `dev` en una URL temporal. Aquí se realizan todas las pruebas.
    - Netlify lee el archivo `netlify.toml` para encontrar el directorio de funciones (`netlify/functions`) y aplicar configuraciones como el `timeout` de 26 segundos para `processSet`.
    - Netlify instala las dependencias (`npm install`) y empaqueta las funciones.
5.  **Fusión (Merge):** Una vez que las pruebas en la Deploy Preview son exitosas, el PR se fusiona a la rama `main`.
6.  **Despliegue de Producción (Netlify):** Netlify detecta el cambio en `main` y realiza el mismo proceso de construcción, pero esta vez despliega el resultado en la **URL de producción principal** (`https://creedme.netlify.app`).

**Variables de Entorno Críticas (Configuradas en la UI de Netlify):**
- `GEMINI_API_KEY`: Clave para la API de Google Gemini.
- `FIREBASE_SERVICE_ACCOUNT_B64`: Clave de servicio de Firebase (codificada en Base64) para el acceso del backend.
- `ADMIN_SECRET_KEY`: (Uso heredado, ahora se usa JWT) Clave para promover administradores.