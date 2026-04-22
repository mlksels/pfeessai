// Scripts spécifiques à la page tarifs.html

document.addEventListener('DOMContentLoaded', function() {
    // Animation des cartes au scroll
    const tarifCards = document.querySelectorAll('.tarif-card, .famille-card, .cours-card, .avantage-card, .paiement-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    tarifCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Animation du carnet
    const carnetBadge = document.querySelector('.carnet-badge');
    if (carnetBadge) {
        setInterval(() => {
            carnetBadge.style.transform = 'rotate(15deg) scale(1.1)';
            setTimeout(() => {
                carnetBadge.style.transform = 'rotate(15deg) scale(1)';
            }, 300);
        }, 3000);
    }
    
    // Système de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Fermer toutes les autres FAQ
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Ouvrir celle cliquée si elle n'était pas active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
    
    // Effet de survol sur les boutons
    const tarifButtons = document.querySelectorAll('.tarif-action .btn, .famille-card .btn, .btn-cours');
    
    tarifButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '';
        });
    });
    
    // Animation des prix
    function animatePrices() {
        const priceElements = document.querySelectorAll('.price-main .amount');
        
        priceElements.forEach(element => {
            const finalValue = parseInt(element.textContent.replace(',', ''));
            const duration = 1500;
            const startTime = Date.now();
            
            function updatePrice() {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
                const easedProgress = easeOutCubic(progress);
                
                const currentValue = Math.floor(easedProgress * finalValue);
                element.textContent = currentValue.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(updatePrice);
                } else {
                    element.textContent = finalValue.toLocaleString();
                }
            }
            
            // Démarrer l'animation quand l'élément est visible
            const priceObserver = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updatePrice();
                        priceObserver.unobserve(entry.target);
                    }
                });
            });
            
            priceObserver.observe(element);
        });
    }
    
    // Démarrer l'animation des prix
    setTimeout(animatePrices, 500);
    
    // Simulation de calcul économie
    const featuredCard = document.querySelector('.tarif-card.featured');
    if (featuredCard) {
        featuredCard.addEventListener('mouseenter', function() {
            const priceElement = this.querySelector('.price-annual');
            const originalText = priceElement.textContent;
            
            // Montrer l'économie
            const amount = this.querySelector('.amount').textContent.replace(',', '');
            const monthly = parseInt(amount);
            const annual = monthly * 12;
            const discounted = annual * 0.9; // -10%
            const saving = annual - discounted;
            
            priceElement.innerHTML = `Économisez <strong>${saving.toLocaleString()} DA</strong> par an`;
            priceElement.style.color = 'var(--success)';
            priceElement.style.fontWeight = '600';
        });
        
        featuredCard.addEventListener('mouseleave', function() {
            const priceElement = this.querySelector('.price-annual');
            priceElement.textContent = '70,000 DA/an (-10%)';
            priceElement.style.color = '';
            priceElement.style.fontWeight = '';
        });
    }
    
    // Smooth scroll pour les liens d'ancrage
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Highlight des cartes au survol
    document.querySelectorAll('.tarif-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.zIndex = '10';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.zIndex = '';
        });
    });
});