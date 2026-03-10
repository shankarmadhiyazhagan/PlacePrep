document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleBtns = document.querySelectorAll('.auth-toggle-btn');

    // Toggle between login and register
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'login') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        });
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = loginForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Signing in...';

        try {
            const data = await API.login({
                username: document.getElementById('login-username').value,
                password: document.getElementById('login-password').value
            });

            API.setToken(data.access_token);
            API.setUser(data.user);
            window.location.href = '/dashboard.html';
        } catch (err) {
            App.showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Sign In';
        }
    });

    // Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = registerForm.querySelector('button[type="submit"]');
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (password !== confirm) {
            App.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 4) {
            App.showToast('Password must be at least 4 characters', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Creating account...';

        try {
            const data = await API.register({
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                full_name: document.getElementById('reg-fullname').value,
                password: password,
                target_role: document.getElementById('reg-role').value
            });

            API.setToken(data.access_token);
            API.setUser(data.user);
            App.showToast('Welcome to PlacePrep! +50 XP 🎉', 'xp');
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 1000);
        } catch (err) {
            App.showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Create Account';
        }
    });

    // Redirect if already logged in
    if (API.isLoggedIn()) {
        window.location.href = '/dashboard.html';
    }
});
