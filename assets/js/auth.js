// Gestion de l'authentification - VERSION FINALE 100% FONCTIONNELLE
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // CRÉER LES UTILISATEURS DE DÉMO AU TOUT DÉBUT
        this.createDemoUsers();
        
        // Initialiser le reste
        this.init();
    }

    // CRÉER DES UTILISATEURS DE DÉMO
    createDemoUsers() {
        // Vérifier si des utilisateurs existent déjà
        const existingUsers = localStorage.getItem('users');
        
        if (!existingUsers || JSON.parse(existingUsers).length === 0) {
            const users = [
                { 
                    id: 1, 
                    nom: 'Admin', 
                    prenom: 'System', 
                    email: 'admin@manarsport.dz', 
                    password: 'admin123', 
                    role: 'admin', 
                    status: 'active' 
                },
                { 
                    id: 2, 
                    nom: 'Coach', 
                    prenom: 'Karim', 
                    email: 'coach@manarsport.dz', 
                    password: 'coach123', 
                    role: 'coach', 
                    status: 'active' 
                },
                { 
                    id: 3, 
                    nom: 'Athlète', 
                    prenom: 'Yacine', 
                    email: 'athlete@manarsport.dz', 
                    password: 'athlete123', 
                    role: 'athlete', 
                    status: 'active' 
                },
                { 
                    id: 4, 
                    nom: 'Parent', 
                    prenom: 'Leila', 
                    email: 'parent@manarsport.dz', 
                    password: 'parent123', 
                    role: 'parent', 
                    status: 'active' 
                }
            ];
            localStorage.setItem('users', JSON.stringify(users));
            console.log('✅ Utilisateurs de démo créés avec succès');
            console.log('📧 admin@manarsport.dz / admin123');
        } else {
            console.log('📋 Utilisateurs existants:', JSON.parse(existingUsers));
        }
    }

    init() {
        // Vérifier si l'utilisateur est déjà connecté
        this.checkSession();
        
        // Initialiser les formulaires d'authentification
        this.initLoginForm();
        this.initForgotPassword();
        
        // Mettre à jour l'interface selon l'état de connexion
        this.updateUI();
    }

    checkSession() {
        try {
            const session = localStorage.getItem('currentSession');
            if (session) {
                this.currentUser = JSON.parse(session);
                this.isLoggedIn = true;
                
                // NE PAS rediriger depuis la page de connexion
                const currentPath = window.location.pathname;
                if (!currentPath.includes('connexion.html') && !currentPath.includes('inscription.html')) {
                    this.redirectToCorrectPage();
                }
            }
        } catch (e) {
            console.error('Erreur session:', e);
            this.logout();
        }
    }

    initLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const remember = document.getElementById('remember')?.checked || false;
            
            if (!email || !password) {
                this.showMessage('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            if (!this.isValidEmail(email)) {
                this.showMessage('Format d\'email invalide', 'error');
                return;
            }
            
            this.login(email, password, remember);
        });
    }

    getProfilePictureFromUser(user) {
        if (!user) return null;
        if (typeof user.profilePicture === 'string' && user.profilePicture.startsWith('data:image')) {
            return user.profilePicture;
        }
        const docs = Array.isArray(user.documents) ? user.documents : [];
        const photoDoc = docs.find(d => /photo/i.test(d.name || '') && d.dataUrl && d.dataUrl.startsWith('data:image'));
        return photoDoc ? photoDoc.dataUrl : null;
    }

    initForgotPassword() {
        const forgotLink = document.getElementById('forgotPasswordLink');
        const forgotForm = document.getElementById('forgotPasswordForm');
        const backToLogin = document.getElementById('backToLogin');
        const loginForm = document.getElementById('loginForm');
        
        if (forgotLink && forgotForm && loginForm) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginForm.style.display = 'none';
                forgotForm.style.display = 'block';
            });
        }
        
        if (backToLogin && forgotForm && loginForm) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                forgotForm.style.display = 'none';
                loginForm.style.display = 'block';
            });
        }
        
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail')?.value.trim();
                this.handleForgotPassword(email);
            });
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    login(email, password, remember = false) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const normalizedEmail = email.trim().toLowerCase();
        
        console.log('Tentative de connexion:', normalizedEmail, password);
        console.log('Utilisateurs disponibles:', users);
        
        // Chercher l'utilisateur en ignorant la casse de l'email
        const user = users.find(u => {
            return u.email && String(u.email).trim().toLowerCase() === normalizedEmail;
        });
        
        if (!user) {
            this.showMessage('Email ou mot de passe incorrect', 'error');
            return;
        }
        
        const passwordMatches = user.password === password || user.password === btoa(password);
        if (!passwordMatches) {
            this.showMessage('Email ou mot de passe incorrect', 'error');
            return;
        }
        
        if (user.status === 'inactive') {
            this.showMessage('Votre compte est désactivé.', 'error');
            return;
        }
        
        // Vérifier le statut
        if (user.status === 'inactive' || user.status === 'pending') {
            this.showMessage('Votre compte est en attente de validation.', 'warning');
            return;
        }
        
        // Créer l'utilisateur connecté
        this.currentUser = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role || user.userType || 'membre',
            userType: user.userType || user.role || 'membre',
            profilePicture: this.getProfilePictureFromUser(user)
        };
        
        this.isLoggedIn = true;
        
        // Sauvegarder la session
        localStorage.setItem('currentSession', JSON.stringify(this.currentUser));
        
        // Cookie "Se souvenir de moi"
        if (remember) {
            const date = new Date();
            date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
            document.cookie = `session_id=${user.id}; expires=${date.toUTCString()}; path=/`;
        }
        
        this.showMessage('Connexion réussie ! Redirection...', 'success');
        
        // Redirection après 1.5 secondes
        setTimeout(() => {
            this.redirectToUserSpace(this.currentUser.role);
        }, 1500);
    }

    redirectToUserSpace(role) {
        let redirectUrl = '../index.html';
        
        switch(role) {
            case 'admin':
                redirectUrl = '../admin/dashboard.html'; // CORRIGÉ: plus de 'pages/'
                break;
            case 'coach':
                redirectUrl = '../pages/espace-coach.html';
                break;
            case 'athlete':
                redirectUrl = '../pages/espace-athlete.html';
                break;
            case 'parent':
                redirectUrl = '../pages/espace-parent.html';
                break;
            default:
                redirectUrl = '../index.html';
        }
        
        console.log('Redirection vers:', redirectUrl);
        window.location.href = redirectUrl;
    }

    redirectToCorrectPage() {
        if (!this.currentUser) return;
        
        const currentPath = window.location.pathname;
        const role = this.currentUser.role;
        
        if (currentPath.includes('/admin/') && role !== 'admin') {
            this.showMessage('Accès non autorisé', 'error');
            setTimeout(() => window.location.href = '../index.html', 1500);
            return;
        }
    }

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentSession');
        document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.updateUI();
        
        this.showMessage('Déconnexion réussie', 'success');
        setTimeout(() => window.location.href = '../index.html', 1500);
    }

    handleForgotPassword(email) {
        if (!email || !this.isValidEmail(email)) {
            this.showMessage('Email invalide', 'error');
            return;
        }
        
        this.showMessage('Envoi du lien de réinitialisation...', 'info');
        
        setTimeout(() => {
            this.showMessage('Un lien vous a été envoyé par email', 'success');
            setTimeout(() => {
                const forgotForm = document.getElementById('forgotPasswordForm');
                const loginForm = document.getElementById('loginForm');
                if (forgotForm && loginForm) {
                    forgotForm.style.display = 'none';
                    loginForm.style.display = 'block';
                }
            }, 2000);
        }, 1500);
    }

    isAuthenticated() {
        return this.isLoggedIn;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    isCoach() {
        return this.hasRole('coach');
    }

    isAthlete() {
        return this.hasRole('athlete');
    }

    isParent() {
        return this.hasRole('parent');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUI() {
        // À implémenter si nécessaire
    }

    showMessage(message, type = 'info') {
        const authMessages = document.getElementById('authMessages');
        if (authMessages) {
            authMessages.style.display = 'flex';
            authMessages.className = `auth-messages ${type}`;
            authMessages.innerHTML = `
                <i class="fas fa-${
                    type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle'
                }"></i>
                <span>${message}</span>
            `;
            authMessages.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(message);
        }
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AuthManager();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        window.auth.showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
    }
});