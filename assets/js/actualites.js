// Scripts spécifiques à la page actualités

document.addEventListener('DOMContentLoaded', function() {
    // Données d'actualités simulées
    const newsData = [
        {
            id: 1,
            title: "Notre équipe de football U20 championne régionale",
            excerpt: "L'équipe des moins de 20 ans a remporté le championnat régional après une saison exceptionnelle.",
            date: "2024-11-10",
            category: "competitions",
            author: "Équipe Football",
            views: 2845,
            image: "../assets/images/actualites/football.jpg",
            tags: ["football", "championnat", "jeunes"],
            featured: false,
            content: `
                <p>L'équipe de football des moins de 20 ans de l'Association Sportive Manar a remporté le championnat régional d'Oran après une saison exceptionnelle. Les jeunes joueurs ont terminé la saison invaincus avec 18 victoires et 2 matchs nuls.</p>
                
                <h3>Une saison exceptionnelle</h3>
                <p>Menés par leur entraîneur Rachid Meziane, les jeunes talents ont démontré tout au long de la saison une combativité et un esprit d'équipe exemplaires. Avec 65 buts marqués et seulement 12 encaissés, ils ont dominé la compétition de bout en bout.</p>
                
                <h3>La finale décisive</h3>
                <p>La finale s'est jouée samedi dernier au stade municipal d'Oran devant plus de 2000 spectateurs. Notre équipe s'est imposée 3-1 face à l'équipe rivale de la JS Kabylie, avec des buts de Karim (2) et Samir.</p>
                
                <h3>Prochaines étapes</h3>
                <p>Les joueurs se préparent maintenant pour les phases nationales du championnat qui débuteront en janvier prochain. Nous leur souhaitons le meilleur pour la suite de leur parcours.</p>
            `
        },
        {
            id: 2,
            title: "Nouveau coach de natation : Karim Benali",
            excerpt: "L'association accueille Karim Benali, ancien champion national, comme nouveau coach de natation.",
            date: "2024-11-08",
            category: "annonces",
            author: "Direction Sportive",
            views: 1956,
            image: "../assets/images/actualites/natation.jpg",
            tags: ["natation", "coach", "recrutement"],
            featured: false,
            content: `
                <p>L'Association Sportive Manar est fière d'annoncer l'arrivée de Karim Benali comme nouveau coach principal de la section natation. Ancien champion national et détenteur de plusieurs records, Karim apporte son expertise et son expérience à notre club.</p>
                
                <h3>Un parcours impressionnant</h3>
                <p>Karim Benali a été champion national à 5 reprises entre 2015 et 2020, spécialiste du 200m papillon et du 400m 4 nages. Il a également représenté l'Algérie aux Jeux Africains de 2019 où il a remporté deux médailles d'argent.</p>
                
                <h3>Ses objectifs pour Manar</h3>
                <p>"Je suis ravi de rejoindre l'Association Manar. Mon objectif est de développer la section natation et de former les futurs champions algériens. Nous allons mettre en place un programme d'entraînement adapté à tous les niveaux, des débutants aux compétiteurs."</p>
                
                <h3>Nouveaux créneaux</h3>
                <p>À partir de décembre, de nouveaux créneaux d'entraînement seront disponibles, y compris des sessions spéciales pour les enfants et les seniors. Les inscriptions pour les cours de natation sont déjà ouvertes.</p>
            `
        },
        {
            id: 3,
            title: "Portes ouvertes : record de participation",
            excerpt: "Notre journée portes ouvertes a attiré plus de 500 visiteurs, un record pour l'association.",
            date: "2024-11-05",
            category: "evenements",
            author: "Communication",
            views: 1745,
            image: "../assets/images/actualites/portes-ouvertes.jpg",
            tags: ["événement", "découverte", "communauté"],
            featured: false,
            content: `
                <p>La journée portes ouvertes de l'Association Sportive Manar, organisée samedi dernier, a battu tous les records avec plus de 500 visiteurs présents tout au long de la journée. Un succès qui démontre l'engouement pour le sport dans notre communauté.</p>
                
                <h3>Un programme varié</h3>
                <p>Les visiteurs ont pu découvrir toutes nos activités : démonstrations de judo, cours d'essai de fitness, initiation à la natation, tournois amicaux de football et de basketball. Les coachs étaient présents pour répondre à toutes les questions.</p>
                
                <h3>Témoignages enthousiastes</h3>
                <p>"C'était génial ! J'ai pu essayer plusieurs activités et j'ai découvert des sports que je ne connaissais pas. L'ambiance est super et les installations sont modernes." - Fatima, 28 ans</p>
                
                <h3>Inscriptions en hausse</h3>
                <p>Suite à cette journée, nous avons enregistré plus de 80 nouvelles inscriptions, un record pour une seule journée. Nous remercions tous les participants et espérons les revoir bientôt dans nos locaux.</p>
                
                <h3>Prochain événement</h3>
                <p>Devant ce succès, nous prévoyons d'organiser une nouvelle journée portes ouvertes au printemps 2025. Restez connectés à nos actualités pour plus d'informations.</p>
            `
        },
        // Ajouter plus d'articles ici...
    ];

    // Éléments DOM
    const newsContainer = document.getElementById('newsContainer');
    const newsLoader = document.getElementById('newsLoader');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('newsSearch');
    const searchBtn = document.getElementById('searchNewsBtn');
    const sortSelect = document.getElementById('sortNews');
    const articleModal = document.getElementById('articleModal');
    const modalClose = articleModal?.querySelector('.modal-close');
    const readMoreButtons = document.querySelectorAll('.read-more');
    const categoryLinks = document.querySelectorAll('[data-category]');
    const monthLinks = document.querySelectorAll('[data-month]');

    // Variables d'état
    let currentCategory = 'all';
    let currentSearch = '';
    let currentSort = 'date-desc';
    let isLoading = false;

    // Initialisation
    function init() {
        renderNewsGrid();
        setupEventListeners();
        setupFilterLinks();
    }

    // Rendu de la grille d'actualités
    function renderNewsGrid() {
        if (!newsContainer) return;

        // Filtrer les articles
        let filteredArticles = newsData.filter(article => {
            // Filtre par catégorie
            if (currentCategory !== 'all' && article.category !== currentCategory) {
                return false;
            }
            
            // Filtre par recherche
            if (currentSearch && !article.title.toLowerCase().includes(currentSearch.toLowerCase()) &&
                !article.excerpt.toLowerCase().includes(currentSearch.toLowerCase()) &&
                !article.tags.some(tag => tag.toLowerCase().includes(currentSearch.toLowerCase()))) {
                return false;
            }
            
            return true;
        });

        // Trier les articles
        filteredArticles.sort((a, b) => {
            switch (currentSort) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'popularite':
                    return b.views - a.views;
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        // Afficher le loader
        newsLoader.style.display = 'block';
        newsContainer.innerHTML = '';

        // Simuler un chargement
        setTimeout(() => {
            if (filteredArticles.length === 0) {
                newsContainer.innerHTML = `
                    <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                        <i class="fas fa-newspaper" style="font-size: 4rem; color: var(--light-gray); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--medium-gray); margin-bottom: 1rem;">Aucun article trouvé</h3>
                        <p style="color: var(--medium-gray);">Essayez de modifier vos critères de recherche</p>
                    </div>
                `;
            } else {
                filteredArticles.forEach(article => {
                    const articleElement = createArticleElement(article);
                    newsContainer.appendChild(articleElement);
                });
            }
            
            newsLoader.style.display = 'none';
            
            // Ajouter les événements aux nouveaux articles
            setupArticleEvents();
        }, 500);
    }

    // Créer un élément article
    function createArticleElement(article) {
        const formattedDate = new Date(article.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const categoryClass = `badge-${article.category}`;
        const categoryNames = {
            'competitions': 'Compétitions',
            'evenements': 'Événements',
            'resultats': 'Résultats',
            'annonces': 'Annonces'
        };

        return document.createElement('div');
    }

    // Configuration des événements
    function setupEventListeners() {
        // Filtres
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.dataset.category;
                renderNewsGrid();
            });
        });

        // Recherche
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        // Tri
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                renderNewsGrid();
            });
        }

        // Modal
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                articleModal.classList.remove('show');
            });
        }

        // Fermer le modal en cliquant en dehors
        articleModal?.addEventListener('click', (e) => {
            if (e.target === articleModal) {
                articleModal.classList.remove('show');
            }
        });

        // Boutons "Lire plus" de l'article à la une
        readMoreButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                openArticleModal(1); // Ouvrir l'article 1 (à la une)
            });
        });
    }

    // Configuration des liens de filtre
    function setupFilterLinks() {
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                
                // Mettre à jour le filtre actif
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.category === category) {
                        btn.classList.add('active');
                    }
                });
                
                currentCategory = category;
                renderNewsGrid();
                
                // Scroll vers les actualités
                document.querySelector('.news-grid-section')?.scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        monthLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Implémenter le filtrage par mois si nécessaire
                showNotification('Filtrage par mois bientôt disponible !', 'info');
            });
        });
    }

    // Configuration des événements des articles
    function setupArticleEvents() {
        document.querySelectorAll('.article-read-more').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const articleId = parseInt(button.dataset.articleId);
                openArticleModal(articleId);
            });
        });
    }

    // Recherche
    function performSearch() {
        if (!searchInput) return;
        
        currentSearch = searchInput.value.trim();
        renderNewsGrid();
        
        if (currentSearch) {
            showNotification(`Recherche : "${currentSearch}"`, 'info');
        }
    }

    // Ouvrir le modal d'article
    function openArticleModal(articleId) {
        const article = newsData.find(a => a.id === articleId);
        if (!article || !articleModal) return;

        const modalTitle = articleModal.querySelector('#modalArticleTitle');
        const modalBody = articleModal.querySelector('.modal-body');

        if (!modalTitle || !modalBody) return;

        const formattedDate = new Date(article.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const categoryNames = {
            'competitions': 'Compétitions',
            'evenements': 'Événements',
            'resultats': 'Résultats',
            'annonces': 'Annonces'
        };

        modalTitle.textContent = article.title;
        
        modalBody.innerHTML = `
            <div class="article-modal-content">
                <div class="article-modal-header">
                    <div class="article-modal-meta">
                        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                        <span><i class="fas fa-user"></i> ${article.author}</span>
                        <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()} vues</span>
                        <span class="badge badge-${article.category}">${categoryNames[article.category]}</span>
                    </div>
                </div>
                
                <div class="article-modal-image">
                    <img src="${article.image}" alt="${article.title}" onerror="this.src='../assets/images/default-news.jpg'">
                </div>
                
                <div class="article-modal-body">
                    ${article.content}
                </div>
                
                <div class="article-modal-footer">
                    <div class="article-modal-tags">
                        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="article-modal-share">
                        <span>Partager :</span>
                        <div class="share-buttons">
                            <a href="#" title="Partager sur Facebook"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" title="Partager sur Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="#" title="Partager sur LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        articleModal.classList.add('show');
        
        // Ajouter les événements de partage
        setupShareButtons();
        
        // Incrémenter les vues (simulation)
        article.views += 1;
    }

    // Configuration des boutons de partage
    function setupShareButtons() {
        document.querySelectorAll('.share-buttons a').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.querySelector('i').className;
                let shareUrl = '';
                
                if (platform.includes('facebook')) {
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                } else if (platform.includes('twitter')) {
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(document.title)}`;
                } else if (platform.includes('linkedin')) {
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                }
                
                if (shareUrl) {
                    window.open(shareUrl, '_blank', 'width=600,height=400');
                }
            });
        });
    }

    // Notification
    function showNotification(message, type = 'info') {
        // Créer la notification si elle n'existe pas
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = `notification ${type}`;
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;

        notification.classList.add('show');

        // Fermer la notification
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    // Animation au scroll
    function setupScrollAnimations() {
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

        // Observer les articles
        document.querySelectorAll('.news-article, .popular-card, .featured-article').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }

    // Initialiser l'application
    init();
    setupScrollAnimations();

    // Exposer des fonctions globales si nécessaire
    window.newsApp = {
        filterByCategory: function(category) {
            currentCategory = category;
            renderNewsGrid();
        },
        searchNews: function(query) {
            currentSearch = query;
            renderNewsGrid();
        },
        openArticle: openArticleModal
    };
});