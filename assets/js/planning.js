// assets/js/planning.js - Gestion complÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨te du planning avec permissions par rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´le

class PlanningManager {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.isCoach = false;
        this.canManageBookings = false;
        this.currentView = 'calendar';
        this.calendar = null;
        this.events = [];
        this.bookings = [];
        this.filteredEvents = null;
        this.currentWeekDate = new Date();
        this.currentEventId = null;
        
        this.init();
    }

    async init() {
        // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rifier l'utilisateur connectÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©
        this.checkAuth();
        
        // Charger les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es
        await this.loadData();
        
        // Initialiser le calendrier
        this.initCalendar();
        
        // Initialiser l'interface
        this.initUI();
        
        // Lier les ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements
        this.bindEvents();
    }

    checkAuth() {
        try {
            const session = localStorage.getItem('currentSession') || localStorage.getItem('ms_session');
            this.currentUser = null;
            this.isAdmin = false;
            this.isCoach = false;
            this.canManageBookings = false;
            if (session) {
                this.currentUser = JSON.parse(session);
                const role = this.currentUser.role || this.currentUser.userType || '';
                this.isAdmin = role === 'admin';
                this.isCoach = role === 'coach';
                this.canManageBookings = role === 'athlete' || role === 'parent';
            }
        } catch (e) {
            console.error('Erreur vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rification auth:', e);
        }
        
        console.log('Mode admin:', this.isAdmin);
        console.log('Mode coach:', this.isCoach);
    }

    async loadData() {
        try {
            // Charger les ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements depuis localStorage ou utiliser les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©es par dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©faut
            const storedEvents = localStorage.getItem('planningEvents') || localStorage.getItem('ms_planning');
            if (storedEvents) {
                this.events = JSON.parse(storedEvents);
            } else {
                this.events = this.generateSampleEvents();
                localStorage.setItem('planningEvents', JSON.stringify(this.events));
                localStorage.setItem('ms_planning', JSON.stringify(this.events));
            }
            
            // Charger les rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©servations
            const storedBookings = localStorage.getItem('userBookings') || localStorage.getItem('ms_bookings');
            this.bookings = storedBookings ? JSON.parse(storedBookings) : [];
            if (!storedBookings) {
                localStorage.setItem('userBookings', JSON.stringify([]));
                localStorage.setItem('ms_bookings', JSON.stringify([]));
            }
            this.syncParticipantsWithBookings();
        } catch (error) {
            console.error('Erreur chargement planning:', error);
            this.showNotification('Erreur de chargement du planning', 'error');
        }
    }

    generateSampleEvents() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        return [
            {
                id: 1,
                title: 'EntraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement Football U20',
                start: this.formatDate(today, '18:00'),
                end: this.formatDate(today, '20:00'),
                sport: 'football',
                type: 'training',
                level: 'avance',
                coach: 'Mohamed Ali',
                location: 'Terrain A',
                description: 'EntraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement intensif pour les U20',
                maxParticipants: 25,
                participants: 18,
                color: '#4361ee'
            },
            {
                id: 2,
                title: 'Match de Basketball',
                start: this.formatDate(tomorrow, '15:00'),
                end: this.formatDate(tomorrow, '17:00'),
                sport: 'basketball',
                type: 'competition',
                level: 'intermediaire',
                coach: 'Leila Bensalem',
                location: 'Gymnase',
                description: 'Match amical contre l\'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quipe de la ville',
                maxParticipants: 15,
                participants: 12,
                color: '#f72585'
            },
            {
                id: 3,
                title: 'Cours de Natation DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©butants',
                start: this.formatDate(tomorrow, '10:00'),
                end: this.formatDate(tomorrow, '11:30'),
                sport: 'natation',
                type: 'training',
                level: 'debutant',
                coach: 'Karim Benali',
                location: 'Piscine',
                description: 'Apprentissage des bases de la natation',
                maxParticipants: 10,
                participants: 6,
                color: '#4cc9f0'
            },
            {
                id: 4,
                title: 'Tournoi de Volleyball',
                start: this.formatDate(nextWeek, '09:00'),
                end: this.formatDate(nextWeek, '18:00'),
                sport: 'volleyball',
                type: 'competition',
                level: 'all',
                coach: 'Samir Touati',
                location: 'Salle omnisports',
                description: 'Tournoi annuel inter-clubs',
                maxParticipants: 50,
                participants: 32,
                color: '#f8961e'
            }
        ];
    }

    formatDate(date, time) {
        const d = new Date(date);
        const [hours, minutes] = time.split(':');
        d.setHours(parseInt(hours), parseInt(minutes), 0);
        return d.toISOString();
    }

    saveBookings() {
        localStorage.setItem('userBookings', JSON.stringify(this.bookings));
        localStorage.setItem('ms_bookings', JSON.stringify(this.bookings));
    }

    saveEvents() {
        localStorage.setItem('planningEvents', JSON.stringify(this.events));
        localStorage.setItem('ms_planning', JSON.stringify(this.events));
    }

    syncParticipantsWithBookings() {
        const counts = this.bookings.reduce((acc, booking) => {
            acc[booking.eventId] = (acc[booking.eventId] || 0) + 1;
            return acc;
        }, {});

        this.events = this.events.map(event => ({
            ...event,
            participants: counts[event.id] || 0
        }));

        this.saveEvents();
    }

    getCurrentUserBookings() {
        if (!this.currentUser) return [];

        return this.bookings
            .filter(booking => booking.userId === this.currentUser.id)
            .sort((a, b) => new Date(a.start) - new Date(b.start));
    }

    isBooked(eventId) {
        return this.getCurrentUserBookings().some(booking => booking.eventId === eventId);
    }

    getCurrentRole() {
        const role = this.currentUser?.role || this.currentUser?.userType;
        if (role) return role;

        try {
            const rawSession = localStorage.getItem('currentSession') || localStorage.getItem('ms_session');
            if (!rawSession) return '';
            const session = JSON.parse(rawSession);
            return session.role || session.userType || '';
        } catch (_) {
            return '';
        }
    }

    getSportIcon(sport) {
        const icons = {
            football: 'futbol',
            basketball: 'basketball-ball',
            volleyball: 'volleyball-ball',
            natation: 'swimmer',
            athletisme: 'running',
            'arts-martiaux': 'hand-rock'
        };

        return icons[sport] || 'calendar-check';
    }

    renderMyBookings() {
        const container = document.getElementById('myBookings');
        const empty = document.getElementById('noBookingsMessage');
        if (!container || !empty) return;

        const bookings = this.getCurrentUserBookings();
        if (!this.currentUser || !this.canManageBookings || bookings.length === 0) {
            container.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        empty.style.display = 'none';
        container.innerHTML = bookings.map((booking) => {
            const start = new Date(booking.start);
            const end = booking.end ? new Date(booking.end) : null;
            return `
                <article class="booking-card">
                    <div class="booking-sport-icon">
                        <i class="fas fa-${this.getSportIcon(booking.sport)}"></i>
                    </div>
                    <div class="booking-details">
                        <h4>${booking.title}</h4>
                        <p><i class="fas fa-user-tie"></i> ${booking.coach || 'Coach non specifie'}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${booking.location || 'Lieu a definir'}</p>
                    </div>
                    <div class="booking-date">
                        <div class="booking-day">${start.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                        <div class="booking-time">${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${end ? ` - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
                    </div>
                    <div class="booking-status"><span class="status-confirmed">Confirmee</span></div>
                    <div class="booking-actions">
                        <button class="btn-cancel-booking" data-booking-id="${booking.id}">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        container.querySelectorAll('[data-booking-id]').forEach((button) => {
            button.addEventListener('click', () => this.cancelBooking(Number(button.dataset.bookingId)));
        });
    }

    refreshAllViews() {
        const sourceEvents = this.filteredEvents || this.events;

        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(sourceEvents.map((event) => ({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                color: event.color,
                extendedProps: {
                    sport: event.sport,
                    type: event.type,
                    level: event.level,
                    coach: event.coach,
                    location: event.location,
                    description: event.description,
                    maxParticipants: event.maxParticipants,
                    participants: event.participants
                }
            })));
        }

        this.renderMyBookings();
        if (this.currentView === 'weekly') this.loadWeeklyView();
        if (this.currentView === 'daily') this.loadDailyView(document.getElementById('currentDay')?.value);
        if (this.currentView === 'list') this.loadListView();
        this.updateStats();
    }

    bookEvent(eventId) {
        const role = this.getCurrentRole();
        const canBook = !!this.currentUser && role !== 'admin' && role !== 'coach';

        if (!canBook) {
            this.showNotification('Connectez-vous avec un compte athlete ou parent pour reserver', 'warning');
            return;
        }

        const event = this.events.find((item) => item.id === eventId);
        if (!event) return;

        if (this.isBooked(eventId)) {
            this.showNotification('Vous avez deja reserve cette seance', 'info');
            return;
        }

        if ((event.participants || 0) >= (event.maxParticipants || 0)) {
            this.showNotification('Cette seance est complete', 'warning');
            return;
        }

        this.bookings.push({
            id: Date.now(),
            eventId: event.id,
            userId: this.currentUser.id,
            title: event.title,
            sport: event.sport,
            coach: event.coach,
            location: event.location,
            start: event.start,
            end: event.end,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        });

        this.saveBookings();
        this.syncParticipantsWithBookings();
        this.refreshAllViews();
        this.showNotification('Reservation confirmee', 'success');
    }

    cancelBooking(bookingId) {
        this.bookings = this.bookings.filter((booking) => booking.id !== bookingId);
        this.saveBookings();
        this.syncParticipantsWithBookings();
        this.refreshAllViews();
        this.showNotification('Reservation annulee', 'success');
    }

    initUI() {
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour l'interface selon les permissions
        this.updateUIForPermissions();
        
        // Charger les filtres
        this.loadFilters();

        // Afficher les rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©servations utilisateur
        this.renderMyBookings();
        
        // Afficher les statistiques
        this.updateStats();
    }

    updateUIForPermissions() {
        // Actions d'administration - VISIBLES UNIQUEMENT POUR ADMIN
        const adminActions = document.getElementById('planningAdminActions');
        
        if (adminActions) {
            // Les admins et les coaches peuvent voir les actions (mais avec des permissions diffÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rentes)
            adminActions.style.display = (this.isAdmin || this.isCoach) ? 'flex' : 'none';
        }
        
        // Les boutons d'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dition/suppression seront gÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s dans les ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements
    }

    loadFilters() {
        // Charger la liste des coaches pour le filtre
        const coachFilter = document.getElementById('coachFilter');
        if (coachFilter) {
            coachFilter.innerHTML = '<option value="all">Tous les coaches</option>';
            const coaches = [...new Set(this.events.map(e => e.coach).filter(Boolean))];
            coaches.forEach(coach => {
                const option = document.createElement('option');
                option.value = coach;
                option.textContent = coach;
                coachFilter.appendChild(option);
            });
        }
        
        // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©finir la date du jour par dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©faut
        const today = new Date().toISOString().split('T')[0];
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.value = today;
        }
        
        const currentDay = document.getElementById('currentDay');
        if (currentDay) {
            currentDay.value = today;
        }
        
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour l'affichage de la semaine
        this.updateWeekDisplay();
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'fr',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: this.events.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                color: event.color,
                extendedProps: {
                    sport: event.sport,
                    type: event.type,
                    level: event.level,
                    coach: event.coach,
                    location: event.location,
                    description: event.description,
                    maxParticipants: event.maxParticipants,
                    participants: event.participants
                }
            })),
            eventClick: (info) => this.handleEventClick(info),
            dateClick: (info) => this.handleDateClick(info),
            eventDidMount: (info) => this.customizeEventElement(info),
            height: 'auto',
            firstDay: 1,
            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            allDaySlot: false
        });
        
        this.calendar.render();
    }

    customizeEventElement(info) {
        // Ajouter des badges ou des icÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â´nes selon le type d'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement
        const eventEl = info.el;
        const event = info.event;
        
        // Ajouter une classe selon le type
        eventEl.classList.add(`event-type-${event.extendedProps.type}`);
        
        // Afficher le nombre de participants si disponible
        if (event.extendedProps.participants !== undefined) {
            const participantsBadge = document.createElement('span');
            participantsBadge.className = 'event-participants-badge';
            participantsBadge.innerHTML = `<i class="fas fa-users"></i> ${event.extendedProps.participants}/${event.extendedProps.maxParticipants}`;
            participantsBadge.style.cssText = `
                position: absolute;
                bottom: 2px;
                right: 4px;
                font-size: 10px;
                background: rgba(255,255,255,0.3);
                padding: 2px 4px;
                border-radius: 4px;
            `;
            eventEl.querySelector('.fc-event-main')?.appendChild(participantsBadge);
        }
    }

    bindEvents() {
        // Navigation entre les vues
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const view = tab.dataset.view;
                this.switchView(view);
                
                // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour l'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tat actif
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
        
        // Bouton ajout ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement (admin/coach seulement)
        const addEventBtn = document.getElementById('addEventBtn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.isAdmin || this.isCoach) {
                    this.openAddEventModal();
                } else {
                    this.showNotification('Seuls les administrateurs et coaches peuvent ajouter des ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements', 'warning');
                }
            });
        }
        
        // Impression
        const printBtn = document.getElementById('printPlanning');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Export
        const exportBtn = document.getElementById('exportPlanning');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportPlanning();
            });
        }
        
        // Filtres
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        // Navigation semaine
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');
        
        if (prevWeek) {
            prevWeek.addEventListener('click', () => {
                this.navigateWeek(-1);
            });
        }
        
        if (nextWeek) {
            nextWeek.addEventListener('click', () => {
                this.navigateWeek(1);
            });
        }
        
        // Navigation jour
        const prevDay = document.getElementById('prevDay');
        const nextDay = document.getElementById('nextDay');
        const currentDay = document.getElementById('currentDay');
        
        if (prevDay) {
            prevDay.addEventListener('click', () => {
                this.navigateDay(-1);
            });
        }
        
        if (nextDay) {
            nextDay.addEventListener('click', () => {
                this.navigateDay(1);
            });
        }
        
        if (currentDay) {
            currentDay.addEventListener('change', () => {
                this.loadDailyView(currentDay.value);
            });
        }
        
        // Tri
        const sortByDate = document.getElementById('sortByDate');
        const sortBySport = document.getElementById('sortBySport');
        
        if (sortByDate) {
            sortByDate.addEventListener('click', () => {
                this.sortEvents('date');
            });
        }
        
        if (sortBySport) {
            sortBySport.addEventListener('click', () => {
                this.sortEvents('sport');
            });
        }
        
        // Fermeture des modals
        this.setupModals();
        
        // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©connexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                setTimeout(() => this.checkAuth(), 500);
            });
        }

        window.addEventListener('storage', (event) => {
            if (!['planningEvents', 'userBookings', 'currentSession', 'ms_planning', 'ms_bookings', 'ms_session'].includes(event.key)) return;
            this.checkAuth();
            this.loadData().then(() => this.refreshAllViews());
        });
    }

    setupModals() {
        // Modal Ajout
        const addModal = document.getElementById('addEventModal');
        const closeAddBtn = document.getElementById('closeEventModal');
        const cancelAddBtn = document.getElementById('cancelEventBtn');
        const addForm = document.getElementById('addEventForm');
        
        if (closeAddBtn) {
            closeAddBtn.addEventListener('click', () => {
                addModal.style.display = 'none';
            });
        }
        
        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', () => {
                addModal.style.display = 'none';
            });
        }
        
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddEvent();
            });
        }
        
        // Modal DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tails
        const detailModal = document.getElementById('eventDetailModal');
        const closeDetailBtn = document.getElementById('closeDetailModal');
        const closeDetailFooterBtn = document.getElementById('closeDetailBtn');
        
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                detailModal.style.display = 'none';
            });
        }
        
        if (closeDetailFooterBtn) {
            closeDetailFooterBtn.addEventListener('click', () => {
                detailModal.style.display = 'none';
            });
        }
        
        // Boutons d'action dans les dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tails
        const editFromDetail = document.getElementById('editEventFromDetail');
        const deleteFromDetail = document.getElementById('deleteEventFromDetail');
        
        if (editFromDetail) {
            editFromDetail.addEventListener('click', () => {
                this.openEditModal(this.currentEventId);
                detailModal.style.display = 'none';
            });
        }
        
        if (deleteFromDetail) {
            deleteFromDetail.addEventListener('click', () => {
                this.deleteEvent(this.currentEventId);
                detailModal.style.display = 'none';
            });
        }
        
        // Modal Edit
        const editModal = document.getElementById('editEventModal');
        const closeEditBtn = document.getElementById('closeEditModal');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const editForm = document.getElementById('editEventForm');
        
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
                this.handleEditEvent();
            });
        }
        
        // Fermer les modals en cliquant ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  l'extÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rieur
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    switchView(view) {
        this.currentView = view;

        ['calendarView', 'weeklyView', 'dailyView', 'listView'].forEach((id) => {
            const section = document.getElementById(id);
            if (!section) return;
            section.style.display = 'none';
            section.classList.remove('active');
        });

        const activeSection = document.getElementById(view + 'View');
        if (activeSection) {
            activeSection.style.display = 'block';
            activeSection.classList.add('active');
        }

        try {
            if (view === 'calendar') {
                if (this.calendar) {
                    this.calendar.render();
                }
            } else if (view === 'weekly') {
                this.loadWeeklyView();
            } else if (view === 'daily') {
                this.loadDailyView(document.getElementById('currentDay')?.value);
            } else if (view === 'list') {
                this.loadListView();
            }
        } catch (error) {
            console.error('Erreur changement de vue planning:', error);
            this.showNotification('Erreur d affichage de cet onglet du planning', 'error');
        }
    }
    loadWeeklyView() {
        const container = document.getElementById('weeklyGrid');
        if (!container) return;
        
        const sourceEvents = this.filteredEvents || this.events;
        const startOfWeek = this.getStartOfWeek(this.currentWeekDate);
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        let html = '<div class="weekly-header-grid">';
        days.forEach(day => {
            html += `<div class="weekly-day-header">${day}</div>`;
        });
        html += '</div><div class="weekly-body">';
        
        // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er les crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©neaux horaires
        for (let hour = 8; hour <= 22; hour++) {
            html += '<div class="weekly-hour-row">';
            html += `<div class="weekly-hour-label">${hour}:00 - ${hour+1}:00</div>`;
            
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + day);
                currentDate.setHours(hour, 0, 0, 0);
                
                const eventsAtTime = sourceEvents.filter(event => {
                    const eventStart = new Date(event.start);
                    return eventStart.toDateString() === currentDate.toDateString() &&
                           eventStart.getHours() === hour;
                });
                
                html += '<div class="weekly-day-cell">';
                eventsAtTime.forEach(event => {
                    html += this.createWeeklyEventCard(event);
                });
                html += '</div>';
            }
            html += '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.weekly-event').forEach(el => {
            el.addEventListener('click', () => {
                const eventId = parseInt(el.dataset.id);
                this.showEventDetails(eventId);
            });
        });
        this.bindDirectBookingButtons(container);
    }

    createWeeklyEventCard(event) {
        const colors = {
            football: '#4361ee',
            basketball: '#f72585',
            volleyball: '#f8961e',
            natation: '#4cc9f0',
            athletisme: '#7209b7',
            'arts-martiaux': '#e63946'
        };
        
        const color = colors[event.sport] || '#6c757d';
        const role = this.getCurrentRole();
        const canShowBookingAction = role !== 'admin' && role !== 'coach';
        const isBooked = this.isBooked(event.id);
        const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
        
        return `
            <div class="weekly-event" data-id="${event.id}" style="background: ${color}; color: white; padding: 5px; margin: 2px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                <strong>${event.title}</strong>
                <div><small>${event.coach}</small></div>
                ${canShowBookingAction ? `
                    <button type="button" class="direct-booking-btn" data-event-id="${event.id}" style="margin-top:6px;width:100%;border:none;border-radius:4px;padding:4px 6px;font-size:10px;font-weight:700;cursor:pointer;background:${isBooked ? '#fee2e2' : '#fef3c7'};color:${isBooked ? '#b91c1c' : '#92400e'};" ${!this.currentUser || (!isBooked && isFull) ? 'disabled' : ''}>
                        ${!this.currentUser ? 'Connexion requise' : (isBooked ? 'Annuler' : (isFull ? 'Complete' : 'Reserver'))}
                    </button>
                ` : ''}
            </div>
        `;
    }

    loadDailyView(dateStr) {
        const container = document.getElementById('dailyTimeline');
        if (!container) return;
        
        const sourceEvents = this.filteredEvents || this.events;
        const date = dateStr ? new Date(dateStr) : new Date();
        const selectedDate = date.toISOString().split('T')[0];
        
        const eventsOfDay = sourceEvents.filter(event => {
            const eventDate = new Date(event.start).toISOString().split('T')[0];
            return eventDate === selectedDate;
        }).sort((a, b) => new Date(a.start) - new Date(b.start));
        
        if (eventsOfDay.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Aucun ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement ce jour</h3>
                </div>
            `;
            return;
        }
        
        let html = '<div class="timeline">';
        
        eventsOfDay.forEach(event => {
            const start = new Date(event.start);
            const end = event.end ? new Date(event.end) : null;
            const startStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const endStr = end ? end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
            
            html += `
                <div class="timeline-event" data-id="${event.id}" style="cursor: pointer;">
                    <div class="timeline-time">${startStr}${endStr ? ` - ${endStr}` : ""}</div>
                    <div class="timeline-content">
                        <h4>${event.title}</h4>
                        <p><i class="fas fa-user-tie"></i> ${event.coach}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                        <p><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</p>
                        ${(() => {
                            const role = this.getCurrentRole();
                            const canShowBookingAction = role !== 'admin' && role !== 'coach';
                            if (!canShowBookingAction) return '';
                            const isBooked = this.isBooked(event.id);
                            const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
                            return `
                                <button type="button" class="direct-booking-btn" data-event-id="${event.id}" style="margin-top:10px;border:none;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;background:${isBooked ? '#fee2e2' : '#dbeafe'};color:${isBooked ? '#b91c1c' : '#1d4ed8'};" ${!this.currentUser || (!isBooked && isFull) ? 'disabled' : ''}>
                                    ${!this.currentUser ? 'Connexion requise' : (isBooked ? 'Annuler ma reservation' : (isFull ? 'Seance complete' : 'Reserver cette seance'))}
                                </button>
                            `;
                        })()}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Ajouter les ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements de clic
        container.querySelectorAll('.timeline-event').forEach(el => {
            el.addEventListener('click', () => {
                const eventId = parseInt(el.dataset.id);
                this.showEventDetails(eventId);
            });
        });
        this.bindDirectBookingButtons(container);
    }

    loadListView() {
        const container = document.getElementById('eventsList');
        if (!container) return;
        
        const sourceEvents = this.filteredEvents || this.events;
        const sortedEvents = [...sourceEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
        
        if (sortedEvents.length === 0) {
            container.innerHTML = `
                <div class="no-events">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Aucun ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  venir</h3>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        sortedEvents.forEach(event => {
            const date = new Date(event.start).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const time = new Date(event.start).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const colors = {
                football: '#4361ee',
                basketball: '#f72585',
                volleyball: '#f8961e',
                natation: '#4cc9f0',
                athletisme: '#7209b7',
                'arts-martiaux': '#e63946'
            };
            
            const color = colors[event.sport] || '#6c757d';
            
            html += `
                <div class="list-event-card" data-id="${event.id}" style="border-left: 4px solid ${color}; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: var(--box-shadow); cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="margin: 0 0 5px;">${event.title}</h4>
                            <p style="margin: 0; color: var(--gray-600);"><i class="fas fa-calendar"></i> ${date} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  ${time}</p>
                            <p style="margin: 5px 0 0; color: var(--gray-600);"><i class="fas fa-user-tie"></i> ${event.coach}</p>
                        </div>
                        <div>
                            <span class="badge" style="background: ${color}; color: white; padding: 4px 8px; border-radius: 20px; font-size: 12px;">
                                ${event.sport}
                            </span>
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <span style="font-size: 12px; color: var(--gray-500);"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                        <span style="font-size: 12px; color: var(--gray-500);"><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</span>
                    </div>
                    ${(() => {
                        const role = this.getCurrentRole();
                        const canShowBookingAction = role !== 'admin' && role !== 'coach';
                        if (!canShowBookingAction) return '';
                        const isBooked = this.isBooked(event.id);
                        const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
                        return `
                            <div style="margin-top: 12px; display:flex; justify-content:flex-end;">
                                <button type="button" class="direct-booking-btn" data-event-id="${event.id}" style="border:none;border-radius:8px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;background:${isBooked ? '#fee2e2' : '#dbeafe'};color:${isBooked ? '#b91c1c' : '#1d4ed8'};" ${!this.currentUser || (!isBooked && isFull) ? 'disabled' : ''}>
                                    ${!this.currentUser ? 'Connexion requise' : (isBooked ? 'Annuler ma reservation' : (isFull ? 'Seance complete' : 'Reserver cette seance'))}
                                </button>
                            </div>
                        `;
                    })()}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Ajouter les ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements de clic
        container.querySelectorAll('.list-event-card').forEach(el => {
            el.addEventListener('click', () => {
                const eventId = parseInt(el.dataset.id);
                this.showEventDetails(eventId);
            });
        });
        this.bindDirectBookingButtons(container);
    }

    bindDirectBookingButtons(container) {
        container.querySelectorAll('.direct-booking-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const eventId = Number(button.dataset.eventId);
                if (!this.currentUser) {
                    this.showNotification('Connectez-vous pour reserver cette seance', 'warning');
                    return;
                }

                if (this.isBooked(eventId)) {
                    const booking = this.getCurrentUserBookings().find((item) => item.eventId === eventId);
                    if (booking) this.cancelBooking(booking.id);
                } else {
                    this.bookEvent(eventId);
                }
            });
        });
    }

    updateWeekDisplay() {
        const weekSpan = document.getElementById('currentWeek');
        if (!weekSpan) return;
        
        const startOfWeek = this.getStartOfWeek(this.currentWeekDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const startStr = startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const endStr = endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        
        weekSpan.textContent = `${startStr} - ${endStr}`;
    }

    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    navigateWeek(direction) {
        this.currentWeekDate.setDate(this.currentWeekDate.getDate() + (direction * 7));
        this.updateWeekDisplay();
        this.loadWeeklyView();
    }
    navigateDay(direction) {
        const currentDay = document.getElementById('currentDay');
        if (!currentDay) return;
        
        const date = new Date(currentDay.value);
        date.setDate(date.getDate() + direction);
        
        const newDate = date.toISOString().split('T')[0];
        currentDay.value = newDate;
        this.loadDailyView(newDate);
    }

    sortEvents(criteria) {
        if (criteria === 'date') {
            this.events.sort((a, b) => new Date(a.start) - new Date(b.start));
        } else if (criteria === 'sport') {
            this.events.sort((a, b) => a.sport.localeCompare(b.sport));
        }
        
        this.loadListView();
        this.showNotification('Liste triÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©e avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s', 'success');
    }

    applyFilters() {
        const sport = document.getElementById('sportFilter').value;
        const level = document.getElementById('levelFilter').value;
        const coach = document.getElementById('coachFilter').value;
        const date = document.getElementById('dateFilter').value;
        
        let filteredEvents = [...this.events];
        
        if (sport !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.sport === sport);
        }
        
        if (level !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.level === level || e.level === 'all');
        }
        
        if (coach !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.coach === coach);
        }
        
        if (date) {
            filteredEvents = filteredEvents.filter(e => {
                const eventDate = new Date(e.start).toISOString().split('T')[0];
                return eventDate === date;
            });
        }
        
        this.filteredEvents = filteredEvents;

        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour l'affichage selon la vue actuelle
        if (this.currentView === 'calendar' && this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(filteredEvents);
        } else if (this.currentView === 'weekly') {
            this.loadWeeklyView();
        } else if (this.currentView === 'daily') {
            this.loadDailyView(date);
        } else if (this.currentView === 'list') {
            this.loadListView();
        }
        
        this.showNotification('Filtres appliquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s', 'success');
    }

    resetFilters() {
        document.getElementById('sportFilter').value = 'all';
        document.getElementById('levelFilter').value = 'all';
        document.getElementById('coachFilter').value = 'all';
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dateFilter').value = today;
        
        this.filteredEvents = null;
        this.loadData();
        this.refreshAllViews();
        
        this.showNotification('Filtres rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©initialisÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s', 'success');
    }

    handleEventClick(info) {
        const eventId = parseInt(info.event.id);
        this.showEventDetails(eventId);
    }

    handleDateClick(info) {
        // Si l'utilisateur est admin ou coach, on peut proposer d'ajouter un ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  cette date
        if (this.isAdmin || this.isCoach) {
            if (confirm(`Voulez-vous ajouter un ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement le ${info.dateStr} ?`)) {
                this.openAddEventModal(info.dateStr);
            }
        }
    }

    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        this.currentEventId = eventId;
        
        const modal = document.getElementById('eventDetailModal');
        const body = document.getElementById('eventDetailBody');
        const adminActions = document.getElementById('detailAdminActions');
        const footer = document.getElementById('eventDetailFooter');
        
        const startDate = new Date(event.start);
        const endDate = event.end ? new Date(event.end) : null;
        
        const dateStr = startDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const startTime = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endTime = endDate ? endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        
        const typeLabels = {
            training: 'EntraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®nement',
            competition: 'CompÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tition',
            event: 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement',
            meeting: 'RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©union'
        };
        
        const levelLabels = {
            all: 'Tous niveaux',
            debutant: 'DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©butant',
            intermediaire: 'IntermÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©diaire',
            avance: 'AvancÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'
        };
        
        const role = this.getCurrentRole();
        const canShowBookingAction = role !== 'admin' && role !== 'coach';
        const isBooked = this.isBooked(eventId);
        const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
        const buttonLabel = !this.currentUser
            ? 'Se connecter pour reserver'
            : (isBooked ? 'Annuler ma reservation' : (isFull ? 'Seance complete' : 'Reserver cette seance'));

        body.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-color); margin-bottom: 15px;">${event.title}</h4>
                
                <div style="display: grid; gap: 15px;">
                    <div><i class="fas fa-calendar" style="width: 25px; color: var(--primary-color);"></i> <strong>Date:</strong> ${dateStr}</div>
                    <div><i class="fas fa-clock" style="width: 25px; color: var(--primary-color);"></i> <strong>Horaire:</strong> ${startTime} - ${endTime}</div>
                    <div><i class="fas fa-tag" style="width: 25px; color: var(--primary-color);"></i> <strong>Sport:</strong> ${event.sport}</div>
                    <div><i class="fas fa-info-circle" style="width: 25px; color: var(--primary-color);"></i> <strong>Type:</strong> ${typeLabels[event.type] || event.type}</div>
                    <div><i class="fas fa-signal" style="width: 25px; color: var(--primary-color);"></i> <strong>Niveau:</strong> ${levelLabels[event.level] || event.level}</div>
                    <div><i class="fas fa-user-tie" style="width: 25px; color: var(--primary-color);"></i> <strong>Coach:</strong> ${event.coach || 'Non spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'}</div>
                    <div><i class="fas fa-map-marker-alt" style="width: 25px; color: var(--primary-color);"></i> <strong>Lieu:</strong> ${event.location || 'Non spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'}</div>
                    <div><i class="fas fa-users" style="width: 25px; color: var(--primary-color);"></i> <strong>Participants:</strong> ${event.participants || 0}/${event.maxParticipants || 'IllimitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©'}</div>
                </div>
                
                ${event.description ? `
                    <div style="margin-top: 20px;">
                        <h5 style="margin-bottom: 10px;">Description:</h5>
                        <p style="color: var(--gray-600); line-height: 1.5;">${event.description}</p>
                    </div>
                ` : ''}

                ${canShowBookingAction ? `
                    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end;">
                        <button type="button" id="bookingActionBtn" class="btn ${isBooked ? 'btn-danger' : 'btn-primary'}" ${!this.currentUser || (!isBooked && isFull) ? 'disabled' : ''}>
                            <i class="fas fa-${!this.currentUser ? 'lock' : (isBooked ? 'calendar-times' : 'calendar-check')}"></i>
                            ${buttonLabel}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        const persistentBookingButton = document.getElementById('persistentBookingActionBtn');

        // Afficher les actions admin si l'utilisateur est admin ou coach
        if (adminActions) {
            adminActions.style.display = (this.isAdmin || this.isCoach) ? 'flex' : 'none';
        }

        if (persistentBookingButton) {
            if (canShowBookingAction) {
                persistentBookingButton.style.display = 'inline-flex';
                persistentBookingButton.className = `btn ${isBooked ? 'btn-danger' : 'btn-primary'}`;
                persistentBookingButton.disabled = !this.currentUser || (!isBooked && isFull);
                persistentBookingButton.innerHTML = `
                    <i class="fas fa-${!this.currentUser ? 'lock' : (isBooked ? 'calendar-times' : 'calendar-check')}"></i>
                    ${buttonLabel}
                `;
            } else {
                persistentBookingButton.style.display = 'none';
            }
        }

        const bookingButton = document.getElementById('bookingActionBtn');
        if (bookingButton) {
            bookingButton.addEventListener('click', () => {
                if (this.isBooked(eventId)) {
                    const booking = this.getCurrentUserBookings().find((item) => item.eventId === eventId);
                    if (booking) this.cancelBooking(booking.id);
                } else {
                    this.bookEvent(eventId);
                }
                modal.style.display = 'none';
            });
        }

        if (persistentBookingButton && canShowBookingAction) {
            persistentBookingButton.onclick = () => {
                if (this.isBooked(eventId)) {
                    const booking = this.getCurrentUserBookings().find((item) => item.eventId === eventId);
                    if (booking) this.cancelBooking(booking.id);
                } else {
                    this.bookEvent(eventId);
                }
                modal.style.display = 'none';
            };
        }
        
        modal.style.display = 'block';
    }

    openAddEventModal(dateStr) {
        if (!this.isAdmin && !this.isCoach) {
            this.showNotification('Vous n\'avez pas les droits pour ajouter des ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements', 'error');
            return;
        }
        
        const modal = document.getElementById('addEventModal');
        const form = document.getElementById('addEventForm');
        
        if (dateStr) {
            document.getElementById('eventDate').value = dateStr;
        }
        
        if (modal) {
            form.reset();
            if (!dateStr) {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('eventDate').value = today;
            }
            modal.style.display = 'block';
        }
    }

    handleAddEvent() {
        if (!this.isAdmin && !this.isCoach) return;
        
        const title = document.getElementById('eventTitle').value;
        const date = document.getElementById('eventDate').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        const sport = document.getElementById('eventSport').value;
        const type = document.getElementById('eventType').value;
        const level = document.getElementById('eventLevel').value;
        const coach = document.getElementById('eventCoach').value;
        const location = document.getElementById('eventLocation').value;
        const description = document.getElementById('eventDescription').value;
        const maxParticipants = document.getElementById('eventMaxParticipants').value;
        
        if (!title || !date || !startTime || !sport || !type) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
            return;
        }
        
        const start = new Date(date + 'T' + startTime);
        const end = endTime ? new Date(date + 'T' + endTime) : null;
        
        const colors = {
            football: '#4361ee',
            basketball: '#f72585',
            volleyball: '#f8961e',
            natation: '#4cc9f0',
            athletisme: '#7209b7',
            'arts-martiaux': '#e63946'
        };
        
        const newEvent = {
            id: Date.now(),
            title: title,
            start: start.toISOString(),
            end: end ? end.toISOString() : null,
            sport: sport,
            type: type,
            level: level,
            coach: coach || 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©terminer',
            location: location || 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©finir',
            description: description || '',
            maxParticipants: parseInt(maxParticipants) || 20,
            participants: 0,
            color: colors[sport] || '#6c757d'
        };
        
        this.events.push(newEvent);
        localStorage.setItem('planningEvents', JSON.stringify(this.events));
        
        // Fermer le modal
        document.getElementById('addEventModal').style.display = 'none';
        
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour le calendrier
        if (this.calendar) {
            this.calendar.addEvent({
                id: newEvent.id,
                title: newEvent.title,
                start: newEvent.start,
                end: newEvent.end,
                color: newEvent.color,
                extendedProps: {
                    sport: newEvent.sport,
                    type: newEvent.type,
                    level: newEvent.level,
                    coach: newEvent.coach,
                    location: newEvent.location,
                    description: newEvent.description,
                    maxParticipants: newEvent.maxParticipants,
                    participants: newEvent.participants
                }
            });
        }
        
        // Recharger les vues
        if (this.currentView === 'weekly') this.loadWeeklyView();
        if (this.currentView === 'daily') this.loadDailyView(date);
        if (this.currentView === 'list') this.loadListView();
        
        this.updateStats();
        
        this.showNotification('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement ajoutÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s !', 'success');
    }

    openEditModal(eventId) {
        if (!this.isAdmin && !this.isCoach) {
            this.showNotification('Vous n\'avez pas les droits pour modifier des ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements', 'error');
            return;
        }
        
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const startDate = new Date(event.start);
        const dateStr = startDate.toISOString().split('T')[0];
        const startTime = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        let endTime = '';
        if (event.end) {
            const endDate = new Date(event.end);
            endTime = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        
        document.getElementById('editEventId').value = event.id;
        document.getElementById('editEventTitle').value = event.title;
        document.getElementById('editEventDate').value = dateStr;
        document.getElementById('editEventStartTime').value = startTime;
        document.getElementById('editEventEndTime').value = endTime;
        document.getElementById('editEventSport').value = event.sport;
        document.getElementById('editEventType').value = event.type;
        document.getElementById('editEventLevel').value = event.level || 'all';
        document.getElementById('editEventCoach').value = event.coach || '';
        document.getElementById('editEventLocation').value = event.location || '';
        document.getElementById('editEventDescription').value = event.description || '';
        document.getElementById('editEventMaxParticipants').value = event.maxParticipants || 20;
        
        document.getElementById('editEventModal').style.display = 'block';
    }

    handleEditEvent() {
        if (!this.isAdmin && !this.isCoach) return;
        
        const id = parseInt(document.getElementById('editEventId').value);
        const title = document.getElementById('editEventTitle').value;
        const date = document.getElementById('editEventDate').value;
        const startTime = document.getElementById('editEventStartTime').value;
        const endTime = document.getElementById('editEventEndTime').value;
        const sport = document.getElementById('editEventSport').value;
        const type = document.getElementById('editEventType').value;
        const level = document.getElementById('editEventLevel').value;
        const coach = document.getElementById('editEventCoach').value;
        const location = document.getElementById('editEventLocation').value;
        const description = document.getElementById('editEventDescription').value;
        const maxParticipants = document.getElementById('editEventMaxParticipants').value;
        
        const eventIndex = this.events.findIndex(e => e.id === id);
        if (eventIndex === -1) return;
        
        const start = new Date(date + 'T' + startTime);
        const end = endTime ? new Date(date + 'T' + endTime) : null;
        
        const colors = {
            football: '#4361ee',
            basketball: '#f72585',
            volleyball: '#f8961e',
            natation: '#4cc9f0',
            athletisme: '#7209b7',
            'arts-martiaux': '#e63946'
        };
        
        this.events[eventIndex] = {
            ...this.events[eventIndex],
            title: title,
            start: start.toISOString(),
            end: end ? end.toISOString() : null,
            sport: sport,
            type: type,
            level: level,
            coach: coach || 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©terminer',
            location: location || 'ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©finir',
            description: description || '',
            maxParticipants: parseInt(maxParticipants) || 20,
            color: colors[sport] || '#6c757d'
        };
        
        localStorage.setItem('planningEvents', JSON.stringify(this.events));
        
        // Fermer le modal
        document.getElementById('editEventModal').style.display = 'none';
        
        // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour le calendrier
        if (this.calendar) {
            const event = this.calendar.getEventById(id);
            if (event) {
                event.setProp('title', title);
                event.setStart(start);
                event.setEnd(end);
                event.setProp('color', colors[sport] || '#6c757d');
                event.setExtendedProp('sport', sport);
                event.setExtendedProp('type', type);
                event.setExtendedProp('level', level);
                event.setExtendedProp('coach', coach);
                event.setExtendedProp('location', location);
                event.setExtendedProp('description', description);
                event.setExtendedProp('maxParticipants', parseInt(maxParticipants));
            }
        }
        
        // Recharger les vues
        if (this.currentView === 'weekly') this.loadWeeklyView();
        if (this.currentView === 'daily') this.loadDailyView(date);
        if (this.currentView === 'list') this.loadListView();
        
        this.showNotification('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement modifiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s !', 'success');
    }

    deleteEvent(eventId) {
        if (!this.isAdmin && !this.isCoach) {
            this.showNotification('Vous n\'avez pas les droits pour supprimer des ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nements', 'error');
            return;
        }
        
        if (confirm('ÃƒÆ’Ã†â€™Ãƒâ€¦Ã‚Â tes-vous sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â»r de vouloir supprimer cet ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement ?')) {
            this.events = this.events.filter(e => e.id !== eventId);
            localStorage.setItem('planningEvents', JSON.stringify(this.events));
            
            // Supprimer du calendrier
            if (this.calendar) {
                const event = this.calendar.getEventById(eventId);
                if (event) {
                    event.remove();
                }
            }
            
            // Recharger les vues
            if (this.currentView === 'weekly') this.loadWeeklyView();
            if (this.currentView === 'daily') this.loadDailyView();
            if (this.currentView === 'list') this.loadListView();
            
            this.updateStats();
            
            this.showNotification('ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nement supprimÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s !', 'success');
        }
    }

    updateStats() {
        const totalParticipants = this.events.reduce((sum, e) => sum + (e.participants || 0), 0);
        document.getElementById('totalParticipants').textContent = totalParticipants;
        document.getElementById('totalSessions').textContent = this.events.length;
        
        // Sport le plus populaire
        const sportCounts = {};
        this.events.forEach(e => {
            sportCounts[e.sport] = (sportCounts[e.sport] || 0) + 1;
        });
        
        let mostPopular = '-';
        let maxCount = 0;
        for (const [sport, count] of Object.entries(sportCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostPopular = sport;
            }
        }
        document.getElementById('mostPopularSport').textContent = mostPopular;
        
        // Taux de frÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©quentation moyen
        const totalCapacity = this.events.reduce((sum, e) => sum + (e.maxParticipants || 20), 0);
        const attendanceRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0;
        document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    }

    exportPlanning() {
        const dataStr = JSON.stringify(this.events, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `planning_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('Planning exportÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© avec succÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨s', 'success');
    }

    showNotification(message, type = 'info') {
        // CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©er une notification
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
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.planningManager = new PlanningManager();
});
