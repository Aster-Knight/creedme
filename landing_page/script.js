// script.js (VERSIÓN FINAL Y DINÁMICA)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA PARA SCROLL SUAVE (CORREGIDA Y MÁS ROBUSTA) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Solo intenta hacer scroll si el href no es solo '#'
            if (href.length > 1) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- LÓGICA PARA RENDERIZAR MARKDOWN (NEGRITAS) ---
    document.querySelectorAll('.markdown').forEach(elem => {
        elem.innerHTML = elem.innerHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    });

    // --- LÓGICA PARA EL ACORDEÓN INTERACTIVO ---
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        const header = item.querySelector('.feature-header');
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            featureItems.forEach(otherItem => otherItem.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // --- ¡NUEVO! LÓGICA DE ANIMACIÓN AL HACER SCROLL (INTERSECTION OBSERVER) ---
    const revealElements = document.querySelectorAll('.section h2, .section .subtitle, .feature-item, .detail-section, .cta-button');

    // Preparamos los elementos añadiéndoles la clase 'reveal'
    revealElements.forEach(el => {
        el.classList.add('reveal');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Opcional: deja de observar el elemento una vez que es visible
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // El elemento se revela cuando al menos el 10% es visible
    });

    // Empezamos a observar cada elemento
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });

});
