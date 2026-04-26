// Galerie publique synchronisee avec le dashboard admin

class PublicGalleryManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.currentView = 'photos';
        this.currentCategory = 'all';
        this.currentYear = null;
        this.photos = [];
        this.videos = [];
        this.albums = [];
        this.currentPhotoId = null;
        this.currentPhotoIndex = -1;
        this.filteredPhotos = [];
    }

    init() {
        this.checkAuth();
        this.loadData();
        this.bindEvents();
        this.switchTab('photos');
    }

    checkAuth() {
        try {
            const session = localStorage.getItem('currentSession');
            this.currentUser = session ? JSON.parse(session) : null;
            const role = this.currentUser?.role || this.currentUser?.userType || '';
            this.isAdmin = role === 'admin';
        } catch (_) {
            this.currentUser = null;
            this.isAdmin = false;
        }

        document.getElementById('galleryAdminActions')?.style.setProperty('display', this.isAdmin ? 'flex' : 'none');
        document.getElementById('footerAdminLink')?.style.setProperty('display', this.isAdmin ? 'block' : 'none');
    }

    readJson(key, fallback) {
        if (window.DS?.get && typeof key === 'string' && key.startsWith('ms_')) {
            const value = window.DS.get(key);
            return value ?? fallback;
        }
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    savePhotos() {
        if (window.DS?.set && window.DS.KEYS?.gallery) {
            window.DS.set(window.DS.KEYS.gallery, this.photos);
        }
        localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
        localStorage.setItem('gallery', JSON.stringify(this.photos));
        localStorage.setItem('ms_gallery', JSON.stringify(this.photos));
    }

    normalizePhoto(photo) {
        return {
            ...photo,
            id: Number(photo.id) || Date.now(),
            title: photo.title || 'Photo',
            description: photo.description || '',
            category: photo.category || 'evenements',
            image: photo.dataUrl || photo.image || '../assets/images/default-image.jpg',
            dataUrl: photo.dataUrl || photo.image || null,
            author: photo.author || 'Administration',
            date: photo.date || new Date().toISOString().split('T')[0],
            likes: Number(photo.likes) || 0,
            views: Number(photo.views) || 0,
            comments: Number(photo.comments) || 0
        };
    }

    loadData() {
        const rawPhotos = this.readJson(window.DS?.KEYS?.gallery || 'ms_gallery', [])
            || this.readJson('gallery', [])
            || this.readJson('galleryPhotos', []);
        this.photos = (rawPhotos.length ? rawPhotos : this.seedPhotos()).map((photo) => this.normalizePhoto(photo));
        if (!rawPhotos.length) {
            this.savePhotos();
        }

        this.videos = this.readJson('galleryVideos', this.seedVideos());
        this.albums = this.readJson('galleryAlbums', this.seedAlbums());
    }

    seedPhotos() {
        return [
            {
                id: 1,
                title: 'Victoire en finale regionale',
                description: 'Notre equipe de football U20 apres la victoire.',
                category: 'competitions',
                image: '../assets/images/galerie/football-victoire.jpg',
                author: 'Karim Benali',
                date: '2024-11-15',
                likes: 245,
                views: 1845,
                comments: 42
            }
        ];
    }

    seedVideos() {
        return [
            {
                id: 1,
                title: 'Resume du tournoi annuel 2024',
                description: 'Revivez les meilleurs moments de notre tournoi annuel.',
                category: 'competitions',
                thumbnail: '../assets/images/default-video.jpg',
                url: 'https://www.youtube.com/',
                duration: '3:45',
                author: 'Service Communication',
                date: '2024-11-01',
                views: 1250
            }
        ];
    }

    seedAlbums() {
        return [
            {
                id: 1,
                title: 'Saison 2023-2024',
                description: 'Tous les moments forts de la saison.',
                cover: '../assets/images/default-album.jpg',
                photoCount: this.photos.length,
                date: '2024-06-30'
            }
        ];
    }

    bindEvents() {
        document.querySelectorAll('.nav-tab[data-gallery]').forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                this.switchTab(tab.dataset.gallery);
            });
        });

        document.querySelectorAll('.category-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                this.currentCategory = button.dataset.category;
                document.querySelectorAll('.category-btn').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                this.renderPhotos();
            });
        });

        document.getElementById('dateFilter')?.addEventListener('change', (event) => {
            this.currentYear = event.target.value === 'all' ? null : Number(event.target.value);
            this.renderPhotos();
        });

        document.getElementById('uploadMedia')?.addEventListener('click', (event) => {
            event.preventDefault();
            if (!this.isAdmin) return this.notify('Seuls les administrateurs peuvent ajouter des photos', 'warning');
            document.getElementById('uploadForm')?.reset();
            document.getElementById('uploadModal').style.display = 'block';
        });

        document.getElementById('createAlbum')?.addEventListener('click', (event) => {
            event.preventDefault();
            this.notify('La creation d albums sera rationalisee ensuite', 'info');
        });

        document.getElementById('uploadForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleUpload();
        });

        document.getElementById('editForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleEdit();
        });

        [
            ['closeUploadModal', 'uploadModal'],
            ['cancelUpload', 'uploadModal'],
            ['closeEditModal', 'editModal'],
            ['cancelEdit', 'editModal']
        ].forEach(([buttonId, modalId]) => {
            document.getElementById(buttonId)?.addEventListener('click', () => {
                document.getElementById(modalId).style.display = 'none';
            });
        });

        document.querySelectorAll('.footer-col a[data-category]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                this.switchTab('photos');
                const category = link.dataset.category;
                const button = document.querySelector(`.category-btn[data-category="${category}"]`);
                if (button) button.click();
            });
        });

        document.addEventListener('click', (event) => {
            const item = event.target.closest('.gallery-item');
            if (item && !event.target.closest('.admin-actions')) {
                this.openLightbox(Number(item.dataset.id));
            }
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        document.querySelector('.lightbox-close')?.addEventListener('click', () => this.closeLightbox());
        document.querySelector('.lightbox-prev')?.addEventListener('click', () => this.navigateLightbox(-1));
        document.querySelector('.lightbox-next')?.addEventListener('click', () => this.navigateLightbox(1));
        document.getElementById('lightboxEditBtn')?.addEventListener('click', () => this.editPhoto(this.currentPhotoId));
        document.getElementById('lightboxDeleteBtn')?.addEventListener('click', () => this.deletePhoto(this.currentPhotoId));

        document.addEventListener('keydown', (event) => {
            const lightbox = document.getElementById('lightbox');
            if (!lightbox?.classList.contains('show')) return;
            if (event.key === 'Escape') this.closeLightbox();
            if (event.key === 'ArrowLeft') this.navigateLightbox(-1);
            if (event.key === 'ArrowRight') this.navigateLightbox(1);
        });

        window.addEventListener('storage', (event) => {
            if (!['galleryPhotos', 'gallery', 'ms_gallery', 'galleryVideos', 'galleryAlbums', 'currentSession', 'ms_session'].includes(event.key)) return;
            this.checkAuth();
            this.loadData();
            this.switchTab(this.currentView);
        });
    }

    switchTab(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-tab[data-gallery]').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.gallery === view);
        });

        document.getElementById('photosGallery').style.display = view === 'photos' ? 'block' : 'none';
        document.getElementById('videosGallery').style.display = view === 'videos' ? 'block' : 'none';
        document.getElementById('albumsGallery').style.display = view === 'albums' ? 'block' : 'none';

        if (view === 'photos') this.renderPhotos();
        if (view === 'videos') this.renderVideos();
        if (view === 'albums') this.renderAlbums();
    }

    getFilteredPhotos() {
        let photos = [...this.photos];
        if (this.currentCategory !== 'all') {
            photos = photos.filter((photo) => photo.category === this.currentCategory);
        }
        if (this.currentYear) {
            photos = photos.filter((photo) => new Date(photo.date).getFullYear() === this.currentYear);
        }
        return photos;
    }

    renderPhotos() {
        const container = document.getElementById('photosGrid');
        if (!container) return;

        this.filteredPhotos = this.getFilteredPhotos();
        if (!this.filteredPhotos.length) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-images"></i>
                    <h3>Aucune photo trouvee</h3>
                    <p>Essayez de modifier vos filtres.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredPhotos.map((photo) => {
            const date = window.ManarDate?.format(photo.date) || new Date(photo.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            return `
                <div class="gallery-item" data-id="${photo.id}" data-category="${photo.category}">
                    <div class="gallery-image">
                        <img src="${photo.dataUrl || photo.image}" alt="${photo.title}" loading="lazy" onerror="this.src='../assets/images/default-image.jpg'">
                        <div class="gallery-overlay">
                            <h3>${photo.title}</h3>
                            <p>${photo.description ? `${photo.description.slice(0, 60)}${photo.description.length > 60 ? '...' : ''}` : ''}</p>
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
        }).join('');
    }

    renderVideos() {
        const container = document.getElementById('videosGrid');
        if (!container) return;
        container.innerHTML = this.videos.map((video) => `
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
                    <div class="video-meta"><span><i class="fas fa-eye"></i> ${video.views} vues</span></div>
                </div>
            </div>
        `).join('');
    }

    renderAlbums() {
        const container = document.getElementById('albumsGrid');
        if (!container) return;
        const albums = this.albums.map((album) => ({
            ...album,
            photoCount: album.photoCount || this.photos.length
        }));
        container.innerHTML = albums.map((album) => `
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
        const index = this.photos.findIndex((photo) => photo.id === photoId);
        if (index === -1) return;

        const photo = this.photos[index];
        this.currentPhotoId = photoId;
        this.currentPhotoIndex = index;

        document.getElementById('lightboxImage').src = photo.dataUrl || photo.image;
        document.getElementById('lightboxTitle').textContent = photo.title;
        document.getElementById('lightboxDescription').textContent = photo.description || '';
        document.getElementById('lightboxAuthor').innerHTML = `<i class="fas fa-user"></i> ${photo.author}`;
        document.getElementById('lightboxDate').innerHTML = `<i class="fas fa-calendar"></i> ${window.ManarDate?.format(photo.date) || new Date(photo.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        document.getElementById('lightboxCategory').innerHTML = `<i class="fas fa-tag"></i> ${photo.category}`;
        document.getElementById('lightboxAdminActions').style.display = this.isAdmin ? 'flex' : 'none';
        document.getElementById('lightbox').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        document.getElementById('lightbox').classList.remove('show');
        document.body.style.overflow = '';
    }

    navigateLightbox(direction) {
        if (!this.photos.length || this.currentPhotoIndex < 0) return;
        let nextIndex = this.currentPhotoIndex + direction;
        if (nextIndex < 0) nextIndex = this.photos.length - 1;
        if (nextIndex >= this.photos.length) nextIndex = 0;
        this.openLightbox(this.photos[nextIndex].id);
    }

    handleUpload() {
        const title = document.getElementById('uploadTitle').value.trim();
        const description = document.getElementById('uploadDescription').value.trim();
        const category = document.getElementById('uploadCategory').value;
        const file = document.getElementById('uploadImage').files[0];

        if (!title || !category || !file) {
            this.notify('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const photo = this.normalizePhoto({
                id: Date.now(),
                title,
                description,
                category,
                image: reader.result,
                dataUrl: reader.result,
                author: `${this.currentUser?.prenom || ''} ${this.currentUser?.nom || ''}`.trim() || 'Administrateur',
                authorId: this.currentUser?.id || 0,
                date: new Date().toISOString().split('T')[0]
            });

            this.photos.unshift(photo);
            this.savePhotos();
            document.getElementById('uploadModal').style.display = 'none';
            this.switchTab('photos');
            this.notify('Photo ajoutee avec succes', 'success');
        };
        reader.readAsDataURL(file);
    }

    editPhoto(photoId) {
        if (!this.isAdmin) return;
        const photo = this.photos.find((item) => item.id === photoId);
        if (!photo) return;
        document.getElementById('editId').value = photo.id;
        document.getElementById('editTitle').value = photo.title;
        document.getElementById('editDescription').value = photo.description || '';
        document.getElementById('editCategory').value = photo.category;
        document.getElementById('editModal').style.display = 'block';
        this.closeLightbox();
    }

    handleEdit() {
        const id = Number(document.getElementById('editId').value);
        const photo = this.photos.find((item) => item.id === id);
        if (!photo) return;
        photo.title = document.getElementById('editTitle').value.trim();
        photo.description = document.getElementById('editDescription').value.trim();
        photo.category = document.getElementById('editCategory').value;
        this.savePhotos();
        document.getElementById('editModal').style.display = 'none';
        this.switchTab(this.currentView);
        this.notify('Photo modifiee avec succes', 'success');
    }

    deletePhoto(photoId) {
        if (!this.isAdmin) return;
        if (!confirm('Supprimer cette photo ?')) return;
        this.photos = this.photos.filter((photo) => photo.id !== photoId);
        this.savePhotos();
        this.closeLightbox();
        this.switchTab(this.currentView);
        this.notify('Photo supprimee', 'success');
    }

    notify(message, type = 'info') {
        if (window.showToast) return window.showToast(message, type);
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.galleryManager = new PublicGalleryManager();
    window.galleryManager.init();
});
