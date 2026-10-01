import { ApiClient, showToast } from './api.js';

export const AuthManager = {
  init() {
    this.bindEvents();
    this.checkAuthState();

    window.addEventListener('auth:expired', () => {
      showToast('Tu sesión ha expirado. Inicia sesión nuevamente.', 'warning');
      this.checkAuthState();
    });
  },

  checkAuthState() {
    const token = ApiClient.getToken();
    const user = ApiClient.getCurrentUser();

    const authModal = document.getElementById('auth-modal');
    const userProfileEl = document.getElementById('user-profile-header');
    const userNameEl = document.getElementById('user-display-name');
    const userEmailEl = document.getElementById('user-display-email');
    const dashboardContent = document.getElementById('dashboard-content');

    if (token && user) {
      authModal.classList.add('hidden');
      dashboardContent.classList.remove('hidden');
      userProfileEl.classList.remove('hidden');
      if (userNameEl) userNameEl.textContent = user.name;
      if (userEmailEl) userEmailEl.textContent = user.email;

      // Disparar carga de datos del dashboard
      window.dispatchEvent(new CustomEvent('auth:ready'));
    } else {
      authModal.classList.remove('hidden');
      dashboardContent.classList.add('hidden');
      userProfileEl.classList.add('hidden');
    }
  },

  bindEvents() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('btn-show-register');
    const showLoginBtn = document.getElementById('btn-show-login');
    const logoutBtn = document.getElementById('btn-logout');

    if (showRegisterBtn) {
      showRegisterBtn.onclick = (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
      };
    }

    if (showLoginBtn) {
      showLoginBtn.onclick = (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      };
    }

    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="spinner inline-block mr-2"></span> Autenticando...`;

          const res = await ApiClient.login(email, password);
          showToast(`¡Bienvenido de nuevo, ${res.user.name}!`, 'success');
          this.checkAuthState();
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Iniciar Sesión`;
        }
      };
    }

    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="spinner inline-block mr-2"></span> Registrando...`;

          const res = await ApiClient.register(name, email, password);
          showToast('¡Registro exitoso! Sesión iniciada automáticamente.', 'success');
          this.checkAuthState();
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Crear Cuenta`;
        }
      };
    }

    if (logoutBtn) {
      logoutBtn.onclick = () => {
        ApiClient.clearAuth();
        showToast('Sesión cerrada correctamente.', 'info');
        this.checkAuthState();
      };
    }
  },
};
