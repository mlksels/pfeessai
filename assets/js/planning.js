// Planning public synchronise avec le dashboard et les reservations

class PlanningManager {
    constructor() {
        this.currentUser = null;
        this.canManageEvents = false;
        this.canBookEvents = false;
        this.currentView = 'calendar';
        this.currentWeekDate = this.startOfWeek(new Date());
        this.currentEventId = null;
        this.currentListSort = 'date';
        this.calendar = null;
        this.events = [];
        this.bookings = [];
        this.hours = Array.from({ length: 17 }, (_, index) => index + 6);

        this.init();
    }

    init() {
        this.checkAuth();
        this.loadData();
        this.initUI();
        this.initCalendar();
        this.bindEvents();
        this.renderAll();
    }

    checkAuth() {
        try {
            this.currentUser = window.getCurrentUser ? window.getCurrentUser() : JSON.parse(localStorage.getItem('currentSession'));
        } catch (_) {
            this.currentUser = null;
        }

        const role = this.currentUser?.role || this.currentUser?.userType || '';
        this.canManageEvents = role === 'admin' || role === 'coach';
        this.canBookEvents = role === 'athlete' || role === 'parent';

        const adminActions = document.getElementById('planningAdminActions');
        if (adminActions) {
            adminActions.style.display = this.canManageEvents ? 'flex' : 'none';
        }
    }

    readList(...keys) {
        for (const key of keys) {
            if (!key) continue;
            try {
                if (window.DS?.get && key.startsWith('ms_')) {
                    const value = window.DS.get(key);
                    if (Array.isArray(value)) return value;
                }

                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            } catch (_) {
                // ignore broken payload and keep searching
            }
        }
        return [];
    }

    loadData() {
        const dashboardEvents = this.readList(window.DS?.KEYS?.events || 'ms_events', 'events');
        const planningEvents = this.readList(window.DS?.KEYS?.planning || 'ms_planning', 'planningEvents');
        const sourceEvents = this.mergeEventSources(dashboardEvents, planningEvents);

        this.events = (sourceEvents.length ? sourceEvents : this.generateFallbackEvents())
            .map((event) => this.normalizeEvent(event))
            .filter(Boolean)
            .sort((left, right) => new Date(left.start) - new Date(right.start));

        this.bookings = this.readList(window.DS?.KEYS?.bookings || 'ms_bookings', 'userBookings');
        this.syncParticipantsWithBookings();
        this.updateCoachFilter();
    }

    mergeEventSources(dashboardEvents, planningEvents) {
        const byId = new Map();

        planningEvents.forEach((event) => {
            const id = Number(event?.id) || `planning-${Math.random()}`;
            byId.set(id, { ...event, id });
        });

        dashboardEvents.forEach((event) => {
            const id = Number(event?.id) || `dashboard-${Math.random()}`;
            const current = byId.get(id) || {};
            byId.set(id, { ...current, ...event, id });
        });

        return Array.from(byId.values());
    }

    generateFallbackEvents() {
        const today = new Date();
        const tomorrow = this.addDays(today, 1);
        const nextWeek = this.addDays(today, 5);

        return [
            {
                id: 1,
                title: 'Entrainement Football U20',
                date: this.formatStorageDate(today),
                start: this.combineDateAndTime(today, '18:00').toISOString(),
                end: this.combineDateAndTime(today, '20:00').toISOString(),
                sport: 'football',
                type: 'training',
                level: 'avance',
                coach: 'Karim Benali',
                location: 'Terrain A',
                description: 'Seance hebdomadaire du groupe U20.',
                maxParticipants: 25,
                participants: 18
            },
            {
                id: 2,
                title: 'Cours de natation',
                date: this.formatStorageDate(tomorrow),
                start: this.combineDateAndTime(tomorrow, '10:00').toISOString(),
                end: this.combineDateAndTime(tomorrow, '11:30').toISOString(),
                sport: 'natation',
                type: 'training',
                level: 'debutant',
                coach: 'Leila Mansour',
                location: 'Piscine',
                description: 'Travail technique et respiration.',
                maxParticipants: 12,
                participants: 7
            },
            {
                id: 3,
                title: 'Match amical basketball',
                date: this.formatStorageDate(nextWeek),
                start: this.combineDateAndTime(nextWeek, '16:00').toISOString(),
                end: this.combineDateAndTime(nextWeek, '18:00').toISOString(),
                sport: 'basketball',
                type: 'competition',
                level: 'intermediaire',
                coach: 'Yasmine Touati',
                location: 'Salle omnisports',
                description: 'Rencontre amicale avec une equipe invitee.',
                maxParticipants: 20,
                participants: 14
            }
        ];
    }

