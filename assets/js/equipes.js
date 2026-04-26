// Page equipes synchronisee avec le dashboard

class TeamsManager {
    constructor() {
        this.teams = [];
        this.coaches = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.refreshData();
        this.bindEvents();
        this.render();
    }

    refreshData() {
        this.currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
        this.teams = this.loadTeams();
        this.coaches = this.buildCoaches();
        this.hideLoader();
    }

    readList(...keys) {
        for (const key of keys) {
            if (!key) continue;

            try {
                if (window.DS?.get && String(key).startsWith('ms_')) {
                    const value = window.DS.get(key);
                    if (Array.isArray(value)) return value;
                }

                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            } catch (_) {
                // ignore malformed storage entries
            }
        }

        return [];
    }

    loadTeams() {
        const source = this.readList(
            window.DS?.KEYS?.teams || 'ms_teams',
            'teams',
            'teamsData',
            'equipesData'
        );

        const teams = source.length ? source : this.seedTeams();
        return teams
            .map((team) => this.normalizeTeam(team))
            .filter(Boolean)
            .sort((left, right) => left.name.localeCompare(right.name, 'fr'));
    }

    seedTeams() {
        return [
            {
                id: 1,
                name: 'Football U20',
                sport: 'Football',
                coach: 'Karim Benali',
                members: 18,
                maxMembers: 22,
                category: 'Jeunes',
                level: 'Competition',
                schedule: 'Lun, Mer, Ven 18h-20h',
                description: 'Equipe de football des moins de 20 ans engagee dans les championnats regionaux.',
                achievements: ['Champion regional 2023'],
                status: 'open'
            },
            {
                id: 2,
                name: 'Natation Jeunes',
                sport: 'Natation',
                coach: 'Amine Slimani',
                members: 12,
                maxMembers: 20,
                category: 'Jeunes',
                level: 'Debutant',
                schedule: 'Lun, Mer 16h-18h',
                description: 'Apprentissage et perfectionnement des bases de la natation.',
                achievements: [],
                status: 'open'
            }
        ];
    }

    normalizeTeam(team) {
        if (!team || typeof team !== 'object') return null;

        const sport = this.normalizeSportKey(team.sport || team.discipline || '');
        const members = Number(team.members ?? team.registered ?? team.participants ?? 0) || 0;
        const maxMembers = Number(team.maxMembers ?? team.maxParticipants ?? team.capacity ?? 0) || 0;
        const category = team.category || 'Tous publics';
        const level = team.level || 'Tous niveaux';
        const schedule = team.schedule || 'Horaires a confirmer';
        const name = team.name || team.title || 'Equipe';
        const description = team.description || `Section ${this.formatSportName(sport)} ${category.toLowerCase()} encadree par ${team.coach || 'nos coaches'}.`;
        const achievements = Array.isArray(team.achievements) ? team.achievements : [];
        const status = team.status || (maxMembers > 0 && members >= maxMembers ? 'full' : 'open');

        return {
            ...team,
            id: Number(team.id) || Date.now() + Math.floor(Math.random() * 1000),
            name,
            sport,
            coach: team.coach || 'Association Manar',
            members,
            maxMembers,
            category,
            level,
            schedule,
            description,
            achievements,
            status,
            image: team.image || this.getTeamImage(sport)
        };
    }

