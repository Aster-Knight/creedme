# Propuesta Técnica Detallada: Migración a Angular y Expansión de "CreedMe"

**Versión:** 2.0 (Técnica)
**Fecha:** 10 de octubre de 2025
**Autor:** Aster-Knight

## 1. Resumen Ejecutivo

Este documento define la estrategia técnica para la evolución del proyecto "CreedMe". El plan se divide en dos fases principales:

1.  **Fase 1 (Migración y Paridad):** Migrar el frontend existente de JavaScript Vanilla a un proyecto **Angular** robusto y modular, manteniendo el 100% de la funcionalidad actual. El backend existente (Netlify Functions) y la base de datos (Firebase) se conservarán intactos.
2.  **Fase 2 (Expansión y Cumplimiento):** Añadir nuevas características y componentes a la aplicación de Angular para cumplir con todos los requisitos específicos del Proyecto Final, como interacciones dinámicas adicionales y pipes personalizados.

El objetivo es transformar el prototipo funcional en una Single Page Application (SPA) de nivel profesional, demostrando un dominio avanzado de las tecnologías Full Stack solicitadas.

---

### **Fase 1: Migración del Frontend a Angular (Garantizando la Funcionalidad)**

El objetivo de esta fase es replicar la funcionalidad existente sobre Angular, prestando especial atención a la configuración del entorno de desarrollo y despliegue para evitar los problemas de compilación y resolución de módulos encontrados en intentos anteriores. La estrategia se basa en una **configuración nativa y estándar** que minimice las complejidades.

#### **1.1. Estructura del Proyecto y Configuración del Entorno (Anti-Errores)**

Basado en el informe de depuración, la estructura de mono-repositorio fue la principal fuente de fallos de compilación en Netlify. Para garantizar un proceso sin fricciones, adoptaremos la siguiente estructura y configuración:

1.  **Estructura de Mono-Repositorio Optimizada para Netlify:**
    *   La raíz del proyecto contendrá el `package.json` principal, el `netlify.toml` y la carpeta `netlify/functions/`.
    *   La aplicación de Angular vivirá en un subdirectorio, por ejemplo, `/frontend`.
    *   **Clave del Éxito:** Se configurará el `package.json` de la raíz para que gestione **todas** las dependencias (tanto del backend como del frontend) y los scripts de construcción.

2.  **Configuración del `package.json` Raíz:**
    *   **Dependencias Consolidadas:** Todas las dependencias de Angular (`@angular/core`, `@angular/cli`, etc.) se instalarán en el `package.json` de la raíz, no en uno anidado. Esto asegura que Netlify las instale al principio del proceso.
    *   **Scripts de Construcción Unificados:** Se crearán scripts para gestionar la compilación desde la raíz:
        ```json
        "scripts": {
          "build:angular": "ng build --configuration production",
          "build": "npm run build:angular"
        }
        ```

3.  **Configuración Final de `netlify.toml` (La Solución al `ng: command not found`):**
    *   Este archivo le dirá a Netlify exactamente cómo manejar la estructura:
        ```toml
        [build]
          # Comando a ejecutar desde la raíz del proyecto.
          # Netlify ejecutará 'npm install' en la raíz, por lo que 'ng' estará disponible.
          command = "npm run build"
          
          # Directorio donde Angular deja los archivos compilados.
          publish = "dist/creedme-angular/browser" 
          
          # Directorio donde están las funciones serverless.
          functions = "netlify/functions"
        ```
    *   **¿Por qué esto funciona?** Al ejecutar `npm install` en la raíz, el comando `ng` (del Angular CLI) se instala en `node_modules/.bin/` de la raíz. El script `npm run build` tiene acceso a ese `PATH`, por lo que el comando `ng build` se encontrará y se ejecutará sin problemas. Esto resuelve el ciclo de errores que documentaste.

#### **1.2. Flujo de Migración de Funcionalidad (Paso a Paso y Verificable)**

Una vez que la base del proyecto esté configurada correctamente, la migración de la lógica se hará de forma incremental y verificable para asegurar que no se pierda ninguna funcionalidad.

1.  **Punto de Partida: Autenticación**
    *   **Backend:** La función `setAdminClaim.js` y la lógica de verificación de token en las demás funciones se mantienen sin cambios.
    *   **Frontend (Angular):**
        *   Se creará el `AuthService` y el `LoginComponent`.
        *   Se conectará el formulario de login/registro a los métodos del `AuthService` que interactúan con Firebase Auth.
        *   **Hito de Verificación #1:** El usuario debe poder registrarse, iniciar sesión y cerrar sesión en la nueva aplicación de Angular. El `custom claim` de admin debe persistir.

2.  **Segundo Paso: Carga del Estado del Juego**
    *   **Backend:** La función `getSetState.js` se mantiene sin cambios.
    *   **Frontend (Angular):**
        *   Se creará el `ApiService` y el `GameDashboardComponent`.
        *   Al iniciar sesión, `GameDashboardComponent` llamará a `ApiService.getSetState()`.
        *   Se replicará la lógica de renderizado para mostrar la cuadrícula de preguntas 3x3 con los colores correspondientes.
        *   **Hito de Verificación #2:** Al iniciar sesión, el usuario debe ver la cuadrícula de preguntas del set activo.

