import { AuthManager } from './auth.js';
import { FlightsView } from './flights.js';
import { AirbnbView } from './airbnb.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar autenticación
  AuthManager.init();

  // Escuchar cuando el usuario esté autenticado para cargar datos
  window.addEventListener('auth:ready', () => {
    FlightsView.loadInitialData();
    AirbnbView.loadInitialData();
  });

  // Configuración de pestañas del Dashboard
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabSections = {
    'tab-overview': document.getElementById('section-overview'),
    'tab-flights': document.getElementById('section-flights'),
    'tab-airbnb': document.getElementById('section-airbnb'),
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Cambiar clase activa en botones
      tabButtons.forEach((b) => b.classList.remove('active', 'bg-white', 'text-[#222222]', 'shadow-sm'));
      btn.classList.add('active', 'bg-white', 'text-[#222222]', 'shadow-sm');

      // Ocultar todas las secciones y mostrar la elegida
      Object.values(tabSections).forEach((sec) => {
        if (sec) sec.classList.add('hidden');
      });

      if (tabSections[target]) {
        tabSections[target].classList.remove('hidden');
      }

      // Si cambia a vuelos o airbnb, redibujar charts si es necesario
      if (target === 'tab-flights') {
        window.dispatchEvent(new Event('resize'));
      } else if (target === 'tab-airbnb') {
        window.dispatchEvent(new Event('resize'));
      }
    });
  });
});
