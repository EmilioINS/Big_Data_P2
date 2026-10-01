/**
 * API Service Client con soporte para Token JWT Bearer
 */

const API_BASE = '/api';

export const ApiClient = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        this.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error(data.message || 'Sesión expirada o no autorizada.');
      }

      if (!response.ok) {
        throw new Error(data.message || `Error del servidor (${response.status})`);
      }

      return data;
    } catch (error) {
      console.error(`Error en API [${endpoint}]:`, error);
      throw error;
    }
  },

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  // Flights queries
  async getTopAirports(country = 'SPAIN', type = 'destination') {
    const params = new URLSearchParams({ country, type });
    return this.request(`/flights/top-airports?${params.toString()}`);
  },

  async getMonthlyPerformance() {
    return this.request('/flights/monthly-performance');
  },

  async getProfitableRoutes(minFlights = 70, limit = 50) {
    const params = new URLSearchParams({ minFlights, limit });
    return this.request(`/flights/profitable-routes?${params.toString()}`);
  },

  async getMonthlyRanking(top = 5) {
    const params = new URLSearchParams({ top });
    return this.request(`/flights/monthly-ranking?${params.toString()}`);
  },

  async getAvailableCountries() {
    return this.request('/flights/countries');
  },

  // Airbnb queries
  async getAvgPriceByProperty() {
    return this.request('/airbnb/price-by-property');
  },

  async filterAmenitiesAndRating(minAmenities = 5, minRating = 90, limit = 50) {
    const params = new URLSearchParams({ minAmenities, minRating, limit });
    return this.request(`/airbnb/filter-amenities-rating?${params.toString()}`);
  },

  async getTopReviewers(limit = 5) {
    const params = new URLSearchParams({ limit });
    return this.request(`/airbnb/top-reviewers?${params.toString()}`);
  },

  async searchReviews(text = 'Great Location', limit = 50) {
    const params = new URLSearchParams({ text, limit });
    return this.request(`/airbnb/search-reviews?${params.toString()}`);
  },
};

/**
 * Toast notifications helper
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-[#FF385C] border-[#E00B41] text-white shadow-xl',
    error: 'bg-[#222222] border-[#484848] text-white shadow-xl',
    info: 'bg-[#008489] border-[#006C70] text-white shadow-xl',
    warning: 'bg-[#FFB400] border-[#E5A300] text-[#222222] shadow-xl',
  };

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-sm font-medium transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto opacity-70 hover:opacity-100">&times;</button>
  `;

  toast.querySelector('button').onclick = () => toast.remove();
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
