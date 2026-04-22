// Gestionnaire des Équipes
class TeamsManager {
    constructor() {
        this.teams = [];
        this.coaches = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderTeams();
        this.renderCoaches();
        this.bindEvents();
    }

    async loadData() {
        try {
            // Charger les équipes depuis localStorage ou utiliser données par défaut
            const teamsData = localStorage.getItem('teamsData');
            if (teamsData) {
                this.teams = JSON.parse(teamsData);
            } else {
                this.teams = this.generateSampleTeams();
                localStorage.setItem('teamsData', JSON.stringify(this.teams));
            }

            // Charger les coaches
            const coachesData = localStorage.getItem('coachesData');
            if (coachesData) {
                this.coaches = JSON.parse(coachesData);
            } else {
                this.coaches = this.generateSampleCoaches();
                localStorage.setItem('coachesData', JSON.stringify(this.coaches));
            }

            this.hideLoader();
        } catch (error) {
            console.error('Erreur chargement données:', error);
            if (typeof window.notifications !== 'undefined') {
                window.notifications.error('Erreur de chargement des données');
            }
        }
    }

    generateSampleTeams() {
        return [
            {
                id: 1,
                name: 'Football U20',
                sport: 'football',
                category: 'Jeunes',
                coach: 'Mohamed Ali',
                members: 25,
                maxMembers: 30,
                level: 'Compétition',
                schedule: 'Lun, Mer, Ven 18h-20h',
                description: 'Équipe de football des moins de 20 ans, participant aux championnats régionaux.',
                achievements: ['Champion régional 2023', 'Finaliste coupe d\'Oran 2022'],
                image: '../assets/images/equipes/football-u20.jpg',
                status: 'open'
            },
            {
                id: 2,
                name: 'Basketball Senior Féminin',
                sport: 'basketball',
                category: 'Adultes',
                coach: 'Leila Bensalem',
                members: 15,
                maxMembers: 20,
                level: 'Intermédiaire',
                schedule: 'Mar, Jeu 19h-21h, Sam 10h-12h',
                description: 'Équipe féminine de basketball ouverte à tous niveaux.',
                achievements: ['3ème division nationale'],
                image: '../assets/images/equipes/basket-feminin.jpg',
                status: 'open'
            },
            {
                id: 3,
                name: 'Natation Compétition',
                sport: 'natation',
                category: 'Jeunes/Adultes',
                coach: 'Karim Benali',
                members: 18,
                maxMembers: 25,
                level: 'Avancé',
                schedule: 'Lun, Mer, Ven 7h-9h, Mar, Jeu 17h-19h',
                description: 'Groupe de natation de compétition, préparation aux championnats.',
                achievements: ['Champion national 2023', 'Record d\'Algérie 200m'],
                image: '../assets/images/equipes/natation.jpg',
                status: 'open'
            },
            {
                id: 4,
                name: 'Volleyball Loisir',
                sport: 'volleyball',
                category: 'Adultes',
                coach: 'Samir Touati',
                members: 12,
                maxMembers: 15,
                level: 'Débutant',
                schedule: 'Lun, Mer 20h-22h',
                description: 'Section volleyball loisir, découverte et perfectionnement.',
                achievements: [],
                image: '../assets/images/equipes/volleyball.jpg',
                status: 'open'
            }
        ];
    }

    generateSampleCoaches() {
        return [
            {
                id: 1,
                name: 'Mohamed Ali',
                sport: 'football',
                experience: '15 ans',
                certifications: ['UEFA B', 'Diplôme d\'État'],
                specialty: 'Formation jeunes',
                bio: 'Ancien joueur professionnel, spécialisé dans la formation des jeunes talents.',
                image: '../assets/images/coaches/coach1.jpg',
                teams: ['Football U20', 'Football Senior']
            },
            {
                id: 2,
                name: 'Leila Bensalem',
                sport: 'basketball',
                experience: '10 ans',
                certifications: ['Diplôme d\'État', 'Spécialisation féminine'],
                specialty: 'Basketball féminin',
                bio: 'Ancienne joueuse internationale, passionnée par le développement du basketball féminin.',
                image: '../assets/images/coaches/coach2.jpg',
                teams: ['Basketball Senior Féminin']
            },
            {
                id: 3,
                name: 'Karim Benali',
                sport: 'natation',
                experience: '8 ans',
                certifications: ['BEESAN', 'Entraîneur national'],
                specialty: 'Compétition',
                bio: 'Ancien champion national, spécialiste du 200m papillon.',
                image: '../assets/images/coaches/coach3.jpg',
                teams: ['Natation Compétition', 'Natation Loisir']
            }
        ];
    }

