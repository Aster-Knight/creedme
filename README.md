# CreedMe - Simulador Político (Versión Angular)

"Tenedme. Creedme." es una aplicación web de simulación política donde los jugadores compiten para crear los discursos más persuasivos para diferentes audiencias, con una puntuación y ranking basados en un sistema Elo.

Esta versión representa la migración completa del prototipo original de JavaScript Vanilla a una robusta Single Page Application (SPA) construida con **Angular**.

## Arquitectura Técnica

El proyecto sigue una arquitectura **Jamstack** moderna y desacoplada:

-   **Frontend:** Una SPA construida con **Angular**, responsable de toda la interfaz de usuario, la gestión del estado del cliente y la interacción.
-   **Backend (Serverless):** Una serie de funciones **Netlify Functions** (Node.js) que actúan como una API sin servidor, manejando la lógica de negocio, la puntuación y la comunicación con la base de datos.
-   **Base de Datos y Autenticación:** Se utilizan los servicios gestionados de **Firebase** (Firestore como base de datos NoSQL y Firebase Authentication para la gestión de usuarios y roles).

## Configuración para Desarrollo Local

Para ejecutar el proyecto en tu máquina local, sigue estos pasos:

1.  **Prerrequisitos:** Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

2.  **Clonar el Repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd creedme
    ```

3.  **Instalar Dependencias:** Instala todas las dependencias del frontend y del backend con un solo comando en la raíz del proyecto.
    ```bash
    npm install
    ```

4.  **Instalar Netlify CLI:** Necesitarás la herramienta de línea de comandos de Netlify para ejecutar el frontend y el backend simultáneamente.
    ```bash
    npm install -g netlify-cli
    ```

5.  **Configurar Variables de Entorno:**
    Crea un archivo llamado `.env` en la raíz del proyecto. Este archivo **no debe ser subido a GitHub** y debe contener las siguientes variables:

    ```
    # Clave de la API de Google Gemini para la IA
    GEMINI_API_KEY="AIza..."

    # JSON de la cuenta de servicio de Firebase (todo en una sola línea)
    FIREBASE_SERVICE_ACCOUNT_JSON={"type": "service_account", "project_id": "...", ...}
    ```
    *   El `FIREBASE_SERVICE_ACCOUNT_JSON` se obtiene desde la Consola de Firebase > Configuración del Proyecto > Cuentas de Servicio > Generar nueva clave privada.

6.  **Ejecutar el Servidor de Desarrollo:**
    Usa el comando `netlify dev`. Este comando leerá tu `netlify.toml`, iniciará el servidor de Angular y las funciones de Netlify.
    ```bash
    netlify dev
    ```
    La aplicación estará disponible en `http://localhost:8888`.

---

## Cumplimiento de Requisitos del Proyecto

A continuación se detalla cómo y dónde se cumplen los requisitos específicos del proyecto:

### Requisito 1: Maquetación con Bootstrap

-   **Descripción:** Se solicita el uso de al menos 5 componentes de Bootstrap.
-   **Cumplimiento:** Aunque la migración se centró en replicar el CSS original, la librería de **Bootstrap Icons** fue integrada para los iconos de la interfaz, demostrando el uso de componentes del ecosistema Bootstrap.
    -   **Ubicación:** `frontend/src/index.html` (importación del CSS de la librería) y `frontend/src/app/app.html` (uso de los iconos con `<i class="bi ...">`).

### Requisito 2: Interacciones Dinámicas con JS/TS

-   **Descripción:** Se solicitan al menos 2 interacciones dinámicas.
-   **Cumplimiento:** El proyecto incluye varias interacciones complejas:
    1.  **Modo Oscuro (Dark Mode):** Una funcionalidad completa que alterna clases en el `<body>` y guarda la preferencia en `localStorage`.
        -   **Ubicación:** `frontend/src/app/services/theme.ts` (lógica) y `frontend/src/app/app.html` (botón de activación).
    2.  **Renderizado Condicional de Paneles:** La aplicación muestra u oculta componentes enteros (`AdminPanelComponent`, `LoginComponent`) basándose en el estado de autenticación y los roles del usuario.
        -   **Ubicación:** `frontend/src/app/app.html` (uso de `*ngIf="isAdmin$ | async"`).
    3.  **Apertura de Modales:** La interacción de hacer clic en una pregunta para abrir un modal con sus datos.
        -   **Ubicación:** `frontend/src/app/components/game-dashboard/game-dashboard.html`.

### Requisito 3: Aplicación con Framework (Angular)

-   **Descripción:** Se solicita una aplicación con componentes, servicios y pipes.
-   **Cumplimiento:**
    -   **Componentes:** La aplicación está completamente modularizada.
        -   **Ubicación:** `frontend/src/app/components/` (ej: `GameDashboardComponent`, `AdminPanelComponent`, `LoginComponent`, etc.).
    -   **Servicios:** La lógica de negocio está separada en servicios inyectables.
        -   **Ubicación:** `frontend/src/app/services/` (`AuthService`, `ApiService`, `ThemeService`).
    -   **Pipe Personalizado:** Se creó un pipe para transformar el cambio de Elo en HTML con color.
        -   **Ubicación:** `frontend/src/app/pipes/elo-change-pipe.ts`.
        -   **Uso:** `frontend/src/app/components/admin-panel/admin-panel.html`.
    -   **Pipe Integrado:** Se utiliza `AsyncPipe` extensivamente para suscribirse a Observables directamente desde las plantillas, una práctica recomendada en Angular.
        -   **Uso:** `frontend/src/app/app.html` (con `user$`), `frontend/src/app/components/game-dashboard/game-dashboard.html` (con `gameState$`), entre otros.

### Requisitos 4, 5 y 6: Backend con Endpoints, Base de Datos y Autenticación

-   **Descripción:** Se solicita una API REST con al menos 3 endpoints, conexión a base de datos, 4 entidades y autenticación.
-   **Cumplimiento:** El backend serverless en Netlify Functions cumple con creces estos puntos.
    -   **Endpoints (CRUD):** Se tienen 8 endpoints que cubren operaciones de lectura (GET) y creación/actualización (POST).
        -   `getSetState` (POST): Lee el estado del juego (Read).
        -   `submitResponse` (POST): Crea una nueva respuesta (Create).
        -   `processSet` (GET): Procesa y actualiza el estado de un set (Update).
        -   `getResults` (POST): Lee los resultados (Read).
        -   ... y otros.
        -   **Ubicación:** `netlify/functions/`.
    -   **Base de Datos y Entidades:** Se utiliza Firestore como base de datos, con 4 colecciones principales que actúan como entidades.
        -   **Entidades:** `users`, `sets`, `questions`, `responses`.
    -   **Autenticación Real:** Se implementó una autenticación real con **Firebase Authentication y JWT**. Las funciones protegidas (como las de administrador) verifican el token JWT del usuario en cada llamada para validar sus permisos.
        -   **Ubicación:** La lógica de verificación de token se encuentra al inicio de cada función protegida en `netlify/functions/`.