# Propuesta Técnica: Evolución de "CreedMe" con un Frontend de Angular

## 1. Objetivo General

Este documento detalla el plan técnico para evolucionar el frontend del proyecto "CreedMe" de una aplicación de JavaScript Vanilla a una **Single Page Application (SPA) robusta y modular construida con Angular**. El objetivo es cumplir con los requisitos del Proyecto Final de Desarrollo Web, demostrando el dominio del framework Angular, sin sacrificar la arquitectura serverless existente (basada en **Netlify Functions** y **Firebase**) que ya ha demostrado ser eficiente, escalable y segura.

## 2. Arquitectura del Sistema (Revisada)

La arquitectura general se mantiene como un modelo **Jamstack**, pero el "JavaScript" del acrónimo ahora será gestionado por Angular, proporcionando una estructura y mantenibilidad muy superiores.

*   **Frontend (Evolucionado):** Una aplicación de **Angular** desplegada como un sitio estático.
*   **Backend (Sin Cambios):** Las **Netlify Functions** (Node.js) que ya hemos construido y depurado.
*   **Base de Datos y Autenticación (Sin Cambios):** **Google Firebase** (Firestore y Authentication) sigue siendo el núcleo de la persistencia de datos y la gestión de usuarios.

## 3. Plan de Desarrollo y Cumplimiento de Requisitos

### Fase 1: Construcción del Frontend con Angular

Se creará una nueva aplicación de Angular desde cero que reemplazará nuestros archivos `index.html`, `style.css` y `script.js` originales.

1.  **Framework y Componentes:**
    *   Se utilizará el **Angular CLI** para generar una estructura de proyecto moderna y `standalone`.
    *   **Componentes (Mínimo 4):** La aplicación se modularizará en componentes reutilizables:
        *   `LoginComponent`: Gestionará el formulario de inicio de sesión y registro.
        *   `GameDashboardComponent`: Contendrá la lógica para mostrar la cuadrícula de preguntas del set activo.
        *   `ResultsDashboardComponent`: Mostrará los resultados de sets anteriores y el ranking global.
        *   `AdminPanelComponent`: Contendrá la interfaz del administrador para procesar sets y ver la evolución de Elo.
    *   **Bootstrap:** Se integrará Bootstrap para el diseño responsivo, utilizando componentes como `Cards` para las preguntas, `Modals` para las respuestas y `Tables` para los rankings, cumpliendo el requisito de usar al menos 3 componentes visuales.

2.  **Interactividad y Lógica (Angular):**
    *   **Routing Funcional:** Se configurará `RouterModule` para navegar entre las diferentes vistas (`/login`, `/juego`, `/resultados`, `/admin`), creando una experiencia de usuario fluida.
    *   **Servicios:**
        *   `FirebaseService`: Encapsulará la inicialización y la interacción con **Firebase Authentication**, manejando el estado de sesión del usuario en tiempo real.
        *   `ApiService`: Centralizará todas las llamadas `HttpClient` a nuestras **Netlify Functions** (`getSetState`, `submitResponse`, `getLeaderboards`, etc.).
    *   **Interacciones Dinámicas:** Además de la interactividad principal del juego, se añadirán funcionalidades como un **filtro de búsqueda** en la tabla de ranking global y un **tema oscuro (Dark Mode)**, cumpliendo con el requisito de "dos interacciones dinámicas".
    *   **Pipes (Integrado y Personalizado):**
        *   Se usará un `DatePipe` integrado para formatear las fechas de creación de los sets.
        *   Se creará un **`EloChangePipe` personalizado** para transformar los números de cambio de Elo en cadenas con estilo (ej: `+12.5` en verde, `-8.1` en rojo).

### Fase 2: Integración Frontend-Backend (Angular <> Netlify Functions)

Esta fase se centra en la comunicación entre la nueva app de Angular y el backend que ya existe.

1.  **Consumo de la API:** El `ApiService` de Angular se encargará de llamar a los endpoints de Netlify Functions que ya tenemos. Por ejemplo, el `GameDashboardComponent` llamará a `apiService.getSetState()` para obtener los datos del juego.
2.  **Autenticación y Rutas Protegidas:**
    *   El `FirebaseService` obtendrá el **token de autenticación (JWT)** del usuario logueado.
    *   Este token se adjuntará en las cabeceras de las llamadas a las funciones protegidas (como `processSet` o `getSetDetails`).
    *   Se crearán **Guardianes de Ruta (Route Guards)** en Angular para proteger las vistas. Por ejemplo, un `AuthGuard` impedirá el acceso a `/juego` si el usuario no está logueado, y un `AdminGuard` protegerá la ruta `/admin` verificando el "custom claim" de administrador del usuario.

### Fase 3: Despliegue y Documentación

El flujo de despliegue se adaptará para una aplicación de Angular, manteniendo la automatización.

1.  **Despliegue (Netlify):**
    *   La aplicación de **Angular** se desplegará directamente en **Netlify**.
    *   Al hacer `git push`, la plataforma ejecutará el comando `ng build`, que compila el proyecto de Angular en un conjunto de archivos estáticos (HTML, CSS, JS optimizados).
    *   Estos archivos estáticos se publicarán en una CDN global.
    *   Las **Netlify Functions** seguirán desplegándose desde la misma base de código sin cambios.

2.  **Documentación (`README.md`):**
    *   Se actualizará el archivo `README.md` para reflejar la nueva arquitectura.
    *   Incluirá:
        *   Descripción general del proyecto y su visión educativa.
        *   **Tecnologías usadas:** Angular, Netlify Functions, Firebase, Bootstrap.
        *   **Pasos de instalación:** Cómo clonar el repositorio, instalar dependencias de Node.js y Angular (`npm install` y `ng serve`).
        *   **Endpoints de la API:** Se documentará cada una de las Netlify Functions, explicando su propósito, los parámetros que espera y lo que devuelve.

3.  **Gestión de Código (Git):**
    *   Se mantendrá un historial de `commits` claros y frecuentes, con un mínimo de 5 commits por cada fase de desarrollo (Configuración de Angular, Creación de Servicios, Creación de Componentes, Despliegue, etc.).

Este enfoque nos permite cumplir con todos los requisitos del curso de manera elegante y eficiente, añadiendo el poder y la estructura de Angular a un backend serverless que ya ha sido probado y validado.