    buildCoaches() {
        const users = this.readList(window.DS?.KEYS?.users || 'ms_users', 'users');
        const coachUsers = users.filter((user) => {
            const role = user?.role || user?.userType || '';
            return role === 'coach';
        });

        const groupedTeams = new Map();
        this.teams.forEach((team) => {
            const coachName = (team.coach || 'Association Manar').trim();
            if (!groupedTeams.has(coachName)) groupedTeams.set(coachName, []);
            groupedTeams.get(coachName).push(team.name);
        });

        const coaches = [];

        groupedTeams.forEach((teamNames, coachName) => {
            const coachUser = coachUsers.find((user) => {
                const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
                return fullName.toLowerCase() === coachName.toLowerCase();
            });

            const firstTeam = this.teams.find((team) => team.coach.trim().toLowerCase() === coachName.toLowerCase());
            const sport = this.normalizeSportKey(coachUser?.sport || coachUser?.specialite || firstTeam?.sport || '');

            coaches.push({
                id: Number(coachUser?.id) || this.hashString(coachName),
                name: coachName,
                sport,
                specialty: coachUser?.specialite || `Coach ${this.formatSportName(sport)}`,
                experience: coachUser?.experience || 'Experience confirmee',
                bio: coachUser?.bio || `Encadrement des groupes ${teamNames.join(', ')} au sein de Manar Sport.`,
                certifications: Array.isArray(coachUser?.certifications) && coachUser.certifications.length
                    ? coachUser.certifications
                    : [coachUser?.adminFunction, coachUser?.specialite].filter(Boolean),
                teams: teamNames,
                image: coachUser?.photo || coachUser?.dataUrl || this.getCoachImage(sport)
            });
        });

        return coaches.sort((left, right) => left.name.localeCompare(right.name, 'fr'));
    }

