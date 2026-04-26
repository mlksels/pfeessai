// Page actualites synchronisee avec les donnees centrales

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        articles: [],
        currentCategory: 'all',
        currentSearch: '',
        currentSort: 'date-desc'
    };

    const newsContainer = document.getElementById('newsContainer');
    const newsLoader = document.getElementById('newsLoader');
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const searchInput = document.getElementById('newsSearch');
    const searchBtn = document.getElementById('searchNewsBtn');
    const sortSelect = document.getElementById('sortNews');
    const articleModal = document.getElementById('articleModal');
    const modalClose = articleModal?.querySelector('.modal-close');
    const newsletterForm = document.getElementById('newsletterForm');

    const categoryNames = {
        competitions: 'Competitions',
        evenements: 'Evenements',
        resultats: 'Resultats',
        annonces: 'Annonces'
    };

    function readArticles() {
        const sources = [
            window.DS?.get?.(window.DS?.KEYS?.news),
            parseStorage('ms_news'),
            parseStorage('actualitesData'),
            parseStorage('newsData')
        ];
        const list = sources.find((value) => Array.isArray(value) && value.length) || seedArticles();
        return list.map(normalizeArticle).sort((left, right) => new Date(right.date) - new Date(left.date));
    }

    function parseStorage(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function seedArticles() {
        return [
            {
                id: 1,
                title: 'Tournoi annuel Manar 2024 : inscriptions ouvertes',
                excerpt: 'Les inscriptions sont ouvertes pour le grand rendez-vous sportif de la saison.',
                date: '2024-11-15',
                category: 'competitions',
                author: 'Equipe Manar',
                views: 1245,
                featured: true,
                tags: ['tournoi', 'competition', 'inscription'],
                image: '../assets/images/actualites/featured.jpg',
                content: '<p>Le tournoi annuel Manar revient avec plusieurs disciplines, des categories jeunes et adultes, et un accompagnement des coachs de l association.</p>'
            },
            {
                id: 2,
                title: 'Notre equipe U20 championne regionale',
                excerpt: 'Une saison solide conclue par un titre regional merite pour les jeunes de Manar Sport.',
                date: '2024-11-10',
                category: 'resultats',
                author: 'Equipe Football',
                views: 2845,
                tags: ['football', 'u20', 'championnat'],
                image: '../assets/images/actualites/football.jpg',
                content: '<p>L equipe U20 a termine sa saison en tete du classement avec une defense solide et une attaque inspiree.</p>'
            },
            {
                id: 3,
                title: 'Nouveau coach de natation',
                excerpt: 'La section natation accueille un nouveau coach pour renforcer l encadrement et les seances.',
                date: '2024-11-08',
                category: 'annonces',
                author: 'Direction sportive',
                views: 1956,
                tags: ['natation', 'coach'],
                image: '../assets/images/actualites/natation.jpg',
                content: '<p>Le nouveau coach accompagnera les debutants, les jeunes competiteurs et les groupes adultes avec un planning renforce.</p>'
            }
        ];
    }

    function normalizeArticle(article) {
        return {
            id: Number(article.id) || Date.now(),
            title: article.title || 'Actualite',
            excerpt: article.excerpt || article.description || '',
            date: window.ManarDate?.toStorage(article.date) || article.date || new Date().toISOString().split('T')[0],
            category: article.category || 'annonces',
            author: article.author || 'Association Manar',
            views: Number(article.views) || 0,
            tags: Array.isArray(article.tags) ? article.tags : [],
            featured: Boolean(article.featured),
            image: article.image || article.dataUrl || '../assets/images/default-news.jpg',
            content: article.content || `<p>${escapeHtml(article.excerpt || article.description || 'Contenu a venir.')}</p>`
        };
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDate(value) {
        return window.ManarDate?.format(value) || new Date(value).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function notify(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        alert(message);
    }

    function getFilteredArticles() {
        return state.articles
            .filter((article) => {
                if (state.currentCategory !== 'all' && article.category !== state.currentCategory) {
                    return false;
                }

                if (!state.currentSearch) {
                    return true;
                }

                const haystack = [
                    article.title,
                    article.excerpt,
                    article.author,
                    ...(article.tags || [])
                ].join(' ').toLowerCase();

                return haystack.includes(state.currentSearch.toLowerCase());
            })
            .sort((left, right) => {
                if (state.currentSort === 'date-asc') {
                    return new Date(left.date) - new Date(right.date);
                }
                if (state.currentSort === 'popularite') {
                    return right.views - left.views;
                }
                return new Date(right.date) - new Date(left.date);
            });
    }

    function renderFeaturedArticle() {
        const featured = state.articles.find((article) => article.featured) || state.articles[0];
        const container = document.querySelector('.featured-article');
        if (!container || !featured) return;

        container.innerHTML = `
            <div class="featured-image">
                <img src="${featured.image}" alt="${escapeHtml(featured.title)}" onerror="this.src='../assets/images/default-news.jpg'">
                <div class="featured-badge">
                    <span class="badge badge-warning">A la une</span>
                    <span class="badge badge-danger">${escapeHtml(categoryNames[featured.category] || 'Actualite')}</span>
                </div>
            </div>
            <div class="featured-content">
                <div class="article-meta">
                    <span class="article-date"><i class="fas fa-calendar"></i> ${formatDate(featured.date)}</span>
                    <span class="article-author"><i class="fas fa-user"></i> ${escapeHtml(featured.author)}</span>
                    <span class="article-views"><i class="fas fa-eye"></i> ${featured.views.toLocaleString('fr-FR')} vues</span>
                </div>
                <h2 class="article-title">${escapeHtml(featured.title)}</h2>
                <p class="article-excerpt">${escapeHtml(featured.excerpt)}</p>
                <div class="article-tags">
                    ${(featured.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                <a href="#article-${featured.id}" class="btn btn-primary read-more" data-article-id="${featured.id}">
                    <i class="fas fa-book-reader"></i> Lire l'article complet
                </a>
            </div>
        `;
    }

    function renderPopularArticles() {
        const container = document.querySelector('.popular-grid');
        if (!container) return;

        const articles = [...state.articles]
            .sort((left, right) => right.views - left.views)
            .slice(0, 3);

        container.innerHTML = articles.map((article, index) => `
            <div class="popular-card">
                <div class="popular-rank">${index + 1}</div>
                <div class="popular-content">
                    <h4>${escapeHtml(article.title)}</h4>
                    <div class="popular-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
                        <span><i class="fas fa-eye"></i> ${article.views.toLocaleString('fr-FR')} vues</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function createArticleElement(article) {
        const element = document.createElement('article');
        element.className = 'news-article';
        element.innerHTML = `
            <div class="article-image">
                <img src="${article.image}" alt="${escapeHtml(article.title)}" onerror="this.src='../assets/images/default-news.jpg'">
                <div class="article-category">
                    <span class="badge badge-${article.category}">${escapeHtml(categoryNames[article.category] || 'Actualite')}</span>
                </div>
            </div>
            <div class="article-content">
                <div class="article-header">
                    <div class="article-date">
                        <i class="fas fa-calendar"></i> ${formatDate(article.date)}
                    </div>
                    <h3>${escapeHtml(article.title)}</h3>
                </div>
                <p>${escapeHtml(article.excerpt)}</p>
                <div class="article-footer">
                    <div class="article-author">
                        <i class="fas fa-user-circle"></i>
                        <span>${escapeHtml(article.author)}</span>
                    </div>
                    <div class="article-stats">
                        <span><i class="fas fa-eye"></i> ${article.views.toLocaleString('fr-FR')}</span>
                    </div>
                </div>
                <a href="#article-${article.id}" class="btn btn-outline article-read-more" data-article-id="${article.id}">
                    Lire plus
                </a>
            </div>
        `;
        return element;
    }

    function renderNewsGrid() {
        if (!newsContainer) return;

        const filtered = getFilteredArticles();
        if (newsLoader) newsLoader.style.display = 'block';
        newsContainer.innerHTML = '';

        window.setTimeout(() => {
            if (!filtered.length) {
                newsContainer.innerHTML = `
                    <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                        <i class="fas fa-newspaper" style="font-size: 4rem; color: var(--light-gray); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--medium-gray); margin-bottom: 1rem;">Aucun article trouve</h3>
                        <p style="color: var(--medium-gray);">Essayez de modifier vos filtres.</p>
                    </div>
                `;
            } else {
                filtered.forEach((article) => newsContainer.appendChild(createArticleElement(article)));
            }

            if (newsLoader) newsLoader.style.display = 'none';
            bindArticleButtons();
        }, 150);
    }

    function openArticleModal(articleId) {
        const article = state.articles.find((item) => item.id === articleId);
        if (!article || !articleModal) return;

        const modalTitle = articleModal.querySelector('#modalArticleTitle');
        const modalBody = articleModal.querySelector('.modal-body');
        if (!modalTitle || !modalBody) return;

        modalTitle.textContent = article.title;
        modalBody.innerHTML = `
            <div class="article-modal-content">
                <div class="article-modal-header">
                    <div class="article-modal-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
                        <span><i class="fas fa-user"></i> ${escapeHtml(article.author)}</span>
                        <span><i class="fas fa-eye"></i> ${article.views.toLocaleString('fr-FR')} vues</span>
                        <span class="badge badge-${article.category}">${escapeHtml(categoryNames[article.category] || 'Actualite')}</span>
                    </div>
                </div>
                <div class="article-modal-image">
                    <img src="${article.image}" alt="${escapeHtml(article.title)}" onerror="this.src='../assets/images/default-news.jpg'">
                </div>
                <div class="article-modal-body">
                    ${article.content}
                </div>
                <div class="article-modal-footer">
                    <div class="article-modal-tags">
                        ${(article.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
        articleModal.classList.add('show');
    }

    function closeArticleModal() {
        articleModal?.classList.remove('show');
    }

    function bindArticleButtons() {
        document.querySelectorAll('.article-read-more, .read-more').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                openArticleModal(Number(button.dataset.articleId));
            });
        });
    }

    function bindFilters() {
        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                filterButtons.forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                state.currentCategory = button.dataset.category || 'all';
                renderNewsGrid();
            });
        });

        searchBtn?.addEventListener('click', () => {
            state.currentSearch = searchInput?.value.trim() || '';
            renderNewsGrid();
        });

        searchInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            state.currentSearch = searchInput.value.trim();
            renderNewsGrid();
        });

        sortSelect?.addEventListener('change', (event) => {
            state.currentSort = event.target.value;
            renderNewsGrid();
        });
    }

    function bindModal() {
        modalClose?.addEventListener('click', closeArticleModal);
        articleModal?.addEventListener('click', (event) => {
            if (event.target === articleModal) {
                closeArticleModal();
            }
        });
    }

    function bindNewsletter() {
        newsletterForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            newsletterForm.reset();
            notify('Votre abonnement a ete enregistre.', 'success');
        });
    }

    function refresh() {
        state.articles = readArticles();
        renderFeaturedArticle();
        renderPopularArticles();
        renderNewsGrid();
        bindArticleButtons();
    }

    bindFilters();
    bindModal();
    bindNewsletter();
    refresh();

    if (window.DS?.on && window.DS.KEYS?.news) {
        window.DS.on(window.DS.KEYS.news, refresh);
    }

    window.addEventListener('storage', (event) => {
        if (!['ms_news', 'actualitesData', 'newsData'].includes(event.key)) return;
        refresh();
    });

    window.newsApp = {
        filterByCategory(category) {
            state.currentCategory = category || 'all';
            filterButtons.forEach((button) => {
                button.classList.toggle('active', button.dataset.category === state.currentCategory);
            });
            renderNewsGrid();
        },
        openArticle(articleId) {
            openArticleModal(Number(articleId));
        }
    };
});
