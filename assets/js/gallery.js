// assets/js/galerie.js - Gestion complète de la galerie avec permissions par rôle

class GalleryManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.currentCategory = 'all';
        this.currentView = 'photos';
        this.currentYear = null;
        this.photos = [];
        this.videos = [];
        this.albums = [];
        this.currentPhotoId = null;
        this.currentPhotos = [];
        this.currentPhotoIndex = -1;
        
        this.init();
    }

    async init() {
        // Vérifier l'utilisateur connecté
        this.checkAuth();
        
        // Charger les données
        await this.loadData();
        
        // Initialiser l'interface
        this.initUI();
        
        // Lier les événements
        this.bindEvents();
        
        // Afficher les photos
        this.renderPhotos();
    }

    checkAuth() {
        try {
            const session = localStorage.getItem('currentSession');
            if (session) {
                this.currentUser = JSON.parse(session);
                this.isAdmin = this.currentUser && 
                    (this.currentUser.role === 'admin' || this.currentUser.userType === 'admin');
            }
        } catch (e) {
            console.error('Erreur vérification auth:', e);
        }
    }

    async loadData() {
        try {
            // Charger les photos depuis localStorage ou utiliser les données par défaut
            const storedPhotos = localStorage.getItem('galleryPhotos');
            if (storedPhotos) {
                this.photos = JSON.parse(storedPhotos);
            } else {
                this.photos = this.generateSamplePhotos();
                localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
            }
            
            // Charger les vidéos
            const storedVideos = localStorage.getItem('galleryVideos');
            if (storedVideos) {
                this.videos = JSON.parse(storedVideos);
            } else {
                this.videos = this.generateSampleVideos();
                localStorage.setItem('galleryVideos', JSON.stringify(this.videos));
            }
            
            // Charger les albums
            const storedAlbums = localStorage.getItem('galleryAlbums');
            if (storedAlbums) {
                this.albums = JSON.parse(storedAlbums);
            } else {
                this.albums = this.generateSampleAlbums();
                localStorage.setItem('galleryAlbums', JSON.stringify(this.albums));
            }
            
            this.hideLoader();
        } catch (error) {
            console.error('Erreur chargement galerie:', error);
            this.showNotification('Erreur de chargement de la galerie', 'error');
        }
    }

    generateSamplePhotos() {
        return [
            {
                id: 1,
                title: 'Victoire en finale régionale',
                description: 'Notre équipe de football U20 après leur victoire au championnat régional.',
                category: 'competitions',
                image: '../assets/images/galerie/football-victoire.jpg',
                author: 'Karim Benali',
                authorId: 1,
                date: '2024-11-15',
                likes: 245,
                views: 1845,
                comments: 42
            },
            {
                id: 2,
                title: 'Entraînement basketball',
                description: "Séance d'entraînement de l'équipe senior féminine.",
                category: 'entrainements',
                image: '../assets/images/galerie/basket-entrainement.jpg',
                author: 'Leila Bensalem',
                authorId: 2,
                date: '2024-11-10',
                likes: 156,
                views: 982,
                comments: 23
            },
            {
                id: 3,
                title: 'Journée portes ouvertes',
                description: 'Découverte des installations lors de notre journée portes ouvertes.',
                category: 'evenements',
                image: '../assets/images/galerie/portes-ouvertes.jpg',
                author: 'Service Communication',
                authorId: 3,
                date: '2024-11-05',
                likes: 189,
                views: 2103,
                comments: 31
            },
            {
                id: 4,
                title: 'Équipe de natation',
                description: "Notre groupe de natation compétition avant l'entraînement.",
                category: 'equipes',
                image: '../assets/images/galerie/natation-equipe.jpg',
                author: 'Karim Benali',
                authorId: 1,
                date: '2024-11-02',
                likes: 134,
                views: 756,
                comments: 18
            },
            {
                id: 5,
                title: 'Nouvelle salle de musculation',
                description: 'Inauguration de notre nouvelle salle de musculation.',
                category: 'infrastructures',
                image: '../assets/images/galerie/salle-muscu.jpg',
                author: 'Direction',
                authorId: 4,
                date: '2024-10-28',
                likes: 312,
                views: 3456,
                comments: 67
            }
        ];
    }

    generateSampleVideos() {
        return [
            {
                id: 1,
                title: 'Résumé du tournoi annuel 2024',
                description: 'Revivez les meilleurs moments de notre tournoi annuel.',
                category: 'competitions',
                thumbnail: '../assets/images/videos/tournoi-thumb.jpg',
                url: 'https://www.youtube.com/watch?v=example1',
                duration: '3:45',
                author: 'Service Communication',
                date: '2024-11-01',
                views: 1250
            }
        ];
    }

    generateSampleAlbums() {
        return [
            {
                id: 1,
                title: 'Saison 2023-2024',
                description: 'Tous les moments forts de la saison.',
                cover: '../assets/images/albums/saison2024.jpg',
                photoCount: 45,
                date: '2024-06-30'
            }
        ];
    }

    initUI() {
        // Mettre à jour l'interface selon les permissions
        this.updateUIForPermissions();
        
        // Afficher la vue par défaut (photos)
        this.showView('photos');
    }

    updateUIForPermissions() {
        // Boutons d'action - VISIBLE UNIQUEMENT POUR ADMIN
        const galleryAdminActions = document.getElementById('galleryAdminActions');
        const footerAdminLink = document.getElementById('footerAdminLink');
        
        if (galleryAdminActions) {
            galleryAdminActions.style.display = this.isAdmin ? 'flex' : 'none';
        }
        
        if (footerAdminLink) {
            footerAdminLink.style.display = this.isAdmin ? 'block' : 'none';
        }
    }

    bindEvents() {
        // Navigation entre les onglets
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const gallery = tab.dataset.gallery;
                this.switchTab(gallery);
                
                // Mettre à jour l'état actif
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
        
        // Filtres par catégorie
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                this.filterByCategory(category);
                
                // Mettre à jour l'état actif
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Bouton d'upload (admin seulement)
        const uploadBtn = document.getElementById('uploadMedia');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isAdmin) {
                    this.openUploadModal();
                } else {
                    this.showNotification('Seuls les administrateurs peuvent ajouter des photos', 'warning');
                }
            });
        }
        
        // Bouton créer album (admin seulement)
        const createAlbumBtn = document.getElementById('createAlbum');
        if (createAlbumBtn) {
            createAlbumBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isAdmin) {
                    this.showNotification('Fonctionnalité de création d\'album bientôt disponible', 'info');
                } else {
                    this.showNotification('Seuls les administrateurs peuvent créer des albums', 'warning');
                }
            });
        }
        
        // Filtre par date
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filterByDate(dateFilter.value);
            });
        }
        
        // Lightbox events
        this.bindLightboxEvents();
        
        // Catégories dans le footer
        document.querySelectorAll('.footer-col a[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                
                // Activer l'onglet photos
                this.switchTab('photos');
                
                // Mettre à jour le bouton de catégorie
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === category);
                });
                
                // Filtrer par catégorie
                setTimeout(() => {
                    this.filterByCategory(category);
                }, 100);
            });
        });
        
        // Fermeture des modals
        this.setupModals();
        
        // Déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                setTimeout(() => this.checkAuth(), 500);
            });
        }
    }

    bindLightboxEvents() {
        // Fermeture de la lightbox
        const lightbox = document.getElementById('lightbox');
        const closeBtn = lightbox?.querySelector('.lightbox-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLightbox());
        }
        
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) this.closeLightbox();
            });
        }
        
        // Navigation
        const prevBtn = lightbox?.querySelector('.lightbox-prev');
        const nextBtn = lightbox?.querySelector('.lightbox-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateLightbox(1));
        }
        
        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (lightbox && lightbox.classList.contains('show')) {
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
                if (e.key === 'ArrowRight') this.navigateLightbox(1);
            }
        });
        
        // Boutons d'édition/suppression dans la lightbox
        const editBtn = document.getElementById('lightboxEditBtn');
        const deleteBtn = document.getElementById('lightboxDeleteBtn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.openEditModal(this.currentPhotoId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deletePhoto(this.currentPhotoId);
            });
        }
    }

    setupModals() {
        // Modal Upload
        const uploadModal = document.getElementById('uploadModal');
        const closeUploadBtn = document.getElementById('closeUploadModal');
        const cancelUploadBtn = document.getElementById('cancelUpload');
        const uploadForm = document.getElementById('uploadForm');
        
        if (closeUploadBtn) {
            closeUploadBtn.addEventListener('click', () => {
                uploadModal.style.display = 'none';
            });
        }
        
        if (cancelUploadBtn) {
            cancelUploadBtn.addEventListener('click', () => {
                uploadModal.style.display = 'none';
            });
        }
        
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpload();
            });
        }
        
        // Modal Edit
        const editModal = document.getElementById('editModal');
        const closeEditBtn = document.getElementById('closeEditModal');
        const cancelEditBtn = document.getElementById('cancelEdit');
        const editForm = document.getElementById('editForm');
        
        if (closeEditBtn) {
            closeEditBtn.addEventListener('click', () => {
                editModal.style.display = 'none';
            });
        }
        
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                editModal.style.display = 'none';
            });
        }
        
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEdit();
            });
        }
        
        // Fermer les modals en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchTab(gallery) {
        this.currentView = gallery;
        
        // Afficher la section correspondante
        document.getElementById('photosGallery').style.display = gallery === 'photos' ? 'block' : 'none';
        document.getElementById('videosGallery').style.display = gallery === 'videos' ? 'block' : 'none';
        document.getElementById('albumsGallery').style.display = gallery === 'albums' ? 'block' : 'none';
        
        // Rendre la vue appropriée
        if (gallery === 'photos') {
            this.renderPhotos();
        } else if (gallery === 'videos') {
            this.renderVideos();
        } else if (gallery === 'albums') {
            this.renderAlbums();
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        this.renderPhotos();
    }

    filterByDate(year) {
        this.currentYear = year === 'all' ? null : parseInt(year);
        this.renderPhotos();
    }

    renderPhotos() {
        const container = document.getElementById('photosGrid');
        if (!container) return;
        
        // Filtrer les photos
        let filteredPhotos = [...this.photos];
        
        // Filtre par catégorie
        if (this.currentCategory !== 'all') {
            filteredPhotos = filteredPhotos.filter(p => p.category === this.currentCategory);
        }
        
        // Filtre par année
        if (this.currentYear) {
            filteredPhotos = filteredPhotos.filter(p => {
                const year = new Date(p.date).getFullYear();
                return year === this.currentYear;
            });
        }
        
        if (filteredPhotos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-images"></i>
                    <h3>Aucune photo trouvée</h3>
                    <p>Essayez de modifier vos critères de filtre</p>
                    ${this.isAdmin ? `
                        <button class="btn btn-primary" onclick="window.galleryManager.openUploadModal()" style="margin-top: 1rem;">
                            <i class="fas fa-upload"></i> Ajouter une photo
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredPhotos.map(photo => this.createPhotoCard(photo)).join('');
    }

    createPhotoCard(photo) {
        const date = window.ManarDate?.format(photo.date) || new Date(photo.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        return `
            <div class="gallery-item" data-id="${photo.id}" data-category="${photo.category}">
                <div class="gallery-image">
                    <img src="${photo.image}" alt="${photo.title}" loading="lazy" 
                         onerror="this.src='../assets/images/default-image.jpg'">
                    <div class="gallery-overlay">
                        <h3>${photo.title}</h3>
                        <p>${photo.description.substring(0, 60)}...</p>
                        <div class="gallery-meta">
                            <span><i class="fas fa-user"></i> ${photo.author}</span>
                            <span><i class="fas fa-calendar"></i> ${date}</span>
                        </div>
                    </div>
                </div>
                ${this.isAdmin ? `
                    <div class="admin-actions">
                        <button class="btn-edit" onclick="event.stopPropagation(); window.galleryManager.editPhoto(${photo.id})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="event.stopPropagation(); window.galleryManager.deletePhoto(${photo.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderVideos() {
        const container = document.getElementById('videosGrid');
        if (!container) return;
        
        if (this.videos.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-video"></i>
                    <h3>Aucune vidéo disponible</h3>
                    <p>Revenez bientôt pour découvrir nos vidéos</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.videos.map(video => `
            <div class="video-card" data-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" onerror="this.src='../assets/images/default-video.jpg'">
                    <span class="video-duration">${video.duration}</span>
                    <button class="video-play" onclick="window.open('${video.url}', '_blank')">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${video.views} vues</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAlbums() {
        const container = document.getElementById('albumsGrid');
        if (!container) return;
        
        if (this.albums.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-images"></i>
                    <h3>Aucun album disponible</h3>
                    <p>Les albums seront bientôt disponibles</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.albums.map(album => `
            <div class="album-card" data-id="${album.id}">
                <div class="album-cover">
                    <img src="${album.cover}" alt="${album.title}" onerror="this.src='../assets/images/default-album.jpg'">
                    <span class="album-count">${album.photoCount} photos</span>
                </div>
                <div class="album-info">
                    <h3>${album.title}</h3>
                    <p>${album.description}</p>
                </div>
            </div>
        `).join('');
    }

    openLightbox(photoId) {
        const photo = this.photos.find(p => p.id == photoId);
        if (!photo) return;
        
        this.currentPhotoId = photoId;
        this.currentPhotos = this.photos;
        this.currentPhotoIndex = this.photos.findIndex(p => p.id == photoId);
        
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDesc = document.getElementById('lightboxDescription');
        const lightboxAuthor = document.getElementById('lightboxAuthor');
        const lightboxDate = document.getElementById('lightboxDate');
        const lightboxCategory = document.getElementById('lightboxCategory');
        const adminActions = document.getElementById('lightboxAdminActions');
        
        if (lightboxImg) lightboxImg.src = photo.image;
        if (lightboxTitle) lightboxTitle.textContent = photo.title;
        if (lightboxDesc) lightboxDesc.textContent = photo.description || '';
        if (lightboxAuthor) lightboxAuthor.innerHTML = `<i class="fas fa-user"></i> ${photo.author}`;
        
        const formattedDate = window.ManarDate?.format(photo.date) || new Date(photo.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        if (lightboxDate) lightboxDate.innerHTML = `<i class="fas fa-calendar"></i> ${formattedDate}`;
        
        // Catégorie
        const categoryNames = {
            'competitions': 'Compétitions',
            'entrainements': 'Entraînements',
            'evenements': 'Événements',
            'equipes': 'Équipes',
            'infrastructures': 'Infrastructures'
        };
        if (lightboxCategory) {
            lightboxCategory.innerHTML = `<i class="fas fa-tag"></i> ${categoryNames[photo.category] || photo.category}`;
        }
        
        // Afficher les actions admin si l'utilisateur est admin
        if (adminActions) {
            adminActions.style.display = this.isAdmin ? 'flex' : 'none';
        }
        
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
        this.currentPhotoId = null;
    }

    navigateLightbox(direction) {
        if (!this.currentPhotos || this.currentPhotos.length === 0) return;
        
        let newIndex = this.currentPhotoIndex + direction;
        
        if (newIndex < 0) {
            newIndex = this.currentPhotos.length - 1;
        } else if (newIndex >= this.currentPhotos.length) {
            newIndex = 0;
        }
        
        const photo = this.currentPhotos[newIndex];
        this.openLightbox(photo.id);
    }

    // ===== FONCTIONS ADMIN =====
    
    openUploadModal() {
        if (!this.isAdmin) {
            this.showNotification('Seuls les administrateurs peuvent ajouter des photos', 'warning');
            return;
        }
        
        const modal = document.getElementById('uploadModal');
        const form = document.getElementById('uploadForm');
        
        if (modal) {
            form.reset();
            modal.style.display = 'block';
        }
    }

    handleUpload() {
        if (!this.isAdmin) return;
        
        const title = document.getElementById('uploadTitle').value;
        const description = document.getElementById('uploadDescription').value;
        const category = document.getElementById('uploadCategory').value;
        const fileInput = document.getElementById('uploadImage');
        
        if (!title || !category || !fileInput.files[0]) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }
        
        // Créer une nouvelle photo
        const newPhoto = {
            id: Date.now(),
            title: title,
            description: description,
            category: category,
            image: '../assets/images/galerie/placeholder.jpg', // En réalité, ce serait l'URL de l'image uploadée
            author: this.currentUser?.prenom + ' ' + this.currentUser?.nom || 'Administrateur',
            authorId: this.currentUser?.id || 0,
            date: new Date().toISOString().split('T')[0],
            likes: 0,
            views: 0,
            comments: 0
        };
        
        this.photos.unshift(newPhoto);
        localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
        
        // Fermer le modal et rafraîchir
        document.getElementById('uploadModal').style.display = 'none';
        this.renderPhotos();
        
        this.showNotification('Photo ajoutée avec succès !', 'success');
    }

    editPhoto(photoId) {
        if (!this.isAdmin) {
            this.showNotification('Vous n\'avez pas les droits pour modifier cette photo', 'error');
            return;
        }
        
        const photo = this.photos.find(p => p.id == photoId);
        if (!photo) return;
        
        const modal = document.getElementById('editModal');
        document.getElementById('editId').value = photo.id;
        document.getElementById('editTitle').value = photo.title;
        document.getElementById('editDescription').value = photo.description || '';
        document.getElementById('editCategory').value = photo.category;
        
        modal.style.display = 'block';
        this.closeLightbox();
    }

    handleEdit() {
        if (!this.isAdmin) return;
        
        const id = parseInt(document.getElementById('editId').value);
        const title = document.getElementById('editTitle').value;
        const description = document.getElementById('editDescription').value;
        const category = document.getElementById('editCategory').value;
        
        const photoIndex = this.photos.findIndex(p => p.id === id);
        if (photoIndex !== -1) {
            this.photos[photoIndex].title = title;
            this.photos[photoIndex].description = description;
            this.photos[photoIndex].category = category;
            
            localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
            
            document.getElementById('editModal').style.display = 'none';
            this.renderPhotos();
            this.showNotification('Photo modifiée avec succès !', 'success');
        }
    }

    deletePhoto(photoId) {
        if (!this.isAdmin) {
            this.showNotification('Vous n\'avez pas les droits pour supprimer cette photo', 'error');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
            this.photos = this.photos.filter(p => p.id != photoId);
            localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
            
            this.closeLightbox();
            this.renderPhotos();
            this.showNotification('Photo supprimée avec succès !', 'success');
        }
    }

    hideLoader() {
        const loader = document.getElementById('photosLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Créer une notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 4px;
            z-index: 10003;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Ajouter l'animation
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.galleryManager = new GalleryManager();
    
    // Gestionnaire d'ouverture de la lightbox
    document.addEventListener('click', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        if (galleryItem && window.galleryManager) {
            const photoId = galleryItem.dataset.id;
            // Ne pas ouvrir si on clique sur les boutons admin
            if (!e.target.closest('.admin-actions')) {
                window.galleryManager.openLightbox(photoId);
            }
        }
    });
});