    bindEvents() {
        document.querySelectorAll('.filter-btn').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                this.currentFilter = button.dataset.sport || 'all';
                this.renderTeams();
            });
        });

        const searchInput = document.getElementById('teamSearch');
        const searchBtn = document.getElementById('searchBtn');

        searchInput?.addEventListener('input', (event) => {
            this.currentSearch = event.target.value.trim().toLowerCase();
            this.renderTeams();
        });

        searchBtn?.addEventListener('click', () => {
            this.currentSearch = searchInput?.value.trim().toLowerCase() || '';
            this.renderTeams();
        });

        document.addEventListener('click', (event) => {
            const viewTeamButton = event.target.closest('.view-team');
            if (viewTeamButton) {
                this.showTeamDetails(Number(viewTeamButton.dataset.teamId));
                return;
            }

            const joinTeamButton = event.target.closest('.join-team');
            if (joinTeamButton) {
                this.joinTeam(Number(joinTeamButton.dataset.teamId));
                return;
            }

            const viewCoachButton = event.target.closest('.view-coach');
            if (viewCoachButton) {
                this.showCoachDetails(Number(viewCoachButton.dataset.coachId));
            }
        });

        const contactForm = document.getElementById('teamContactForm');
        contactForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleContactForm(contactForm);
        });

        const refresh = () => {
            this.refreshData();
            this.render();
        };

        if (window.DS?.on) {
            window.DS.on(window.DS.KEYS?.teams || 'ms_teams', refresh);
            window.DS.on(window.DS.KEYS?.users || 'ms_users', refresh);
            window.DS.on(window.DS.KEYS?.session || 'ms_session', refresh);
        }

        window.addEventListener('storage', (event) => {
            if (!['teams', 'teamsData', 'equipesData', 'ms_teams', 'users', 'ms_users', 'currentSession', 'ms_session'].includes(event.key)) {
                return;
            }
            refresh();
        });
    }

    render() {
        this.renderTeams();
        this.renderCoaches();
    }

    getFilteredTeams() {
        return this.teams.filter((team) => {
            if (this.currentFilter !== 'all' && this.normalizeSportKey(team.sport) !== this.currentFilter) {
                return false;
            }

            if (!this.currentSearch) return true;

            const haystack = [
                team.name,
                team.description,
                team.coach,
                team.level,
                team.category,
                team.schedule
            ].join(' ').toLowerCase();

            return haystack.includes(this.currentSearch);
        });
    }

    renderTeams() {
        const container = document.getElementById('teamsContainer');
        if (!container) return;

        const teams = this.getFilteredTeams();
        if (!teams.length) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-users-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <h3 style="color: #475569; margin-bottom: 0.5rem;">Aucune equipe trouvee</h3>
                    <p style="color: #64748b;">Essayez un autre sport ou une autre recherche.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = teams.map((team) => this.createTeamCard(team)).join('');
    }

    createTeamCard(team) {
        const availableSlots = team.maxMembers > 0 ? Math.max(0, team.maxMembers - team.members) : null;
        const canJoin = team.status !== 'full' && (availableSlots === null || availableSlots > 0);

        return `
            <div class="team-card" data-sport="${this.escapeAttribute(team.sport)}" data-team-id="${team.id}" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="team-image" style="position: relative; height: 200px; overflow: hidden;">
                    <img src="${team.image}" alt="${this.escapeAttribute(team.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../assets/images/default-team.jpg'">
                    <div style="position: absolute; top: 10px; right: 10px;">
                        ${canJoin
                            ? `<span class="availability available" style="background: #16a34a; color: white; padding: 5px 10px; border-radius: 3px; font-size: 0.85rem;">${availableSlots === null ? 'Places ouvertes' : `${availableSlots} place(s) disponible(s)`}</span>`
                            : `<span class="availability full" style="background: #dc2626; color: white; padding: 5px 10px; border-radius: 3px; font-size: 0.85rem;">Complet</span>`}
                    </div>
                    <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(15, 23, 42, 0.8); color: white; padding: 5px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px;">
                        <i class="${this.getSportIcon(team.sport)}" style="color: ${this.getSportColor(team.sport)};"></i>
                        <span style="font-size: 0.85rem;">${this.escapeHtml(this.formatSportName(team.sport))}</span>
                    </div>
                </div>
                <div class="team-info" style="padding: 20px;">
                    <h3 style="margin-bottom: 10px; font-size: 1.25rem;">${this.escapeHtml(team.name)}</h3>
                    <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.9rem; color: #64748b; flex-wrap: wrap;">
                        <span style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-user-tie"></i> ${this.escapeHtml(team.coach)}
                        </span>
                        <span style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-signal"></i> ${this.escapeHtml(team.level)}
                        </span>
                    </div>
                    <p style="color: #475569; margin-bottom: 15px; line-height: 1.5;">${this.escapeHtml(this.truncate(team.description, 110))}</p>
                    <div style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 0.9rem; color: #64748b; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-users"></i>
                            <span>${team.maxMembers > 0 ? `${team.members}/${team.maxMembers}` : `${team.members}`}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-calendar"></i>
                            <span>${this.escapeHtml(team.schedule)}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary view-team" data-team-id="${team.id}" style="padding: 8px 15px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-eye"></i> Voir details
                        </button>
                        ${canJoin ? `
                            <button class="btn btn-secondary join-team" data-team-id="${team.id}" style="padding: 8px 15px; background: #0f766e; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-user-plus"></i> Rejoindre
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderCoaches() {
        const container = document.getElementById('coachesContainer');
        if (!container) return;

        if (!this.coaches.length) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <i class="fas fa-user-tie" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <h3 style="color: #475569; margin-bottom: 0.5rem;">Coaches en cours de synchronisation</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = this.coaches.map((coach) => `
            <div class="coach-card" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="coach-image" style="position: relative; height: 250px; overflow: hidden;">
                    <img src="${coach.image}" alt="${this.escapeAttribute(coach.name)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../assets/images/default-coach.jpg'">
                    <div style="position: absolute; bottom: 10px; right: 10px; background: ${this.getSportColor(coach.sport)}; color: white; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="${this.getSportIcon(coach.sport)}"></i>
                    </div>
                </div>
                <div class="coach-info" style="padding: 20px;">
                    <h3 style="margin-bottom: 5px;">${this.escapeHtml(coach.name)}</h3>
                    <p style="color: ${this.getSportColor(coach.sport)}; font-weight: 600; margin-bottom: 10px;">${this.escapeHtml(coach.specialty)}</p>
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px; color: #64748b; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i>
                        <span>${this.escapeHtml(coach.experience)} d'experience</span>
                    </div>
                    <p style="color: #475569; margin-bottom: 15px; line-height: 1.5;">${this.escapeHtml(this.truncate(coach.bio, 150))}</p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                        ${(coach.certifications || []).filter(Boolean).map((certification) => `
                            <span style="background: #e2e8f0; padding: 3px 8px; border-radius: 20px; font-size: 0.75rem; color: #334155;">${this.escapeHtml(certification)}</span>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline view-coach" data-coach-id="${coach.id}" style="padding: 8px 15px; background: transparent; color: #2563eb; border: 1px solid #2563eb; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-info-circle"></i> Plus d'infos
                    </button>
                </div>
            </div>
        `).join('');
    }

    showTeamDetails(teamId) {
        const team = this.teams.find((item) => item.id === Number(teamId));
        const modal = document.getElementById('teamModal');
        const modalTitle = document.getElementById('modalTeamName');
        const modalBody = modal?.querySelector('.modal-body');
        if (!team || !modal || !modalTitle || !modalBody) return;

        const canJoin = team.status !== 'full' && (team.maxMembers <= 0 || team.members < team.maxMembers);
        modalTitle.textContent = team.name;
        modalBody.innerHTML = `
            <div class="team-details">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="border-radius: 10px; overflow: hidden;">
                        <img src="${team.image}" alt="${this.escapeAttribute(team.name)}" style="width: 100%; height: 300px; object-fit: cover;" onerror="this.src='../assets/images/default-team.jpg'">
                    </div>
                    <div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            ${this.renderInfoBox(this.getSportIcon(team.sport), this.getSportColor(team.sport), 'Sport', this.formatSportName(team.sport))}
                            ${this.renderInfoBox('fas fa-user-tie', '#64748b', 'Coach', team.coach)}
                            ${this.renderInfoBox('fas fa-signal', '#64748b', 'Niveau', team.level)}
                            ${this.renderInfoBox('fas fa-users', '#64748b', 'Membres', team.maxMembers > 0 ? `${team.members}/${team.maxMembers}` : `${team.members}`)}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 10px;"><i class="fas fa-info-circle" style="color: #2563eb;"></i> Description</h4>
                    <p style="color: #475569; line-height: 1.6;">${this.escapeHtml(team.description)}</p>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 10px;"><i class="fas fa-calendar-alt" style="color: #2563eb;"></i> Horaires</h4>
                    <p style="color: #475569;">${this.escapeHtml(team.schedule)}</p>
                </div>
                ${team.achievements.length ? `
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin-bottom: 10px;"><i class="fas fa-trophy" style="color: #f59e0b;"></i> Palmarès</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${team.achievements.map((achievement) => `
                                <li style="margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-medal" style="color: #f59e0b;"></i>
                                    ${this.escapeHtml(achievement)}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    ${canJoin ? `
                        <button class="btn btn-primary join-team-modal" data-team-id="${team.id}" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user-plus"></i> Demander a rejoindre
                        </button>
                    ` : `
                        <button class="btn btn-secondary" disabled style="padding: 10px 20px; background: #64748b; color: white; border: none; border-radius: 5px; opacity: 0.65;">
                            <i class="fas fa-lock"></i> Inscriptions fermees
                        </button>
                    `}
                    <button class="btn btn-outline contact-coach" data-coach="${this.escapeAttribute(team.coach)}" style="padding: 10px 20px; background: transparent; color: #2563eb; border: 1px solid #2563eb; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-envelope"></i> Contacter le coach
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        modal.classList.add('show');

        modal.querySelector('.join-team-modal')?.addEventListener('click', () => this.joinTeam(team.id));
        modal.querySelector('.contact-coach')?.addEventListener('click', () => this.contactCoach(team.coach, team.name));
        this.bindModalClose(modal);
    }

    showCoachDetails(coachId) {
        const coach = this.coaches.find((item) => item.id === Number(coachId));
        const modal = document.getElementById('teamModal');
        const modalTitle = document.getElementById('modalTeamName');
        const modalBody = modal?.querySelector('.modal-body');
        if (!coach || !modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = coach.name;
        modalBody.innerHTML = `
            <div class="coach-details">
                <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px; margin-bottom: 30px;">
                    <div style="border-radius: 10px; overflow: hidden;">
                        <img src="${coach.image}" alt="${this.escapeAttribute(coach.name)}" style="width: 100%; height: 300px; object-fit: cover;" onerror="this.src='../assets/images/default-coach.jpg'">
                    </div>
                    <div>
                        <h2 style="margin-bottom: 5px;">${this.escapeHtml(coach.name)}</h2>
                        <p style="color: ${this.getSportColor(coach.sport)}; font-weight: 600; font-size: 1.1rem; margin-bottom: 20px;">${this.escapeHtml(coach.specialty)}</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            ${this.renderInfoBox('fas fa-clock', '#64748b', 'Experience', coach.experience)}
                            ${this.renderInfoBox('fas fa-trophy', '#64748b', 'Sport', this.formatSportName(coach.sport))}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 10px;"><i class="fas fa-user"></i> Parcours</h4>
                    <p style="color: #475569; line-height: 1.6;">${this.escapeHtml(coach.bio)}</p>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 10px;"><i class="fas fa-graduation-cap"></i> Certifications</h4>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${(coach.certifications || []).filter(Boolean).map((certification) => `
                            <div style="background: #e2e8f0; padding: 8px 15px; border-radius: 30px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-certificate" style="color: #2563eb;"></i>
                                <span>${this.escapeHtml(certification)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${coach.teams.length ? `
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin-bottom: 10px;"><i class="fas fa-users"></i> Equipes encadrees</h4>
                        <ul style="list-style: none; padding: 0;">
                            ${coach.teams.map((teamName) => `
                                <li style="margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-chevron-right" style="color: #2563eb;"></i>
                                    ${this.escapeHtml(teamName)}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                <button class="btn btn-primary contact-coach-btn" data-coach="${this.escapeAttribute(coach.name)}" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-envelope"></i> Contacter ${this.escapeHtml(coach.name.split(' ')[0])}
                </button>
            </div>
        `;

        modal.style.display = 'block';
        modal.classList.add('show');
        modal.querySelector('.contact-coach-btn')?.addEventListener('click', () => this.contactCoach(coach.name, coach.teams[0] || 'Equipe'));
        this.bindModalClose(modal);
    }

    bindModalClose(modal) {
        const close = () => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        };

        modal.querySelector('.modal-close')?.addEventListener('click', close, { once: true });
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        }, { once: true });
    }

    joinTeam(teamId) {
        const team = this.teams.find((item) => item.id === Number(teamId));
        if (!team) return;

        if (!this.currentUser) {
            this.notify('Veuillez vous connecter pour rejoindre une equipe.', 'warning');
            window.setTimeout(() => {
                window.location.href = 'connexion.html';
            }, 900);
            return;
        }

        if (team.maxMembers > 0 && team.members >= team.maxMembers) {
            this.notify('Cette equipe est complete.', 'warning');
            return;
        }

        this.pushDashboardMessage({
            name: `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || this.currentUser.email || 'Utilisateur',
            email: this.currentUser.email || '',
            subject: `Demande d'integration - ${team.name}`,
            message: `Je souhaite rejoindre l'equipe ${team.name} (${this.formatSportName(team.sport)}). Coach: ${team.coach}.`,
            read: false
        });

        this.notify(`Votre demande pour "${team.name}" a ete envoyee au dashboard.`, 'success');
        this.closeTeamModal();
    }

    contactCoach(coachName, teamName) {
        if (!this.currentUser) {
            this.notify('Veuillez vous connecter pour contacter un coach.', 'warning');
            return;
        }

        this.pushDashboardMessage({
            name: `${this.currentUser.prenom || ''} ${this.currentUser.nom || ''}`.trim() || this.currentUser.email || 'Utilisateur',
            email: this.currentUser.email || '',
            subject: `Contact coach - ${coachName}`,
            message: `Je souhaite etre contacte par ${coachName}${teamName ? ` au sujet de ${teamName}` : ''}.`,
            read: false
        });

        this.notify(`Votre message pour ${coachName} a ete ajoute au dashboard.`, 'success');
    }

    handleContactForm(form) {
        const formData = new FormData(form);
        const payload = {
            name: formData.get('name')?.toString().trim() || '',
            email: formData.get('email')?.toString().trim() || '',
            sport: formData.get('sport')?.toString().trim() || '',
            level: formData.get('level')?.toString().trim() || '',
            message: formData.get('message')?.toString().trim() || ''
        };

        if (!payload.name || !payload.email || !payload.sport || !payload.level) {
            this.notify('Veuillez remplir les champs obligatoires.', 'warning');
            return;
        }

        this.pushDashboardMessage({
            name: payload.name,
            email: payload.email,
            subject: `Demande equipe - ${this.formatSportName(payload.sport)}`,
            message: `Niveau: ${payload.level}.${payload.message ? ` Message: ${payload.message}` : ''}`,
            read: false
        });

        form.reset();
        this.notify('Votre demande a ete transmise au dashboard.', 'success');
    }

    pushDashboardMessage(message) {
        const messages = this.readList(window.DS?.KEYS?.messages || 'ms_messages', 'messages', 'contactMessages');
        messages.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            ...message
        });

        if (window.DS?.set && window.DS.KEYS?.messages) {
            window.DS.set(window.DS.KEYS.messages, messages);
            return;
        }

        localStorage.setItem('messages', JSON.stringify(messages));
        localStorage.setItem('ms_messages', JSON.stringify(messages));
    }

    closeTeamModal() {
        const modal = document.getElementById('teamModal');
        if (!modal) return;
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    renderInfoBox(icon, color, label, value) {
        return `
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                <i class="${icon}" style="font-size: 1.5rem; color: ${color};"></i>
                <div>
                    <div style="font-size: 0.85rem; color: #64748b;">${this.escapeHtml(label)}</div>
                    <strong>${this.escapeHtml(value)}</strong>
                </div>
            </div>
        `;
    }

    normalizeSportKey(value) {
        const sport = String(value || '').trim().toLowerCase();
        const map = {
            football: 'football',
            basketball: 'basketball',
            volleyball: 'volleyball',
            natation: 'natation',
            athletisme: 'athletisme',
            'athletisme ': 'athletisme',
            'athlétisme': 'athletisme',
            'arts martiaux': 'arts-martiaux',
            'arts-martiaux': 'arts-martiaux'
        };
        return map[sport] || sport || 'football';
    }

    formatSportName(value) {
        const labels = {
            football: 'Football',
            basketball: 'Basketball',
            volleyball: 'Volleyball',
            natation: 'Natation',
            athletisme: 'Athletisme',
            'arts-martiaux': 'Arts martiaux'
        };
        return labels[this.normalizeSportKey(value)] || String(value || 'Sport');
    }

    getSportIcon(sport) {
        const icons = {
            football: 'fas fa-futbol',
            basketball: 'fas fa-basketball-ball',
            volleyball: 'fas fa-volleyball-ball',
            natation: 'fas fa-swimming-pool',
            athletisme: 'fas fa-running',
            'arts-martiaux': 'fas fa-user-ninja'
        };
        return icons[this.normalizeSportKey(sport)] || 'fas fa-users';
    }

    getSportColor(sport) {
        const colors = {
            football: '#2563eb',
            basketball: '#fb923c',
            volleyball: '#ef4444',
            natation: '#0f766e',
            athletisme: '#7c3aed',
            'arts-martiaux': '#dc2626'
        };
        return colors[this.normalizeSportKey(sport)] || '#64748b';
    }

    getTeamImage(sport) {
        const images = {
            football: '../assets/images/equipes/football-u20.jpg',
            basketball: '../assets/images/equipes/basket-feminin.jpg',
            volleyball: '../assets/images/equipes/volleyball.jpg',
            natation: '../assets/images/equipes/natation.jpg',
            athletisme: '../assets/images/default-team.jpg',
            'arts-martiaux': '../assets/images/default-team.jpg'
        };
        return images[this.normalizeSportKey(sport)] || '../assets/images/default-team.jpg';
    }

    getCoachImage(sport) {
        const images = {
            football: '../assets/images/coaches/coach1.jpg',
            basketball: '../assets/images/coaches/coach2.jpg',
            natation: '../assets/images/coaches/coach3.jpg'
        };
        return images[this.normalizeSportKey(sport)] || '../assets/images/default-coach.jpg';
    }

    truncate(value, maxLength) {
        const text = String(value || '');
        return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
    }

    hashString(value) {
        return Array.from(String(value || '')).reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0);
    }

    notify(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        if (window.auth?.showMessage) {
            window.auth.showMessage(message, type);
            return;
        }
        alert(message);
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#96;');
    }

    hideLoader() {
        const loader = document.getElementById('teamsLoader');
        if (loader) loader.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.teamsManager = new TeamsManager();
});
