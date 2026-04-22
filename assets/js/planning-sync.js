(function () {
    function patchPlanningManager() {
        const manager = window.planningManager;
        if (!manager || manager.__bookingSyncPatched) return;

        manager.__bookingSyncPatched = true;
        manager.canManageBookings = ['athlete', 'parent'].includes((manager.currentUser?.role || manager.currentUser?.userType || ''));
        manager.filteredEvents = null;
        manager.currentWeekDate = manager.currentWeekDate || new Date();

        manager.readBookings = function () {
            try {
                return JSON.parse(localStorage.getItem('userBookings') || '[]');
            } catch (_) {
                return [];
            }
        };

        manager.writeBookings = function () {
            localStorage.setItem('userBookings', JSON.stringify(this.bookings || []));
        };

        manager.syncParticipantsWithBookings = function () {
            this.bookings = this.readBookings();
            const counts = this.bookings.reduce((acc, booking) => {
                acc[booking.eventId] = (acc[booking.eventId] || 0) + 1;
                return acc;
            }, {});

            this.events = this.events.map((event) => ({
                ...event,
                participants: counts[event.id] || 0
            }));

            localStorage.setItem('planningEvents', JSON.stringify(this.events));
        };

        manager.getCurrentUserBookings = function () {
            if (!this.currentUser) return [];
            return (this.bookings || [])
                .filter((booking) => booking.userId === this.currentUser.id)
                .sort((a, b) => new Date(a.start) - new Date(b.start));
        };

        manager.isBooked = function (eventId) {
            return this.getCurrentUserBookings().some((booking) => booking.eventId === eventId);
        };

        manager.getSportIcon = function (sport) {
            return {
                football: 'futbol',
                basketball: 'basketball-ball',
                volleyball: 'volleyball-ball',
                natation: 'swimmer',
                athletisme: 'running',
                'arts-martiaux': 'hand-rock'
            }[sport] || 'calendar-check';
        };

        manager.renderMyBookings = function () {
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
        };

        manager.refreshAllViews = function () {
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
        };

        manager.loadWeeklyView = function () {
            const container = document.getElementById('weeklyGrid');
            if (!container) return;

            const sourceEvents = this.filteredEvents || this.events;
            const startOfWeek = this.getStartOfWeek(this.currentWeekDate);
            const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

            let html = '<div class="weekly-header-grid">';
            days.forEach((day) => { html += `<div class="weekly-day-header">${day}</div>`; });
            html += '</div><div class="weekly-body">';

            for (let hour = 8; hour <= 22; hour++) {
                html += '<div class="weekly-hour-row">';
                html += `<div class="weekly-hour-label">${hour}:00 - ${hour + 1}:00</div>`;
                for (let day = 0; day < 7; day++) {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + day);
                    currentDate.setHours(hour, 0, 0, 0);
                    const eventsAtTime = sourceEvents.filter((event) => {
                        const eventStart = new Date(event.start);
                        return eventStart.toDateString() === currentDate.toDateString() && eventStart.getHours() === hour;
                    });

                    html += '<div class="weekly-day-cell">';
                    eventsAtTime.forEach((event) => { html += this.createWeeklyEventCard(event); });
                    html += '</div>';
                }
                html += '</div>';
            }

            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('.weekly-event').forEach((element) => {
                element.addEventListener('click', () => this.showEventDetails(Number(element.dataset.id)));
            });
            if (typeof this.bindDirectBookingButtons === 'function') {
                this.bindDirectBookingButtons(container);
            }
        };

        manager.loadDailyView = function (dateStr) {
            const container = document.getElementById('dailyTimeline');
            if (!container) return;

            const sourceEvents = this.filteredEvents || this.events;
            const date = dateStr ? new Date(dateStr) : new Date();
            const selectedDate = date.toISOString().split('T')[0];
            const eventsOfDay = sourceEvents
                .filter((event) => new Date(event.start).toISOString().split('T')[0] === selectedDate)
                .sort((a, b) => new Date(a.start) - new Date(b.start));

            if (!eventsOfDay.length) {
                container.innerHTML = '<div class="no-events"><i class="fas fa-calendar-times"></i><h3>Aucun evenement ce jour</h3></div>';
                return;
            }

            let html = '<div class="timeline">';
            eventsOfDay.forEach((event) => {
                const start = new Date(event.start);
                const end = event.end ? new Date(event.end) : null;
                const role = this.getCurrentRole ? this.getCurrentRole() : (this.currentUser?.role || this.currentUser?.userType || '');
                const canShowBookingAction = role !== 'admin' && role !== 'coach';
                const isBooked = this.isBooked ? this.isBooked(event.id) : false;
                const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
                html += `
                    <div class="timeline-event" data-id="${event.id}" style="cursor: pointer;">
                        <div class="timeline-time">${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${end ? ` - ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
                        <div class="timeline-content">
                            <h4>${event.title}</h4>
                            <p><i class="fas fa-user-tie"></i> ${event.coach}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                            <p><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</p>
                            ${canShowBookingAction ? `
                                <button type="button" class="direct-booking-btn" data-event-id="${event.id}" style="margin-top:10px;border:none;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;background:${isBooked ? '#fee2e2' : '#dbeafe'};color:${isBooked ? '#b91c1c' : '#1d4ed8'};" ${!this.currentUser || (!isBooked && isFull) ? 'disabled' : ''}>
                                    ${!this.currentUser ? 'Connexion requise' : (isBooked ? 'Annuler ma reservation' : (isFull ? 'Seance complete' : 'Reserver cette seance'))}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('.timeline-event').forEach((element) => {
                element.addEventListener('click', () => this.showEventDetails(Number(element.dataset.id)));
            });
            if (typeof this.bindDirectBookingButtons === 'function') {
                this.bindDirectBookingButtons(container);
            }
        };

        manager.loadListView = function () {
            const container = document.getElementById('eventsList');
            if (!container) return;

            const sourceEvents = this.filteredEvents || this.events;
            const sortedEvents = [...sourceEvents].sort((a, b) => new Date(a.start) - new Date(b.start));

            if (!sortedEvents.length) {
                container.innerHTML = '<div class="no-events"><i class="fas fa-calendar-times"></i><h3>Aucun evenement a venir</h3></div>';
                return;
            }

            container.innerHTML = sortedEvents.map((event) => `
                <div class="list-event-card" data-id="${event.id}" style="border-left: 4px solid ${event.color}; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: var(--box-shadow); cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="margin: 0 0 5px;">${event.title}</h4>
                            <p style="margin: 0; color: var(--gray-600);"><i class="fas fa-calendar"></i> ${new Date(event.start).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a ${new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p style="margin: 5px 0 0; color: var(--gray-600);"><i class="fas fa-user-tie"></i> ${event.coach}</p>
                        </div>
                        <div>
                            <span class="badge" style="background: ${event.color}; color: white; padding: 4px 8px; border-radius: 20px; font-size: 12px;">${event.sport}</span>
                        </div>
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <span style="font-size: 12px; color: var(--gray-500);"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                        <span style="font-size: 12px; color: var(--gray-500);"><i class="fas fa-users"></i> ${event.participants}/${event.maxParticipants}</span>
                    </div>
                    ${(() => {
                        const role = this.getCurrentRole ? this.getCurrentRole() : (this.currentUser?.role || this.currentUser?.userType || '');
                        const canShowBookingAction = role !== 'admin' && role !== 'coach';
                        if (!canShowBookingAction) return '';
                        const isBooked = this.isBooked ? this.isBooked(event.id) : false;
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
            `).join('');

            container.querySelectorAll('.list-event-card').forEach((element) => {
                element.addEventListener('click', () => this.showEventDetails(Number(element.dataset.id)));
            });
            if (typeof this.bindDirectBookingButtons === 'function') {
                this.bindDirectBookingButtons(container);
            }
        };

        manager.updateWeekDisplay = function () {
            const weekSpan = document.getElementById('currentWeek');
            if (!weekSpan) return;
            const startOfWeek = this.getStartOfWeek(this.currentWeekDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            weekSpan.textContent = `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        };

        manager.navigateWeek = function (direction) {
            this.currentWeekDate.setDate(this.currentWeekDate.getDate() + (direction * 7));
            this.updateWeekDisplay();
            this.loadWeeklyView();
        };

        manager.applyFilters = function () {
            const sport = document.getElementById('sportFilter')?.value || 'all';
            const level = document.getElementById('levelFilter')?.value || 'all';
            const coach = document.getElementById('coachFilter')?.value || 'all';
            const date = document.getElementById('dateFilter')?.value || '';

            let filteredEvents = [...this.events];
            if (sport !== 'all') filteredEvents = filteredEvents.filter((event) => event.sport === sport);
            if (level !== 'all') filteredEvents = filteredEvents.filter((event) => event.level === level || event.level === 'all');
            if (coach !== 'all') filteredEvents = filteredEvents.filter((event) => event.coach === coach);
            if (date) filteredEvents = filteredEvents.filter((event) => new Date(event.start).toISOString().split('T')[0] === date);

            this.filteredEvents = filteredEvents;
            this.refreshAllViews();
            this.showNotification('Filtres appliques', 'success');
        };

        manager.resetFilters = function () {
            document.getElementById('sportFilter').value = 'all';
            document.getElementById('levelFilter').value = 'all';
            document.getElementById('coachFilter').value = 'all';
            document.getElementById('dateFilter').value = new Date().toISOString().split('T')[0];
            this.filteredEvents = null;
            this.refreshAllViews();
            this.showNotification('Filtres reinitialises', 'success');
        };

        manager.bookEvent = function (eventId) {
            if (!this.currentUser || !this.canManageBookings) return;
            const event = this.events.find((item) => item.id === eventId);
            if (!event || this.isBooked(eventId)) return;
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

            this.writeBookings();
            this.syncParticipantsWithBookings();
            this.refreshAllViews();
            this.showNotification('Reservation confirmee', 'success');
        };

        manager.cancelBooking = function (bookingId) {
            this.bookings = (this.bookings || []).filter((booking) => booking.id !== bookingId);
            this.writeBookings();
            this.syncParticipantsWithBookings();
            this.refreshAllViews();
            this.showNotification('Reservation annulee', 'success');
        };

        const originalLoadData = manager.loadData.bind(manager);
        manager.loadData = async function (...args) {
            await originalLoadData(...args);
            this.bookings = this.readBookings();
            this.syncParticipantsWithBookings();
        };

        const originalInitUI = manager.initUI.bind(manager);
        manager.initUI = function (...args) {
            originalInitUI(...args);
            this.renderMyBookings();
        };

        const originalShowEventDetails = manager.showEventDetails.bind(manager);
        manager.showEventDetails = function (eventId) {
            originalShowEventDetails(eventId);
            const event = this.events.find((item) => item.id === eventId);
            const footer = document.getElementById('eventDetailFooter');
            if (!event || !footer || !this.canManageBookings) return;

            document.getElementById('bookingActionBtn')?.remove();

            const isBooked = this.isBooked(eventId);
            const isFull = (event.participants || 0) >= (event.maxParticipants || 0);
            footer.insertAdjacentHTML('afterbegin', `
                <button type="button" id="bookingActionBtn" class="btn ${isBooked ? 'btn-danger' : 'btn-primary'}" ${!isBooked && isFull ? 'disabled' : ''}>
                    <i class="fas fa-${isBooked ? 'calendar-times' : 'calendar-check'}"></i>
                    ${isBooked ? 'Annuler ma reservation' : (isFull ? 'Seance complete' : 'Reserver cette seance')}
                </button>
            `);

            document.getElementById('bookingActionBtn')?.addEventListener('click', () => {
                if (isBooked) {
                    const booking = this.getCurrentUserBookings().find((item) => item.eventId === eventId);
                    if (booking) this.cancelBooking(booking.id);
                } else {
                    this.bookEvent(eventId);
                }
                document.getElementById('eventDetailModal').style.display = 'none';
            });
        };

        const originalDeleteEvent = manager.deleteEvent.bind(manager);
        manager.deleteEvent = function (eventId) {
            this.bookings = this.readBookings().filter((booking) => booking.eventId !== eventId);
            this.writeBookings();
            originalDeleteEvent(eventId);
            this.syncParticipantsWithBookings();
            this.refreshAllViews();
        };

        window.addEventListener('storage', (event) => {
            if (!['userBookings', 'planningEvents', 'currentSession', 'ms_bookings', 'ms_planning', 'ms_session'].includes(event.key)) return;
            this.currentUser = manager.currentUser;
            manager.checkAuth();
            manager.canManageBookings = ['athlete', 'parent'].includes((manager.currentUser?.role || manager.currentUser?.userType || ''));
            manager.bookings = manager.readBookings();
            manager.syncParticipantsWithBookings();
            manager.refreshAllViews();
        });

        manager.bookings = manager.readBookings();
        manager.syncParticipantsWithBookings();
        manager.renderMyBookings();
    }

    function ensurePatch() {
        patchPlanningManager();
        if (window.planningManager?.__bookingSyncPatched) return;
        const retry = window.setInterval(() => {
            patchPlanningManager();
            if (window.planningManager?.__bookingSyncPatched) {
                window.clearInterval(retry);
            }
        }, 100);
        window.setTimeout(() => window.clearInterval(retry), 5000);
    }

    document.addEventListener('DOMContentLoaded', ensurePatch);
})();
