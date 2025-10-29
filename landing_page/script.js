document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.markdown').forEach(elem => {
        elem.innerHTML = elem.innerHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    });

    const featuresData = [
        { icon: '🎯', title: '1. Ambiente Válido', text: 'Simulamos escenarios realistas con reglas claras y reacciones consistentes para desarrollar un juicio experto.' },
        { icon: '🔁', title: '2. Repetición Constante', text: 'A través de sets de desafíos periódicos, los usuarios practican continuamente, reforzando el conocimiento.' },
        { icon: '⚡', title: '3. Retroalimentación Inmediata', text: 'Tras cada intento, nuestra IA proporciona feedback instantáneo y contextualizado para saber si se ha acertado y por qué.' },
        { icon: '🧗', title: '4. Práctica Competitiva', text: 'Nuestro sistema de ranking Elo empuja a cada individuo fuera de su zona de confort, motivando la mejora continua.' }
    ];
    
    const featuresGrid = document.querySelector('#features .row.g-4');
    if (featuresGrid) {
        featuresGrid.innerHTML = featuresData.map(feature => `
            <div class="col-lg-3 col-md-6 scroll-reveal">
                <div class="card h-100 text-center p-4">
                    <div class="display-4 text-primary">${feature.icon}</div>
                    <div class="card-body">
                        <h5 class="card-title fw-bold">${feature.title}</h5>
                        <p class="card-text">${feature.text}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });

});