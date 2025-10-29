# Landing Page - CreedMe

Documentación para la landing page del proyecto CreedMe.

## Descripción

Esta es una landing page estática de una sola página creada para presentar el proyecto "CreedMe". Está diseñada para ser visualmente atractiva, responsiva y para destacar las características clave del producto. La página utiliza animaciones de scroll para una experiencia de usuario dinámica.

## Estructura de Archivos

El proyecto se compone de los siguientes archivos:

-   `index.html`: El archivo principal que contiene toda la estructura HTML y el contenido de la página.
-   `style.css`: La hoja de estilos que define la apariencia visual, incluyendo colores, tipografía, diseño responsivo y animaciones.
-   `script.js`: Contiene el código JavaScript que gestiona la interactividad de la página, como:
    -   La generación dinámica de las tarjetas de "El Método".
    -   La conversión de sintaxis Markdown simple (negritas) en HTML.
    -   La implementación de animaciones que se activan al hacer scroll (`IntersectionObserver`).
-   `creedme-logo.png`: Logo principal de CreedMe.
-   `aster-knight-logo.png`: Logo del desarrollador (Aster-Knight).
-   `placeholder1.jpg`, `placeholder2.jpg`, `placeholder3.jpg`: Imágenes de marcador de posición utilizadas en el carrusel de la sección "Showcase".

## Dependencias Externas

El proyecto utiliza las siguientes librerías y recursos externos a través de CDN:

-   **Bootstrap v5.3.3**: Para el sistema de grid, componentes (navbar, modal, carrusel) y estilos base.
-   **Google Fonts (Lexend)**: Para la tipografía de la página.

## Uso

Para visualizar la página, simplemente abre el archivo `index.html` en cualquier navegador web moderno. No se requiere un servidor web ni pasos de compilación.