    renderTeams() {
        const container = document.getElementById('teamsContainer');
        if (!container) return;

        const filteredTeams = this.getFilteredTeams();
        
        if (filteredTeams.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3 style="color: #666; margin-bottom: 0.5rem;">Aucune équipe trouvée</h3>
                    <p style="color: #999;">Essayez de modifier vos critères de recherche</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTeams.map(team => this.createTeamCard(team)).join('');
    }

    createTeamCard(team) {
        const sportIcon = this.getSportIcon(team.sport);
        const availability = team.members < team.maxMembers ? 
            `<span class="availability available" style="background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-size: 0.85rem;">${team.maxMembers - team.members} place(s) disponible(s)</span>` :
            `<span class="availability full" style="background: #dc3545; color: white; padding: 5px 10px; border-radius: 3px; font-size: 0.85rem;">Complet</span>`;

        return `
            <div class="team-card" data-sport="${team.sport}" data-team-id="${team.id}" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="team-image" style="position: relative; height: 200px; overflow: hidden;">
                    <img src="${team.image}" alt="${team.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../assets/images/default-team.jpg'">
                    <div style="position: absolute; top: 10px; right: 10px;">
                        ${availability}
                    </div>
                    <div style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px;">
                        <i class="${sportIcon}" style="color: ${this.getSportColor(team.sport)};"></i>
                        <span style="font-size: 0.85rem;">${this.getSportName(team.sport)}</span>
                    </div>
                </div>
                <div class="team-info" style="padding: 20px;">
                    <h3 style="margin-bottom: 10px; font-size: 1.25rem;">${team.name}</h3>
                    <div style="display: flex; gap: 15px; margin-bottom: 10px; font-size: 0.9rem; color: #666;">
                        <span style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-user-tie"></i> ${team.coach}
                        </span>
                        <span style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-signal"></i> ${team.level}
                        </span>
                    </div>
                    <p style="color: #666; margin-bottom: 15px; line-height: 1.5;">${team.description.substring(0, 100)}...</p>
                    <div style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 0.9rem; color: #666;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-users"></i>
                            <span>${team.members}/${team.maxMembers}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-calendar"></i>
                            <span>${team.schedule.split(',')[0]}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary view-team" data-team-id="${team.id}" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                            <i class="fas fa-eye"></i> Voir détails
                        </button>
                        ${team.status === 'open' ? `
                            <button class="btn btn-secondary join-team" data-team-id="${team.id}" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
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

        container.innerHTML = this.coaches.map(coach => this.createCoachCard(coach)).join('');
    }

    createCoachCard(coach) {
        return `
            <div class="coach-card" style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div class="coach-image" style="position: relative; height: 250px; overflow: hidden;">
                    <img src="${coach.image}" alt="${coach.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../assets/images/default-coach.jpg'">
                    <div style="position: absolute; bottom: 10px; right: 10px; background: ${this.getSportColor(coach.sport)}; color: white; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="${this.getSportIcon(coach.sport)}"></i>
                    </div>
                </div>
                <div class="coach-info" style="padding: 20px;">
                    <h3 style="margin-bottom: 5px;">${coach.name}</h3>
                    <p style="color: ${this.getSportColor(coach.sport)}; font-weight: 600; margin-bottom: 10px;">${coach.specialty}</p>
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i>
                        <span>${coach.experience} d'expérience</span>
                    </div>
                    <p style="color: #666; margin-bottom: 15px; line-height: 1.5;">${coach.bio.substring(0, 150)}...</p>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
                        ${coach.certifications.map(cert => `
                            <span style="background: #f0f0f0; padding: 3px 8px; border-radius: 20px; font-size: 0.75rem; color: #333;">${cert}</span>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline view-coach" data-coach-id="${coach.id}" style="padding: 8px 15px; background: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        <i class="fas fa-info-circle"></i> Plus d'infos
                    </button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Filtres
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.sport;
                this.renderTeams();
            });
        });

        // Recherche
        const searchInput = document.getElementById('teamSearch');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.renderTeams();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                if (searchInput) {
                    this.currentSearch = searchInput.value.toLowerCase();
                    this.renderTeams();
                }
            });
        }

        // Détails équipe
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-team')) {
                const teamId = e.target.closest('.view-team').dataset.teamId;
                this.showTeamDetails(parseInt(teamId));
            }
            
            if (e.target.closest('.join-team')) {
                const teamId = e.target.closest('.join-team').dataset.teamId;
                this.joinTeam(parseInt(teamId));
            }
            
            if (e.target.closest('.view-coach')) {
                const coachId = e.target.closest('.view-coach').dataset.coachId;
                this.showCoachDetails(parseInt(coachId));
            }
        });

        // Formulaire contact
        const contactForm = document.getElementById('teamContactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(contactForm);
            });
        }
    }

    getFilteredTeams() {
        let filtered = this.teams;
        
        // Filtre par sport
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(team => team.sport === this.currentFilter);
        }
        
        // Filtre par recherche
        if (this.currentSearch) {
            filtered = filtered.filter(team => 
                team.name.toLowerCase().includes(this.currentSearch) ||
                team.description.toLowerCase().includes(this.currentSearch) ||
                team.coach.toLowerCase().includes(this.currentSearch)
            );
        }
        
        return filtered;
    }

    getSportIcon(sport) {
        const icons = {
            football: 'fas fa-futbol',
            basketball: 'fas fa-basketball-ball',
            volleyball: 'fas fa-volleyball-ball',
            natation: 'fas fa-swimming-pool',
            athletisme: 'fas fa-running',
            'arts-martiaux': 'fas fa-user-ninja',
            tennis: 'fas fa-table-tennis',
            gymnastique: 'fas fa-spa',
            handball: 'fas fa-hand-paper',
            judo: 'fas fa-user-ninja',
            karate: 'fas fa-user-ninja'
        };
        return icons[sport] || 'fas fa-question-circle';
    }

    getSportColor(sport) {
        const colors = {
            football: '#1e88e5',
            basketball: '#fb8b24',
            volleyball: '#e94f37',
            natation: '#0d9488',
            athletisme: '#7e57c2',
            'arts-martiaux': '#d32f2f',
            tennis: '#43a047',
            gymnastique: '#8d6e63'
        };
        return colors[sport] || '#6c757d';
    }

    getSportName(sport) {
        const names = {
            football: 'Football',
            basketball: 'Basketball',
            volleyball: 'Volleyball',
            natation: 'Natation',
            athletisme: 'Athlétisme',
            'arts-martiaux': 'Arts Martiaux',
            tennis: 'Tennis',
            gymnastique: 'Gymnastique',
            handball: 'Handball',
            judo: 'Judo',
            karate: 'Karate'
        };
        return names[sport] || sport;
    }

    showTeamDetails(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        const modal = document.getElementById('teamModal');
        if (!modal) return;

        const modalName = document.getElementById('modalTeamName');
        const modalBody = modal.querySelector('.modal-body');

        if (modalName) modalName.textContent = team.name;
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="team-details">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div style="border-radius: 10px; overflow: hidden;">
                            <img src="${team.image}" alt="${team.name}" style="width: 100%; height: 300px; object-fit: cover;" onerror="this.src='../assets/images/default-team.jpg'">
                        </div>
                        <div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="${this.getSportIcon(team.sport)}" style="font-size: 1.5rem; color: ${this.getSportColor(team.sport)};"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Sport</div>
                                        <strong>${this.getSportName(team.sport)}</strong>
                                    </div>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-user-tie" style="font-size: 1.5rem; color: #6c757d;"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Coach</div>
                                        <strong>${team.coach}</strong>
                                    </div>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-signal" style="font-size: 1.5rem; color: #6c757d;"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Niveau</div>
                                        <strong>${team.level}</strong>
                                    </div>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-users" style="font-size: 1.5rem; color: #6c757d;"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Membres</div>
                                        <strong>${team.members}/${team.maxMembers}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-info-circle" style="color: #007bff;"></i> Description
                        </h4>
                        <p style="color: #666; line-height: 1.6;">${team.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calendar-alt" style="color: #007bff;"></i> Horaires d'entraînement
                        </h4>
                        <p style="color: #666;">${team.schedule}</p>
                    </div>
                    
                    ${team.achievements && team.achievements.length > 0 ? `
                        <div style="margin-bottom: 30px;">
                            <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-trophy" style="color: #ffc107;"></i> Palmarès
                            </h4>
                            <ul style="list-style: none; padding: 0;">
                                ${team.achievements.map(achievement => `
                                    <li style="margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-medal" style="color: #ffc107;"></i>
                                        ${achievement}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 15px;">
                        ${team.status === 'open' ? `
                            <button class="btn btn-primary join-team-modal" data-team-id="${team.id}" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-user-plus"></i> Demander à rejoindre
                            </button>
                        ` : `
                            <button class="btn btn-secondary" disabled style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; display: flex; align-items: center; gap: 8px; opacity: 0.65;">
                                <i class="fas fa-lock"></i> Inscriptions fermées
                            </button>
                        `}
                        <button class="btn btn-outline contact-coach" data-coach="${team.coach}" style="padding: 10px 20px; background: transparent; color: #007bff; border: 1px solid #007bff; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-envelope"></i> Contacter le coach
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.add('show');
        modal.style.display = 'block';
        
        // Événements dans le modal
        const joinBtn = modal.querySelector('.join-team-modal');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                this.joinTeam(team.id);
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }
        
        const contactBtn = modal.querySelector('.contact-coach');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                this.contactCoach(team.coach);
            });
        }
        
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        });
    }

    showCoachDetails(coachId) {
        const coach = this.coaches.find(c => c.id === coachId);
        if (!coach) return;

        const modal = document.getElementById('teamModal');
        if (!modal) return;

        const modalName = document.getElementById('modalTeamName');
        const modalBody = modal.querySelector('.modal-body');

        if (modalName) modalName.textContent = coach.name;
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="coach-details">
                    <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px; margin-bottom: 30px;">
                        <div style="border-radius: 10px; overflow: hidden;">
                            <img src="${coach.image}" alt="${coach.name}" style="width: 100%; height: 300px; object-fit: cover;" onerror="this.src='../assets/images/default-coach.jpg'">
                        </div>
                        <div>
                            <h2 style="margin-bottom: 5px;">${coach.name}</h2>
                            <p style="color: ${this.getSportColor(coach.sport)}; font-weight: 600; font-size: 1.1rem; margin-bottom: 20px;">Coach ${this.getSportName(coach.sport)}</p>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-clock" style="font-size: 1.5rem; color: #6c757d;"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Expérience</div>
                                        <strong>${coach.experience}</strong>
                                    </div>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fas fa-trophy" style="font-size: 1.5rem; color: #6c757d;"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; color: #666;">Spécialité</div>
                                        <strong>${coach.specialty}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-user"></i> Parcours
                        </h4>
                        <p style="color: #666; line-height: 1.6;">${coach.bio}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-graduation-cap"></i> Certifications
                        </h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${coach.certifications.map(cert => `
                                <div style="background: #f0f0f0; padding: 8px 15px; border-radius: 30px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-certificate" style="color: #007bff;"></i>
                                    <span>${cert}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${coach.teams && coach.teams.length > 0 ? `
                        <div style="margin-bottom: 30px;">
                            <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-users"></i> Équipes encadrées
                            </h4>
                            <ul style="list-style: none; padding: 0;">
                                ${coach.teams.map(team => `
                                    <li style="margin-bottom: 5px; display: flex; align-items: center; gap: 8px;">
                                        <i class="fas fa-chevron-right" style="color: #007bff;"></i>
                                        ${team}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div>
                        <button class="btn btn-primary contact-coach-btn" data-coach="${coach.name}" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-envelope"></i> Contacter ${coach.name.split(' ')[0]}
                        </button>
                    </div>
                </div>
            `;
        }

        modal.classList.add('show');
        modal.style.display = 'block';
        
        // Événement contact
        const contactBtn = modal.querySelector('.contact-coach-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => {
                this.contactCoach(coach.name);
            });
        }
        
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        });
    }

    joinTeam(teamId) {
        if (!window.auth || !window.auth.isAuthenticated()) {
            if (typeof window.auth?.showMessage === 'function') {
                window.auth.showMessage('Veuillez vous connecter pour rejoindre une équipe', 'warning');
            } else {
                alert('Veuillez vous connecter pour rejoindre une équipe');
            }
            setTimeout(() => {
                window.location.href = 'connexion.html';
            }, 1500);
            return;
        }

        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        if (team.members >= team.maxMembers) {
            if (typeof window.notifications?.error === 'function') {
                window.notifications.error('Cette équipe est complète');
            } else {
                alert('Cette équipe est complète');
            }
            return;
        }

        try {
            // Simuler la demande d'adhésion
            setTimeout(() => {
                if (typeof window.auth?.showMessage === 'function') {
                    window.auth.showMessage('Demande d\'adhésion envoyée avec succès', 'success');
                } else {
                    alert('Demande d\'adhésion envoyée avec succès');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Erreur lors de la demande d\'adhésion:', error);
            if (typeof window.notifications?.error === 'function') {
                window.notifications.error('Erreur lors de la demande d\'adhésion');
            }
        }
    }

    contactCoach(coachName) {
        if (!window.auth || !window.auth.isAuthenticated()) {
            if (typeof window.auth?.showMessage === 'function') {
                window.auth.showMessage('Veuillez vous connecter pour contacter un coach', 'warning');
            }
            return;
        }

        alert(`Fonctionnalité de contact pour ${coachName} bientôt disponible !`);
    }

    handleContactForm(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            sport: formData.get('sport'),
            level: formData.get('level'),
            message: formData.get('message'),
            date: new Date().toISOString()
        };

        console.log('Formulaire contact soumis:', data);
        
        setTimeout(() => {
            if (typeof window.auth?.showMessage === 'function') {
                window.auth.showMessage('Demande envoyée avec succès ! Nous vous contacterons bientôt.', 'success');
            } else {
                alert('Demande envoyée avec succès ! Nous vous contacterons bientôt.');
            }
            form.reset();
        }, 1000);
    }

    hideLoader() {
        const loader = document.getElementById('teamsLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.teamsManager = new TeamsManager();
});