    normalizeEvent(rawEvent) {
        if (!rawEvent || typeof rawEvent !== 'object') return null;

        const schedule = this.extractSchedule(rawEvent.schedule);
        const baseDate = this.parseDateInput(rawEvent.date || rawEvent.start || rawEvent.startDate || rawEvent.eventDate) || new Date();
        const startTime = rawEvent.startTime || this.extractTime(rawEvent.start) || schedule.start || '09:00';
        const endTime = rawEvent.endTime || this.extractTime(rawEvent.end) || schedule.end || this.addMinutesToTime(startTime, 90);
        const start = this.parseDateTime(baseDate, startTime);
        const endBase = this.parseDateInput(rawEvent.endDate || rawEvent.end || rawEvent.date || baseDate) || baseDate;
        let end = this.parseDateTime(endBase, endTime);

        if (!start) return null;
        if (!end || end <= start) {
            end = new Date(start.getTime() + 90 * 60000);
        }

        const participantsBase = Number(rawEvent.registeredBase ?? rawEvent.participants ?? rawEvent.registered ?? 0) || 0;
        const maxParticipants = Number(rawEvent.maxParticipants ?? rawEvent.capacity ?? 0) || 0;
        const sport = this.normalizeSportKey(rawEvent.sport || rawEvent.discipline || rawEvent.category || 'football');
        const type = this.normalizeType(rawEvent.type || 'event');

        return {
            ...rawEvent,
            id: Number(rawEvent.id) || Date.now() + Math.floor(Math.random() * 1000),
            title: rawEvent.title || rawEvent.name || 'Evenement',
            sport,
            type,
            level: rawEvent.level || 'all',
            coach: rawEvent.coach || '',
            location: rawEvent.location || rawEvent.place || '',
            description: rawEvent.description || '',
            start: start.toISOString(),
            end: end.toISOString(),
            startTime: this.formatTime(start),
            endTime: this.formatTime(end),
            date: this.formatStorageDate(start),
            endDate: this.formatStorageDate(end),
            schedule: `${this.formatTime(start)} - ${this.formatTime(end)}`,
            maxParticipants,
            registeredBase: participantsBase,
            participants: participantsBase,
            registered: participantsBase,
            color: rawEvent.color || this.getEventColor(sport, type),
            status: rawEvent.status || 'open'
        };
    }

    normalizeSportKey(value) {
        const sport = String(value || '').trim().toLowerCase();
        const map = {
            football: 'football',
            basketball: 'basketball',
            volleyball: 'volleyball',
            natation: 'natation',
            athletisme: 'athletisme',
            'athlétisme': 'athletisme',
            'athletisme ': 'athletisme',
            'arts martiaux': 'arts-martiaux',
            'arts-martiaux': 'arts-martiaux'
        };
        return map[sport] || sport || 'football';
    }

    normalizeType(value) {
        const type = String(value || '').trim().toLowerCase();
        if (['training', 'competition', 'event', 'meeting', 'workshop'].includes(type)) {
            return type;
        }
        if (type.includes('entrain')) return 'training';
        if (type.includes('compet')) return 'competition';
        if (type.includes('reunion')) return 'meeting';
        return 'event';
    }

    formatSportLabel(sport) {
        const labels = {
            football: 'Football',
            basketball: 'Basketball',
            volleyball: 'Volleyball',
            natation: 'Natation',
            athletisme: 'Athletisme',
            'arts-martiaux': 'Arts martiaux'
        };
        return labels[this.normalizeSportKey(sport)] || 'Sport';
    }

    formatTypeLabel(type) {
        const labels = {
            training: 'Entrainement',
            competition: 'Competition',
            event: 'Evenement',
            meeting: 'Reunion',
            workshop: 'Atelier'
        };
        return labels[this.normalizeType(type)] || 'Evenement';
    }

    getEventColor(sport, type) {
        const typeColors = {
            training: '#3b82f6',
            competition: '#ef4444',
            event: '#10b981',
            meeting: '#f59e0b',
            workshop: '#8b5cf6'
        };
        const sportColors = {
            football: '#2563eb',
            basketball: '#db2777',
            volleyball: '#f59e0b',
            natation: '#0891b2',
            athletisme: '#7c3aed',
            'arts-martiaux': '#dc2626'
        };
        return typeColors[this.normalizeType(type)] || sportColors[this.normalizeSportKey(sport)] || '#64748b';
    }

    initUI() {
        const currentDay = document.getElementById('currentDay');
        if (currentDay && !currentDay.value) {
            currentDay.value = window.ManarDate?.toInputValue(new Date()) || this.formatDisplayDate(new Date());
        }

        const eventDate = document.getElementById('eventDate');
        if (eventDate && !eventDate.value) {
            eventDate.value = window.ManarDate?.toInputValue(new Date()) || this.formatDisplayDate(new Date());
        }
    }

