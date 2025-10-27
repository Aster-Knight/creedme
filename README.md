# Proyecto "CreedMe" - Simulador Político

![CreedMe Gameplay](https://i.imgur.com/example.png) <!-- Placeholder para una futura imagen -->

## 1. Visión General

"CreedMe" es una aplicación web interactiva que gamifica la comunicación política. Los jugadores asumen el rol de figuras políticas y deben crear discursos breves para ganar el favor de diversas audiencias secretas con diferentes ideologías. La efectividad de un discurso no es absoluta; se mide en relación con los discursos de otros jugadores a través de un sistema de rating **Elo**, similar al ajedrez. Esto crea un entorno dinámico y competitivo donde la estrategia y la adaptabilidad son clave.

Este proyecto representa una migración completa desde una prueba de concepto en JavaScript vanilla a una arquitectura moderna y robusta utilizando **Angular** para el frontend, manteniendo el backend original basado en **Firebase** y **Netlify Functions**.

## 2. Arquitectura y Tecnologías

La aplicación sigue una arquitectura desacoplada JAMstack.

*   **Frontend (SPA - Single Page Application):**
    *   **Angular 15+ (Standalone):** Framework principal que proporciona una estructura de componentes moderna, reactiva y mantenible.
    *   **Bootstrap 5:** Utilizado para un diseño responsivo y profesional, empleando componentes como `Navbar`, `Card` y `Modal`.
    *   **TypeScript:** Aporta seguridad de tipos y facilita el desarrollo a gran escala.

*   **Backend (Serverless):**
    *   **Firebase:**
        *   **Firestore:** Base de datos NoSQL utilizada como fuente principal de verdad para almacenar usuarios, preguntas, respuestas y sets de juego.
        *   **Authentication:** Gestiona el registro e inicio de sesión de usuarios de forma segura.
    *   **Netlify Functions:** Funciones serverless escritas en Node.js que constituyen la API del proyecto. Se encargan de la lógica de negocio que no puede o no debe ejecutarse en el cliente (ej. cálculo de puntuaciones, comunicación con APIs de terceros).

*   **APIs de Terceros:**
    *   **Google Gemini API:** Integrada a través de una Netlify Function para analizar los discursos de los jugadores y generar una reacción realista de la "audiencia secreta", añadiendo un elemento de IA al juego.

## 3. Características Principales

- **Autenticación Segura:** Registro e inicio de sesión con el sistema probado de Firebase Authentication.
- **Juego Interactivo:** Cuadrícula de preguntas donde los jugadores envían sus discursos a través de un modal interactivo.
- **Feedback con IA:** Cada respuesta recibe una reacción generada por la IA de Gemini, simulando la opinión de la audiencia secreta.
- **Sistema de Rating Elo:** La puntuación de los jugadores evoluciona dinámicamente basada en el rendimiento comparativo, fomentando la rejugabilidad.
- **Vistas de Datos:** Secciones claras para consultar el ranking global de jugadores y los resultados detallados de sets de preguntas anteriores.
- **Panel de Administrador:** Una vista protegida por roles que permite a un administrador finalizar un set y disparar el complejo proceso de cálculo de puntos para todos los jugadores.
- **Interfaz Adaptable:**
    *   **Diseño Responsivo:** Gracias a Bootstrap, la aplicación es usable en dispositivos de escritorio y móviles.
    *   **Modo Oscuro:** Interruptor en la barra de navegación para cambiar entre un tema claro y oscuro, mejorando la comodidad visual.
- **Pipes Personalizados:** Un `eloChange` pipe que formatea visualmente los cambios de puntuación, mejorando la legibilidad de los datos en el panel de administrador.

## 4. Guía de Instalación y Ejecución Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno de desarrollo.

### Prerrequisitos

- Node.js (v18+) y npm
- Angular CLI (`npm install -g @angular/cli`)
- Netlify CLI (`npm install -g netlify-cli`)
- Una cuenta de Firebase con un proyecto que tenga Firestore y Authentication habilitados.
- Una API Key de Google Gemini.

### Pasos

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd creedme
    ```

2.  **Instalar Dependencias del Frontend:**
    ```bash
    cd creedme-angular
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    *   En la raíz del proyecto (`/creedme`), crea un archivo llamado `.env`.
    *   Este archivo almacenará las claves secretas que usarán las Netlify Functions. **Nunca subas este archivo a GitHub.**
    *   Añade las siguientes variables:
        ```
        # Clave de servicio de Firebase, codificada en Base64.
        # Ve a Firebase > Project Settings > Service accounts > Generate new private key.
        # Codifica el contenido del JSON a Base64 y pégalo aquí.
        FIREBASE_SERVICE_ACCOUNT_B64=<Tu service account de Firebase en base64>

        # Tu clave de API para el servicio de Google Gemini.
        GEMINI_API_KEY=<Tu API Key de Gemini>
        ```

4.  **Ejecutar el Proyecto:**
    *   El CLI de Netlify es la forma recomendada de ejecutar todo el entorno (frontend y backend serverless) con un solo comando desde la raíz del proyecto (`/creedme`).
    ```bash
    netlify dev
    ```
    *   Este comando iniciará el servidor de desarrollo de Angular, cargará tus variables de entorno y servirá las Netlify Functions. La aplicación estará disponible en `http://localhost:8888`.

## 5. Documentación de la API (Netlify Functions)

La API consiste en funciones serverless ubicadas en `/netlify/functions`.

- `GET /api/getSetState`: Obtiene el estado del juego actual (preguntas, respuestas previas) para el usuario autenticado.
- `POST /api/submitResponse`: Permite a un usuario enviar una respuesta a una pregunta. El cuerpo debe incluir `questionId` y `responseText`.
- `POST /api/getResults`: Devuelve los resultados de los sets de preguntas ya cerrados.
- `POST /api/getLeaderboards`: Obtiene datos de ranking. El cuerpo debe incluir `type: 'global'` o `type: 'question'` junto con un `questionId`.
- `GET /api/processSet`: **(Admin)** Ejecuta los pasos para procesar un set. Requiere query params como `setId`, `step` y `questionIndex`.
- `POST /api/getSetDetails`: **(Admin)** Obtiene datos de rendimiento detallados de un set para la tabla de evolución de Elo.