3.  **Tercer Paso: Envío de Respuestas y Feedback de IA**
    *   **Backend:** La función `submitResponse.js` se mantiene sin cambios.
    *   **Frontend (Angular):**
        *   Se creará un `ResponseModalComponent`.
        *   Al hacer clic en una pregunta, se abrirá el modal.
        *   El botón "Enviar" llamará a `ApiService.submitResponse()`.
        *   Al recibir la respuesta (el `geminiFeedback`), el modal se actualizará para mostrarla.
        *   **Hito de Verificación #3:** El usuario debe poder responder a una pregunta y recibir el feedback de la IA en tiempo real.

4.  **Cuarto Paso: Resultados y Rankings (Vista de Jugador)**
    *   **Backend:** Las funciones `getResults.js` y `getLeaderboards.js` se mantienen sin cambios.
    *   **Frontend (Angular):**
        *   Se creará un `ResultsDashboardComponent`.
        *   Este componente llamará a los servicios correspondientes para obtener los resultados de sets cerrados y los rankings.
        *   Se replicará la lógica para mostrar las tablas y los modales con los rankings detallados.
        *   **Hito de Verificación #4:** El usuario debe poder ver los resultados de sets anteriores y los rankings.

5.  **Quinto Paso: Panel de Administrador**
    *   **Backend:** La función `processSet.js` se mantiene sin cambios.
    *   **Frontend (Angular):**
        *   Se creará el `AdminPanelComponent`.
        *   Este componente se mostrará condicionalmente usando `*ngIf` si el `AuthService` detecta que el usuario tiene el claim de admin.
        *   Se conectará el botón "Finalizar Set" para que llame a la función multi-paso `ApiService.processSet()`.
        *   Se migrará la lógica de la tabla de evolución de Elo al `AdminPanelComponent`.
        *   **Hito de Verificación #5:** Un usuario administrador debe poder ver el panel y procesar un set con éxito.

Al seguir este enfoque incremental, con un hito de verificación claro para cada pieza de funcionalidad, garantizamos una migración controlada. Cada paso se construye sobre una base que ya ha sido probada, minimizando el riesgo de errores en cascada y asegurando que, al final de la Fase 1, la aplicación de Angular sea un espejo funcionalmente idéntico (pero tecnológicamente superior) a la versión original.

---

## **Fase 2: Expansión de Funcionalidades (Cumplimiento de Requisitos)**

Una vez que la migración esté completa y la funcionalidad sea idéntica a la v1.0, se añadirán las siguientes características para cumplir con los requisitos pendientes del documento.

### 2.1. Landing Page (Requisito #1 y #2)

La landing page que ya diseñamos (`index.html`, `style.css`, `script.js`) se servirá como la **página de bienvenida estática del proyecto**. Cumple con creces los requisitos:
*   **Bootstrap:** Utiliza `Navbar`, `Cards`, `Modals`, `Buttons` y el sistema de Grid.
*   **Interacciones Dinámicas:** Incluye `Scrollspy` y animaciones de "fade-in" al hacer scroll, superando el mínimo de dos.

### 2.2. Backend (Requisitos #4, #5, #6)

**El backend actual de Netlify Functions ya cumple o supera estos requisitos, por lo que no se necesita trabajo adicional.**
*   **Endpoints REST:** Tenemos más de 3 endpoints (GET, POST).
*   **Formato JSON:** Toda la comunicación es en JSON.
*   **Entidades:** Tenemos 4 entidades lógicas (`users`, `sets`, `questions`, `responses`).
*   **Base de Datos:** Estamos conectados y leemos/escribimos datos reales de Firebase (una base de datos NoSQL comparable a MongoDB Atlas).
*   **Validación:** La lógica de las funciones valida la existencia de los datos necesarios.
*   **Autenticación:** Tenemos una autenticación **real** con Firebase Auth y JWT, que es superior a la "simulada" que se pide como mínimo.

### 2.3. Aplicación Angular (Requisito #3)

La estructura creada en la Fase 1 ya cumple la mayoría de los puntos. Añadiremos los que faltan.

*   **Pipes (Integrado y Personalizado):**
    *   **Integrado:** Se utilizará el `AsyncPipe` para suscribirse a `Observables` directamente en las plantillas HTML, una práctica recomendada en Angular.
    *   **Personalizado:** Se creará un `ng generate pipe pipes/elo-change` llamado **`EloChangePipe`**. Este pipe tomará un número (ej: `15.3` o `-8.1`) y lo transformará en una cadena de texto con estilo: `<span class="text-success">+15</span>` o `<span class="text-danger">-8</span>`, para usarlo en la tabla de evolución de Elo del administrador.

*   **Interacción Dinámica Adicional:**
    *   Se implementará una funcionalidad de **"Modo Oscuro" (Dark Mode)**. Un botón en la `Navbar` permitirá al usuario cambiar entre un tema claro y uno oscuro, que se guardará en el `localStorage` para persistir su preferencia.

### 2.4. Documentación y Despliegue (Requisito #7)

*   **Despliegue:**
    *   El proyecto de Angular se desplegará en **Vercel** o **Netlify**. El proceso será el mismo: conectar el repositorio de GitHub y configurar el comando de build (`ng build`).
    *   Las Netlify Functions seguirán en su despliegue actual sin cambios.
*   **`README.md`:** Se creará un `README.md` exhaustivo siguiendo la estructura solicitada, detallando la arquitectura híbrida (Angular en el frontend, Netlify/Firebase en el backend), los pasos de instalación y la documentación de cada endpoint de las Netlify Functions.
