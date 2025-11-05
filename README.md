# Proyecto "CreedMe" v2.0 (Angular)

Este proyecto es una Single Page Application (SPA) construida con Angular que sirve como frontend para un juego de simulación política. El backend está implementado como funciones serverless en Netlify, y la base de datos es Google Firestore.

## Arquitectura

- **Frontend:** Angular 17+
- **Backend:** Funciones Serverless (Node.js) en Netlify.
- **Base de Datos:** Google Firestore (NoSQL).
- **Autenticación:** Firebase Authentication.

## Desarrollo Local

Para ejecutar el proyecto en un entorno de desarrollo local que simule la arquitectura de producción, es necesario tener instalado Node.js y Netlify CLI.

1.  **Instalar dependencias:**
    Desde la raíz del proyecto, ejecuta el siguiente comando para instalar las dependencias del frontend y del backend.
    ```sh
    npm install
    ```

2.  **Instalar Netlify CLI:**
    Si no lo tienes instalado, instálalo globalmente.
    ```sh
    npm install -g netlify-cli
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto. Este archivo debe contener las credenciales de la cuenta de servicio de Firebase en una sola línea, como se muestra a continuación:
    ```
    FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
    ```

4.  **Ejecutar el servidor de desarrollo:**
    Usa el siguiente comando para iniciar el servidor de desarrollo de Netlify. Este comando arrancará el servidor de Angular y el de las funciones serverless simultáneamente.
    ```sh
    netlify dev
    ```
    La aplicación estará disponible en `http://localhost:8888`.

## Despliegue

El despliegue está automatizado a través de Netlify y se activa al hacer `push` a la rama principal del repositorio de GitHub. Netlify leerá el archivo `netlify.toml` para ejecutar la compilación de Angular y desplegar tanto el sitio estático como las funciones serverless.

## Endpoints del Backend (`/netlify/functions`)

- `POST /getSetState`: Obtiene el estado del set de preguntas actual para un usuario.
- `POST /submitResponse`: Envía la respuesta de un usuario a una pregunta y obtiene el feedback de la IA.
- `POST /getResults`: Obtiene los resultados de los sets ya cerrados para un usuario.
- `POST /getLeaderboards`: Obtiene el ranking global de jugadores o el ranking de una pregunta específica.
- `GET /processSet`: (Admin) Procesa un set de preguntas, calcula puntuaciones y Elo.
- `POST /getSetDetails`: (Admin) Obtiene todos los detalles de un set para el panel de administración.
- `GET /setAdminClaim`: (Admin) Asigna permisos de administrador a un usuario.
