// --- INITIALISATION SUPABASE (VERSION OFFICIELLE ET 100% FONCTIONNELLE) ---
const supabaseUrl = 'https://cqzsamqyhdwejogxxohm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxenNhbXF5aGR3ZWpvZ3h4b2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4Mzg0NjYsImV4cCI6MjA4MjQxNDQ2Nn0.igWJ7Ct5tXpxrd-MmRjBLlPehHmeOpHLd8ee9Xm_30w';

const { createClient } = supabase;  // Récupère createClient depuis le CDN
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// --- ÉLÉMENTS DU DOM ---
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

const registerForm = document.getElementById('register-form');
const loginForm = document.querySelector('.form-box.login form');
const registerError = document.getElementById('register-error');

// Création du message d'erreur pour la connexion s'il n'existe pas
if (!document.getElementById('login-error')) {
    const errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.id = 'login-error';
    loginForm.appendChild(errorDiv); // Ajouté juste avant le bouton Se connecter
}
const loginErrorMsg = document.getElementById('login-error');

// --- AJOUT DU FOOTER "Développé par Emmanuel Kpan" ---
const footer = document.createElement('div');
footer.innerHTML = 'Développé par <strong>Emmanuel Kpan</strong>';
footer.style.position = 'absolute';
footer.style.bottom = '10px';
footer.style.right = '20px';
footer.style.fontSize = '12px';
footer.style.color = '#666';
footer.style.zIndex = '10';
body.appendChild(footer);

body.dark && (footer.style.color = '#aaa'); // Adaptation mode sombre

// --- THÈME AUTO SELON L'HEURE + MANUEL TEMPORAIRE ---
function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
}

function applyAutoTheme() {
    if (isNightTime()) {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }
}
applyAutoTheme();
setInterval(applyAutoTheme, 3600000);

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
});

// --- BONJOUR / BONSOIR ---
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting-message');
    if (greetingElement) {
        greetingElement.textContent = (hour >= 5 && hour < 18) ? "Bonjour, bienvenue !" : "Bonsoir, bienvenue !";
    }
}
updateGreeting();
setInterval(updateGreeting, 3600000);

// --- INSCRIPTION ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        registerError.classList.remove('show');
        registerError.textContent = '';
        registerError.style.background = '';

        if (!username || !email || !password || !confirmPassword) {
            registerError.textContent = "Veuillez remplir tous les champs.";
            registerError.classList.add('show');
            return;
        }

        if (password.length < 6) {
            registerError.textContent = "Le mot de passe doit faire au moins 6 caractères.";
            registerError.classList.add('show');
            return;
        }

        if (password !== confirmPassword) {
            registerError.textContent = "Les mots de passe ne correspondent pas.";
            registerError.classList.add('show');
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: username }
            }
        });

        if (error || (data.user && data.user.identities && data.user.identities.length === 0)) {
            registerError.textContent = error?.message?.includes('duplicate') || data.user?.identities?.length === 0
                ? "Cet email est déjà utilisé."
                : "Erreur : " + (error?.message || "Inscription échouée");
            registerError.classList.add('show');
        } else {
            registerError.textContent = "Inscription réussie ! Vérifiez votre boîte mail pour confirmer.";
            registerError.style.background = "#51cf66";
            registerError.classList.add('show');

            setTimeout(() => {
                registerForm.reset();
                container.classList.remove('active');
            }, 3000);
        }
    });
}

// --- CONNEXION (AVEC NOM D'UTILISATEUR OU EMAIL) ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = loginForm.querySelector('input[type="text"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;

    loginErrorMsg.classList.remove('show');
    loginErrorMsg.textContent = '';
    loginErrorMsg.style.background = '';

    if (!identifier || !password) {
        loginErrorMsg.textContent = "Veuillez remplir les champs.";
        loginErrorMsg.classList.add('show');
        return;
    }

    let email = identifier;

    // Si l'identifiant n'est pas un email, on cherche l'email via le username
    if (!identifier.includes('@')) {
        const { data: emailData, error: funcError } = await supabaseClient.rpc('get_email_from_username', { p_username: identifier });

        if (funcError || !emailData) {
            loginErrorMsg.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
            loginErrorMsg.classList.add('show');
            return;
        }

        email = emailData;
    }

    // Connexion réelle avec l'email trouvé
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginErrorMsg.textContent = "Nom d'utilisateur ou mot de passe incorrect.";
        loginErrorMsg.classList.add('show');
    } else {
        loginErrorMsg.textContent = "Connexion réussie ! Bienvenue 😉";
        loginErrorMsg.style.background = "#51cf66";
        loginErrorMsg.classList.add('show');

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
    }
});

// --- VÉRIFICATION SESSION AU CHARGEMENT ---
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && !window.location.pathname.includes('dashboard.html')) {
        window.location.href = "dashboard.html";
    }
});
// --- CONNEXION GOOGLE ---
document.getElementById('google-login')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    if (error) console.error(error);
});

// --- CONNEXION GITHUB ---
document.getElementById('github-login')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });
    if (error) console.error(error);
});
// --- TOGGLE FORMULAIRE ---
registerBtn.addEventListener('click', () => container.classList.add('active'));
loginBtn.addEventListener('click', () => container.classList.remove('active'));

// --- ŒIL MOT DE PASSE ---
document.querySelectorAll('.eye-toggle').forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.getAttribute('data-target');
        const field = document.getElementById(targetId);
        if (field && field.type === 'password') {
            field.type = 'text';
            icon.classList.replace('bx-show', 'bx-hide');
        } else if (field) {
            field.type = 'password';
            icon.classList.replace('bx-hide', 'bx-show');
        }
    });
});