    initCalendar() {
        const calendarElement = document.getElementById('calendar');
        if (!calendarElement || typeof FullCalendar === 'undefined') return;

        this.calendar = new FullCalendar.Calendar(calendarElement, {
            initialView: 'dayGridMonth',
            locale: 'fr',
            height: 'auto',
            firstDay: 1,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            buttonText: {
                today: 'Aujourd hui',
                month: 'Mois',
                week: 'Semaine',
                list: 'Liste'
            },
            eventClick: (info) => {
                info.jsEvent.preventDefault();
                this.showEventDetails(Number(info.event.id));
            }
        });

        this.calendar.render();
        this.renderCalendar();
    }

    bindEvents() {
        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                this.switchView(tab.dataset.view);
            });
        });

        document.getElementById('applyFilters')?.addEventListener('click', () => this.renderAll());
        document.getElementById('resetFilters')?.addEventListener('click', () => this.resetFilters());
        document.getElementById('currentDay')?.addEventListener('change', () => this.loadDailyView());
        document.getElementById('prevDay')?.addEventListener('click', () => this.moveCurrentDay(-1));
        document.getElementById('nextDay')?.addEventListener('click', () => this.moveCurrentDay(1));
        document.getElementById('prevWeek')?.addEventListener('click', () => this.moveCurrentWeek(-7));
        document.getElementById('nextWeek')?.addEventListener('click', () => this.moveCurrentWeek(7));
        document.getElementById('sortByDate')?.addEventListener('click', () => {
            this.currentListSort = 'date';
            this.loadListView();
        });
        document.getElementById('sortBySport')?.addEventListener('click', () => {
            this.currentListSort = 'sport';
            this.loadListView();
        });

        document.getElementById('addEventBtn')?.addEventListener('click', () => this.openAddEventModal());
        document.getElementById('printPlanning')?.addEventListener('click', () => window.print());
        document.getElementById('exportPlanning')?.addEventListener('click', () => this.exportPlanning());

        document.getElementById('closeEventModal')?.addEventListener('click', () => this.closeModal('addEventModal'));
        document.getElementById('cancelEventBtn')?.addEventListener('click', () => this.closeModal('addEventModal'));
        document.getElementById('closeEditModal')?.addEventListener('click', () => this.closeModal('editEventModal'));
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.closeModal('editEventModal'));
        document.getElementById('closeDetailModal')?.addEventListener('click', () => this.closeModal('eventDetailModal'));
        document.getElementById('closeDetailBtn')?.addEventListener('click', () => this.closeModal('eventDetailModal'));
        document.getElementById('editEventFromDetail')?.addEventListener('click', () => {
            if (this.currentEventId) this.openEditModal(this.currentEventId);
        });
        document.getElementById('deleteEventFromDetail')?.addEventListener('click', () => {
            if (this.currentEventId) this.deleteEvent(this.currentEventId);
        });

        document.getElementById('addEventForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleAddEvent();
        });
        document.getElementById('editEventForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleEditEvent();
        });

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        if (window.DS?.on) {
            const refresh = () => {
                this.checkAuth();
                this.loadData();
                this.renderAll();
            };
            window.DS.on(window.DS.KEYS?.events || 'ms_events', refresh);
            window.DS.on(window.DS.KEYS?.planning || 'ms_planning', refresh);
            window.DS.on(window.DS.KEYS?.bookings || 'ms_bookings', refresh);
            window.DS.on(window.DS.KEYS?.session || 'ms_session', refresh);
        }

        window.addEventListener('storage', (event) => {
            if (!['events', 'ms_events', 'planningEvents', 'ms_planning', 'userBookings', 'ms_bookings', 'currentSession', 'ms_session'].includes(event.key)) {
                return;
            }
            this.checkAuth();
            this.loadData();
            this.renderAll();
        });
    }

    switchView(view) {
        this.currentView = view || 'calendar';
        ['calendar', 'weekly', 'daily', 'list'].forEach((name) => {
            const section = document.getElementById(`${name}View`);
            if (!section) return;
            section.classList.toggle('active', name === this.currentView);
            section.style.display = name === this.currentView ? 'block' : 'none';
        });

        document.querySelectorAll('.nav-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.view === this.currentView);
        });

        if (this.currentView === 'weekly') this.loadWeeklyView();
        if (this.currentView === 'daily') this.loadDailyView();
        if (this.currentView === 'list') this.loadListView();
        if (this.currentView === 'calendar') this.renderCalendar();
    }

    renderAll() {
        this.updateCoachFilter();
        this.updateStats();
        this.renderCalendar();

        if (this.currentView === 'weekly') this.loadWeeklyView();
        if (this.currentView === 'daily') this.loadDailyView();
        if (this.currentView === 'list') this.loadListView();
    }

    getFilteredEvents() {
        const sport = document.getElementById('sportFilter')?.value || 'all';
        const level = document.getElementById('levelFilter')?.value || 'all';
        const coach = document.getElementById('coachFilter')?.value || 'all';
        const dateInput = document.getElementById('dateFilter')?.value.trim() || '';
        const selectedDate = this.parseDateInput(dateInput);

        return this.events.filter((event) => {
            if (sport !== 'all' && this.normalizeSportKey(event.sport) !== sport) return false;
            if (level !== 'all' && (event.level || 'all') !== level) return false;
            if (coach !== 'all' && (event.coach || '').toLowerCase() !== coach.toLowerCase()) return false;
            if (selectedDate && this.getDateKey(event.start) !== this.getDateKey(selectedDate)) return false;
            return true;
        });
    }

    renderCalendar() {
        if (!this.calendar) return;
        this.calendar.removeAllEvents();
        this.calendar.addEventSource(this.getFilteredEvents().map((event) => ({
            id: String(event.id),
            title: event.title,
            start: event.start,
            end: event.end,
            classNames: [`fc-event-${event.type}`],
            backgroundColor: event.color,
            borderColor: event.color
        })));
    }

    loadWeeklyView() {
        const weeklyGrid = document.getElementById('weeklyGrid');
        const currentWeek = document.getElementById('currentWeek');
        if (!weeklyGrid) return;

        const weekStart = this.startOfWeek(this.currentWeekDate);
        const days = Array.from({ length: 7 }, (_, index) => this.addDays(weekStart, index));
        const events = this.getFilteredEvents().filter((event) => {
            const date = new Date(event.start);
            return date >= weekStart && date < this.addDays(weekStart, 7);
        });

        if (currentWeek) {
            currentWeek.textContent = `${this.formatDisplayDate(weekStart)} - ${this.formatDisplayDate(this.addDays(weekStart, 6))}`;
        }

        const todayKey = this.getDateKey(new Date());
        const header = `
            <div class="week-days">
                <div class="week-day"></div>
                ${days.map((day) => `
                    <div class="week-day ${this.getDateKey(day) === todayKey ? 'today' : ''}">
                        <div class="week-day-header">
                            <span class="week-day-date">${String(day.getDate()).padStart(2, '0')}</span>
                            <span class="week-day-name">${day.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const body = [];
        this.hours.forEach((hour) => {
            body.push(`<div class="time-slot-header">${String(hour).padStart(2, '0')}:00</div>`);
            days.forEach((day) => {
                const cellEvents = events.filter((event) => {
                    const start = new Date(event.start);
                    return this.getDateKey(start) === this.getDateKey(day) && start.getHours() === hour;
                });

                body.push(`
                    <div class="time-slot-cell">
                        ${cellEvents.map((event) => `
                            <div class="time-slot-event ${event.type}" data-event-id="${event.id}" style="position: relative; display: block; left: auto; right: auto; top: auto; margin-bottom: 4px; background: ${event.color};">
                                <div class="event-title">${this.escapeHtml(event.title)}</div>
                                <span class="event-time">${this.formatTimeRange(event)}</span>
                                <span class="event-sport">${this.escapeHtml(this.formatSportLabel(event.sport))}</span>
                            </div>
                        `).join('')}
                    </div>
                `);
            });
        });

        weeklyGrid.innerHTML = `${header}<div class="week-time-slots">${body.join('')}</div>`;
        this.bindInteractiveEvents(weeklyGrid);
    }

    loadDailyView(dateValue) {
        const timeline = document.getElementById('dailyTimeline');
        const currentDayInput = document.getElementById('currentDay');
        if (!timeline) return;

        const selectedDate = this.parseDateInput(dateValue || currentDayInput?.value) || new Date();
        if (currentDayInput) {
            currentDayInput.value = this.formatDisplayDate(selectedDate);
        }

        const events = this.getFilteredEvents()
            .filter((event) => this.getDateKey(event.start) === this.getDateKey(selectedDate))
            .sort((left, right) => new Date(left.start) - new Date(right.start));

        if (!events.length) {
            timeline.innerHTML = `
                <div class="empty-state" style="text-align:center; padding: 3rem 1rem;">
                    <i class="fas fa-calendar-day" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <h3>Aucun evenement ce jour-la</h3>
                    <p>Essayez un autre jour ou modifiez les filtres.</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = `
            <div class="timeline-hours">
                ${this.hours.map((hour) => {
                    const hourEvents = events.filter((event) => new Date(event.start).getHours() === hour);
                    return `
                        <div class="timeline-hour">
                            <div class="timeline-hour-label">
                                <span class="hour">${String(hour).padStart(2, '0')}:00</span>
                            </div>
                            <div class="timeline-hour-slot ${hourEvents.length ? 'has-event' : ''}">
                                ${hourEvents.map((event) => {
                                    const start = new Date(event.start);
                                    const end = new Date(event.end);
                                    const top = Math.max(0, Math.round((start.getMinutes() / 60) * 50));
                                    const height = Math.max(56, Math.round(((end - start) / 3600000) * 78));
                                    return `
                                        <div class="timeline-event" data-event-id="${event.id}" style="top:${top}px; min-height:${height}px; background:${event.color};">
                                            <div class="timeline-event-header">
                                                <span class="timeline-event-time">${this.formatTimeRange(event)}</span>
                                                <span class="timeline-event-sport">${this.escapeHtml(this.formatSportLabel(event.sport))}</span>
                                            </div>
                                            <div class="timeline-event-title">${this.escapeHtml(event.title)}</div>
                                            <div class="timeline-event-coach"><i class="fas fa-user-tie"></i> ${this.escapeHtml(event.coach || 'Association Manar')}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        this.bindInteractiveEvents(timeline);
    }

    loadListView() {
        const list = document.getElementById('eventsList');
        const pagination = document.getElementById('listPagination');
        if (!list) return;

        const events = [...this.getFilteredEvents()].sort((left, right) => {
            if (this.currentListSort === 'sport') {
                return this.formatSportLabel(left.sport).localeCompare(this.formatSportLabel(right.sport), 'fr');
            }
            return new Date(left.start) - new Date(right.start);
        });

        if (pagination) pagination.innerHTML = '';

        if (!events.length) {
            list.innerHTML = `
                <div class="empty-state" style="text-align:center; padding: 3rem 1rem;">
                    <i class="fas fa-list" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <h3>Aucun evenement a afficher</h3>
                    <p>Essayez de modifier les filtres ou revenez plus tard.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = events.map((event) => {
            const start = new Date(event.start);
            return `
                <div class="event-list-item" data-event-id="${event.id}">
                    <div class="event-list-date">
                        <span class="event-list-day">${String(start.getDate()).padStart(2, '0')}</span>
                        <span class="event-list-month">${start.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    </div>
                    <div class="event-list-details">
                        <div class="event-list-title">${this.escapeHtml(event.title)}</div>
                        <div class="event-list-description">${this.escapeHtml(event.description || 'Aucune description disponible.')}</div>
                    </div>
                    <div class="event-list-info">
                        <div class="event-list-time"><i class="fas fa-clock"></i> ${this.formatTimeRange(event)}</div>
                        <div class="event-list-location"><i class="fas fa-location-dot"></i> ${this.escapeHtml(event.location || 'Lieu a confirmer')}</div>
                    </div>
                    <div class="event-list-sport">
                        <span class="event-sport-badge" style="background:${event.color}; color:#fff;">${this.escapeHtml(this.formatSportLabel(event.sport))}</span>
                        <small>${this.escapeHtml(this.formatTypeLabel(event.type))}</small>
                    </div>
                </div>
            `;
        }).join('');

        this.bindInteractiveEvents(list);
    }

    bindInteractiveEvents(root) {
        root.querySelectorAll('[data-event-id]').forEach((element) => {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const eventId = Number(element.dataset.eventId);
                if (eventId) this.showEventDetails(eventId);
            });
        });
    }

    showEventDetails(eventId) {
        const event = this.events.find((item) => item.id === Number(eventId));
        const body = document.getElementById('eventDetailBody');
        const modal = document.getElementById('eventDetailModal');
        const title = document.getElementById('detailModalTitle');
        const adminActions = document.getElementById('detailAdminActions');
        const footer = document.getElementById('eventDetailFooter');
        if (!event || !body || !modal || !title || !footer) return;

        this.currentEventId = event.id;
        title.innerHTML = `<i class="fas fa-calendar-alt"></i> ${this.escapeHtml(event.title)}`;

        const confirmedBookings = this.getConfirmedBookings(event.id);
        const isBooked = this.isCurrentUserBooked(event.id);
        const slotsText = event.maxParticipants > 0
            ? `${event.participants}/${event.maxParticipants}`
            : `${event.participants}`;

        body.innerHTML = `
            <div class="event-detail-card">
                <div style="display:grid; gap: 14px;">
                    <div><strong>Date :</strong> ${this.formatDisplayDate(event.start)}</div>
                    <div><strong>Horaire :</strong> ${this.escapeHtml(this.formatTimeRange(event))}</div>
                    <div><strong>Sport :</strong> ${this.escapeHtml(this.formatSportLabel(event.sport))}</div>
                    <div><strong>Type :</strong> ${this.escapeHtml(this.formatTypeLabel(event.type))}</div>
                    <div><strong>Coach :</strong> ${this.escapeHtml(event.coach || 'Association Manar')}</div>
                    <div><strong>Lieu :</strong> ${this.escapeHtml(event.location || 'A confirmer')}</div>
                    <div><strong>Participants :</strong> ${slotsText}</div>
                    ${confirmedBookings.length ? `<div><strong>Reservations confirmees :</strong> ${confirmedBookings.length}</div>` : ''}
                    ${event.description ? `<div><strong>Description :</strong><p style="margin-top:8px;">${this.escapeHtml(event.description)}</p></div>` : ''}
                </div>
            </div>
        `;

        adminActions.style.display = this.canManageEvents ? 'flex' : 'none';
        footer.querySelectorAll('.detail-booking-action').forEach((button) => button.remove());

        if (this.canBookEvents) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `btn ${isBooked ? 'btn-secondary' : 'btn-primary'} detail-booking-action`;
            button.textContent = isBooked ? 'Annuler ma reservation' : 'Reserver cette seance';
            button.addEventListener('click', () => {
                if (isBooked) {
                    const booking = confirmedBookings.find((item) => item.userId === this.currentUser?.id);
                    if (booking) this.cancelBooking(booking.id);
                } else {
                    this.bookEvent(event.id);
                }
            });
            footer.insertBefore(button, footer.firstChild);
        }

        modal.style.display = 'block';
    }

    openAddEventModal(prefilledDate) {
        if (!this.canManageEvents) return;
        const form = document.getElementById('addEventForm');
        if (!form) return;

        form.reset();
        document.getElementById('eventDate').value = prefilledDate || this.formatDisplayDate(new Date());
        document.getElementById('eventStartTime').value = '09:00';
        document.getElementById('eventEndTime').value = '10:30';
        document.getElementById('eventMaxParticipants').value = '20';
        document.getElementById('addEventModal').style.display = 'block';
        window.ManarDatePicker?.refresh(document.getElementById('addEventModal'));
    }

    openEditModal(eventId) {
        if (!this.canManageEvents) return;
        const event = this.events.find((item) => item.id === Number(eventId));
        if (!event) return;

        this.currentEventId = event.id;
        document.getElementById('editEventId').value = event.id;
        document.getElementById('editEventTitle').value = event.title;
        document.getElementById('editEventDate').value = this.formatDisplayDate(event.start);
        document.getElementById('editEventStartTime').value = event.startTime;
        document.getElementById('editEventEndTime').value = event.endTime;
        document.getElementById('editEventSport').value = this.normalizeSportKey(event.sport);
        document.getElementById('editEventType').value = this.normalizeType(event.type);
        document.getElementById('editEventLevel').value = event.level || 'all';
        document.getElementById('editEventCoach').value = event.coach || '';
        document.getElementById('editEventLocation').value = event.location || '';
        document.getElementById('editEventDescription').value = event.description || '';
        document.getElementById('editEventMaxParticipants').value = event.maxParticipants || '';
        this.closeModal('eventDetailModal');
        document.getElementById('editEventModal').style.display = 'block';
        window.ManarDatePicker?.refresh(document.getElementById('editEventModal'));
    }

    handleAddEvent() {
        const payload = this.readEventForm('add');
        if (!payload) return;

        const event = this.normalizeEvent({
            ...payload,
            id: Date.now(),
            participants: 0,
            registeredBase: 0
        });

        this.events.push(event);
        this.events.sort((left, right) => new Date(left.start) - new Date(right.start));
        this.saveEvents();
        this.closeModal('addEventModal');
        this.renderAll();
        this.switchView(this.currentView);
        this.notify('Evenement ajoute avec succes.', 'success');
    }

    handleEditEvent() {
        const payload = this.readEventForm('edit');
        if (!payload) return;

        const eventIndex = this.events.findIndex((item) => item.id === Number(payload.id));
        if (eventIndex === -1) return;

        const current = this.events[eventIndex];
        const updated = this.normalizeEvent({
            ...current,
            ...payload,
            registeredBase: current.registeredBase
        });

        this.events.splice(eventIndex, 1, updated);
        this.events.sort((left, right) => new Date(left.start) - new Date(right.start));
        this.saveEvents();
        this.closeModal('editEventModal');
        this.renderAll();
        this.switchView(this.currentView);
        this.notify('Evenement modifie avec succes.', 'success');
    }

    readEventForm(mode) {
        const prefix = mode === 'edit' ? 'editEvent' : 'event';
        const dateValue = document.getElementById(`${prefix}Date`)?.value.trim() || '';
        const startTime = document.getElementById(`${prefix}StartTime`)?.value || '';
        const endTime = document.getElementById(`${prefix}EndTime`)?.value || this.addMinutesToTime(startTime || '09:00', 90);
        const date = this.parseDateInput(dateValue);

        if (!document.getElementById(`${prefix}Title`)?.value.trim()) {
            this.notify('Le titre est obligatoire.', 'warning');
            return null;
        }
        if (!date || !startTime) {
            this.notify('Renseignez une date valide au format dd/mm/yyyy et une heure de debut.', 'warning');
            return null;
        }

        return {
            id: mode === 'edit' ? Number(document.getElementById('editEventId')?.value) : undefined,
            title: document.getElementById(`${prefix}Title`).value.trim(),
            date: this.formatStorageDate(date),
            startTime,
            endTime,
            sport: document.getElementById(`${prefix}Sport`)?.value || 'football',
            type: document.getElementById(`${prefix}Type`)?.value || 'event',
            level: document.getElementById(`${prefix}Level`)?.value || 'all',
            coach: document.getElementById(`${prefix}Coach`)?.value.trim() || '',
            location: document.getElementById(`${prefix}Location`)?.value.trim() || '',
            description: document.getElementById(`${prefix}Description`)?.value.trim() || '',
            maxParticipants: Number(document.getElementById(`${prefix}MaxParticipants`)?.value || 0) || 0
        };
    }

    deleteEvent(eventId) {
        if (!this.canManageEvents) return;
        const event = this.events.find((item) => item.id === Number(eventId));
        if (!event) return;

        if (!window.confirm(`Supprimer "${event.title}" ?`)) return;

        this.events = this.events.filter((item) => item.id !== Number(eventId));
        this.bookings = this.bookings.filter((item) => Number(item.eventId) !== Number(eventId));
        this.saveBookings();
        this.saveEvents();
        this.closeModal('eventDetailModal');
        this.closeModal('editEventModal');
        this.renderAll();
        this.switchView(this.currentView);
        this.notify('Evenement supprime.', 'success');
    }

    bookEvent(eventId) {
        if (!this.canBookEvents || !this.currentUser) {
            this.notify('Connectez-vous avec un compte athlete ou parent pour reserver.', 'warning');
            return;
        }

        const event = this.events.find((item) => item.id === Number(eventId));
        if (!event) return;

        if (this.isCurrentUserBooked(eventId)) {
            this.notify('Vous avez deja reserve cette seance.', 'info');
            return;
        }

        if (event.maxParticipants > 0 && event.participants >= event.maxParticipants) {
            this.notify('Cette seance est complete.', 'warning');
            return;
        }

        this.bookings.push({
            id: Date.now(),
            eventId: event.id,
            userId: this.currentUser.id,
            userName: `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || this.currentUser.email || 'Utilisateur',
            status: 'confirmed',
            createdAt: new Date().toISOString()
        });

        this.saveBookings();
        this.syncParticipantsWithBookings();
        this.saveEvents();
        this.renderAll();
        this.showEventDetails(eventId);
        this.notify('Reservation confirmee.', 'success');
    }

    cancelBooking(bookingId) {
        const booking = this.bookings.find((item) => item.id === Number(bookingId));
        if (!booking) return;

        this.bookings = this.bookings.filter((item) => item.id !== Number(bookingId));
        this.saveBookings();
        this.syncParticipantsWithBookings();
        this.saveEvents();
        this.renderAll();
        this.showEventDetails(booking.eventId);
        this.notify('Reservation annulee.', 'success');
    }

    getConfirmedBookings(eventId) {
        return this.bookings.filter((booking) => Number(booking.eventId) === Number(eventId) && booking.status !== 'cancelled');
    }

    isCurrentUserBooked(eventId) {
        if (!this.currentUser?.id) return false;
        return this.getConfirmedBookings(eventId).some((booking) => Number(booking.userId) === Number(this.currentUser.id));
    }

    syncParticipantsWithBookings() {
        this.events = this.events.map((event) => {
            const confirmedCount = this.getConfirmedBookings(event.id).length;
            const participants = Number(event.registeredBase || 0) + confirmedCount;
            return {
                ...event,
                participants,
                registered: participants
            };
        });
    }

    saveEvents() {
        const eventsPayload = this.events.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            endDate: event.endDate,
            start: event.start,
            end: event.end,
            startTime: event.startTime,
            endTime: event.endTime,
            schedule: event.schedule,
            sport: event.sport,
            type: event.type,
            level: event.level,
            coach: event.coach,
            location: event.location,
            description: event.description,
            maxParticipants: event.maxParticipants,
            participants: event.registeredBase,
            registeredBase: event.registeredBase,
            registered: event.participants,
            status: event.status,
            color: event.color
        }));

        if (window.DS?.set) {
            window.DS.set(window.DS.KEYS.events, eventsPayload);
            window.DS.set(window.DS.KEYS.planning, eventsPayload);
            return;
        }

        localStorage.setItem('events', JSON.stringify(eventsPayload));
        localStorage.setItem('ms_events', JSON.stringify(eventsPayload));
        localStorage.setItem('planningEvents', JSON.stringify(eventsPayload));
        localStorage.setItem('ms_planning', JSON.stringify(eventsPayload));
    }

    saveBookings() {
        if (window.DS?.set && window.DS.KEYS?.bookings) {
            window.DS.set(window.DS.KEYS.bookings, this.bookings);
            return;
        }

        localStorage.setItem('userBookings', JSON.stringify(this.bookings));
        localStorage.setItem('ms_bookings', JSON.stringify(this.bookings));
    }

    updateCoachFilter() {
        const coachFilter = document.getElementById('coachFilter');
        if (!coachFilter) return;

        const currentValue = coachFilter.value || 'all';
        const coaches = [...new Set(this.events.map((event) => (event.coach || '').trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right, 'fr'));
        coachFilter.innerHTML = `
            <option value="all">Tous les coaches</option>
            ${coaches.map((coach) => `<option value="${this.escapeHtmlAttribute(coach)}">${this.escapeHtml(coach)}</option>`).join('')}
        `;
        coachFilter.value = coaches.includes(currentValue) ? currentValue : 'all';
    }

    updateStats() {
        const weekStart = this.startOfWeek(new Date());
        const weekEnd = this.addDays(weekStart, 7);
        const weekEvents = this.events.filter((event) => {
            const date = new Date(event.start);
            return date >= weekStart && date < weekEnd;
        });

        const totalParticipants = weekEvents.reduce((sum, event) => sum + Number(event.participants || 0), 0);
        const totalSessions = weekEvents.length;
        const bySport = weekEvents.reduce((map, event) => {
            const key = this.normalizeSportKey(event.sport);
            map[key] = (map[key] || 0) + Number(event.participants || 0);
            return map;
        }, {});
        const popularSport = Object.entries(bySport).sort((left, right) => right[1] - left[1])[0]?.[0] || '-';
        const capacity = weekEvents.reduce((sum, event) => sum + Number(event.maxParticipants || 0), 0);
        const attendanceRate = capacity > 0 ? Math.round((totalParticipants / capacity) * 100) : 0;

        this.setText('totalParticipants', String(totalParticipants));
        this.setText('totalSessions', String(totalSessions));
        this.setText('mostPopularSport', popularSport === '-' ? '-' : this.formatSportLabel(popularSport));
        this.setText('attendanceRate', `${attendanceRate}%`);
    }

    resetFilters() {
        this.setValue('sportFilter', 'all');
        this.setValue('levelFilter', 'all');
        this.setValue('coachFilter', 'all');
        this.setValue('dateFilter', '');
        this.renderAll();
    }

    moveCurrentDay(offset) {
        const currentDayInput = document.getElementById('currentDay');
        const baseDate = this.parseDateInput(currentDayInput?.value) || new Date();
        const nextDate = this.addDays(baseDate, offset);
        if (currentDayInput) {
            currentDayInput.value = this.formatDisplayDate(nextDate);
        }
        this.loadDailyView(nextDate);
    }

    moveCurrentWeek(offset) {
        this.currentWeekDate = this.addDays(this.currentWeekDate, offset);
        this.loadWeeklyView();
    }

    exportPlanning() {
        const payload = JSON.stringify(this.getFilteredEvents(), null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'planning-manar.json';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }

    notify(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        alert(message);
    }

    setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    parseDateInput(value) {
        if (window.ManarDate?.parse) {
            const parsed = window.ManarDate.parse(value);
            if (parsed) return parsed;
        }

        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    parseDateTime(dateValue, timeValue) {
        const date = this.parseDateInput(dateValue);
        if (!date) return null;
        const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
        date.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
        return date;
    }

    combineDateAndTime(dateValue, timeValue) {
        return this.parseDateTime(dateValue, timeValue) || new Date();
    }

    extractSchedule(schedule) {
        const match = String(schedule || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
        return match ? { start: match[1], end: match[2] } : { start: '', end: '' };
    }

    extractTime(value) {
        const match = String(value || '').match(/T(\d{2}:\d{2})/);
        return match ? match[1] : '';
    }

    addMinutesToTime(timeValue, minutesToAdd) {
        const [hours, minutes] = String(timeValue || '00:00').split(':').map(Number);
        const total = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0) + minutesToAdd;
        const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
        const nextHours = Math.floor(normalized / 60);
        const nextMinutes = normalized % 60;
        return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
    }

    formatTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    formatTimeRange(event) {
        return `${event.startTime || this.formatTime(event.start)} - ${event.endTime || this.formatTime(event.end)}`;
    }

    formatDisplayDate(value) {
        return window.ManarDate?.format(value) || new Date(value).toLocaleDateString('fr-FR');
    }

    formatStorageDate(value) {
        return window.ManarDate?.toStorage(value) || new Date(value).toISOString().split('T')[0];
    }

    getDateKey(value) {
        return this.formatStorageDate(value);
    }

    startOfWeek(value) {
        const date = new Date(value);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        date.setDate(date.getDate() + diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    addDays(value, days) {
        const date = new Date(value);
        date.setDate(date.getDate() + days);
        return date;
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    escapeHtmlAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#96;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.planningManager = new PlanningManager();
});
