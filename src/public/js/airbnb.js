import { ApiClient, showToast } from './api.js';

let chartPropertyPrice = null;
let chartTopReviewers = null;

export const AirbnbView = {
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindEvents();
  },

  async loadInitialData() {
    this.init();
    await Promise.all([
      this.loadPriceByProperty(),
      this.loadFilteredListings(),
      this.loadTopReviewers(),
      this.loadSearchReviews(),
    ]);
  },

  bindEvents() {
    // Formulario consulta 3.2 (Comodidades y Rating)
    const formAmenities = document.getElementById('form-amenities-rating');
    if (formAmenities) {
      formAmenities.onsubmit = (e) => {
        e.preventDefault();
        this.loadFilteredListings();
      };
    }

    // Selector límite consulta 3.3 (Top Revisores)
    const selectLimit = document.getElementById('select-reviewers-limit');
    if (selectLimit) {
      selectLimit.onchange = () => {
        this.loadTopReviewers();
      };
    }

    // Formulario consulta 3.4 (Buscador de Reseñas)
    const formSearch = document.getElementById('form-search-reviews');
    if (formSearch) {
      formSearch.onsubmit = (e) => {
        e.preventDefault();
        this.loadSearchReviews();
      };
    }
  },

  // ==========================================
  // CONSULTA 3.1: Precio medio por tipo de propiedad
  // ==========================================
  async loadPriceByProperty() {
    try {
      const res = await ApiClient.getAvgPriceByProperty();
      const data = res.data || [];

      // Render tabla
      const tbody = document.getElementById('table-property-price-body');
      if (tbody) {
        tbody.innerHTML = data
          .map(
            (row, idx) => `
          <tr class="hover:bg-[#253122]/40 transition">
            <td class="font-bold text-[#BAC8B1]/70">#${idx + 1}</td>
            <td class="font-semibold text-white">${row.property_type}</td>
            <td class="text-right font-mono font-bold text-[#7B9669]">$${row.precio_promedio.toLocaleString()}</td>
            <td class="text-right text-[#6C8480] font-semibold">${row.total_anuncios.toLocaleString()}</td>
          </tr>`
          )
          .join('');
      }

      this.renderPropertyPriceChart(data.slice(0, 8));
    } catch (error) {
      showToast(`Error al cargar precios por propiedad: ${error.message}`, 'error');
    }
  },

  renderPropertyPriceChart(data) {
    const ctx = document.getElementById('chart-property-price')?.getContext('2d');
    if (!ctx || data.length === 0) return;

    if (chartPropertyPrice) chartPropertyPrice.destroy();

    const labels = data.map((d) => d.property_type);
    const prices = data.map((d) => d.precio_promedio);

    chartPropertyPrice = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Precio Promedio ($ USD)',
            data: prices,
            backgroundColor: 'rgba(123, 150, 105, 0.85)', // #7B9669
            borderColor: '#7B9669',
            borderWidth: 1.5,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(28, 37, 26, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#E6E6E6',
            borderColor: 'rgba(186, 200, 177, 0.3)',
            borderWidth: 1,
            callbacks: {
              label: (context) => ` Precio promedio: $${context.parsed.y} USD`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#BAC8B1', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(186, 200, 177, 0.08)' },
            ticks: { color: '#7B9669', callback: (v) => `$${v}` },
          },
        },
      },
    });
  },

  // ==========================================
  // CONSULTA 3.2: Filtro por Comodidades y Rating
  // ==========================================
  async loadFilteredListings() {
    const minAmenities = parseInt(document.getElementById('input-min-amenities')?.value, 10) || 5;
    const minRating = parseFloat(document.getElementById('input-min-rating')?.value) || 90;
    const container = document.getElementById('listings-cards-container');
    const countBadge = document.getElementById('listings-count-badge');

    try {
      if (container) {
        container.innerHTML = `<div class="col-span-full py-12 text-center"><span class="spinner inline-block"></span><p class="mt-2 text-sm text-[#BAC8B1]">Filtrando anuncios...</p></div>`;
      }

      const res = await ApiClient.filterAmenitiesAndRating(minAmenities, minRating, 30);
      const data = res.data || [];

      if (countBadge) {
        countBadge.textContent = `${data.length} encontrados`;
      }

      if (container) {
        if (data.length === 0) {
          container.innerHTML = `<div class="col-span-full py-12 text-center text-[#BAC8B1]/70">No se encontraron propiedades con esos criterios.</div>`;
          return;
        }

        container.innerHTML = data
          .map(
            (item) => `
          <div class="glass-card p-5 flex flex-col justify-between hover:border-[#7B9669]/60 transition group">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#7B9669]/20 text-[#BAC8B1] border border-[#7B9669]/30">
                  ${item.property_type}
                </span>
                <div class="flex items-center text-[#BAC8B1] text-xs font-bold gap-1 bg-[#404E3B]/60 px-2 py-0.5 rounded border border-[#BAC8B1]/20">
                  ★ ${item.review_scores_rating || 'N/A'}/100
                </div>
              </div>
              <h4 class="font-bold text-white text-sm mb-2 line-clamp-2 group-hover:text-[#BAC8B1] transition">
                ${item.name || 'Sin título'}
              </h4>
              <p class="text-xs text-[#BAC8B1]/80 mb-3 flex items-center gap-2">
                <span>🛋️ <strong>${item.total_amenities}</strong> comodidades</span>
                <span>•</span>
                <span>👥 ${item.accommodates || 1} huéspedes</span>
              </p>
            </div>
            <div class="pt-3 border-t border-[#404E3B]/60 flex items-center justify-between">
              <div>
                <span class="text-lg font-extrabold text-[#7B9669]">$${item.price || 0}</span>
                <span class="text-xs text-[#BAC8B1]/60"> / noche</span>
              </div>
              ${
                item.listing_url
                  ? `<a href="${item.listing_url}" target="_blank" rel="noopener" class="text-xs text-[#BAC8B1] hover:text-white font-medium flex items-center gap-1">Ver en Airbnb &rarr;</a>`
                  : ''
              }
            </div>
          </div>`
          )
          .join('');
      }
    } catch (error) {
      showToast(`Error al filtrar anuncios: ${error.message}`, 'error');
    }
  },

  // ==========================================
  // CONSULTA 3.3: Top Revisores
  // ==========================================
  async loadTopReviewers() {
    const limit = parseInt(document.getElementById('select-reviewers-limit')?.value, 10) || 5;

    try {
      const res = await ApiClient.getTopReviewers(limit);
      const data = res.data || [];

      // Render tabla
      const tbody = document.getElementById('table-top-reviewers-body');
      const medals = ['🥇', '🥈', '🥉', '4º', '5º'];

      if (tbody) {
        tbody.innerHTML = data
          .map(
            (row, idx) => `
          <tr class="hover:bg-[#253122]/40 transition">
            <td class="font-bold text-lg">${medals[idx] || `#${idx + 1}`}</td>
            <td class="font-semibold text-white flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7B9669] to-[#6C8480] flex items-center justify-center text-xs font-bold text-white uppercase">
                ${row.reviewer_name?.charAt(0) || 'U'}
              </div>
              ${row.reviewer_name}
            </td>
            <td class="text-[#BAC8B1]/70 font-mono text-xs">${row.reviewer_id}</td>
            <td class="text-right font-bold text-[#BAC8B1] font-mono">${row.total_resenas} reseñas</td>
          </tr>`
          )
          .join('');
      }

      this.renderReviewersChart(data);
    } catch (error) {
      showToast(`Error al cargar revisores: ${error.message}`, 'error');
    }
  },

  renderReviewersChart(data) {
    const ctx = document.getElementById('chart-top-reviewers')?.getContext('2d');
    if (!ctx || data.length === 0) return;

    if (chartTopReviewers) chartTopReviewers.destroy();

    const labels = data.map((d) => d.reviewer_name);
    const counts = data.map((d) => d.total_resenas);

    chartTopReviewers = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Reseñas Escritas',
            data: counts,
            backgroundColor: 'rgba(108, 132, 128, 0.85)', // #6C8480
            borderColor: '#6C8480',
            borderRadius: 8,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(28, 37, 26, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#E6E6E6',
            borderColor: 'rgba(186, 200, 177, 0.3)',
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(186, 200, 177, 0.08)' },
            ticks: { color: '#BAC8B1', stepSize: 2 },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#E6E6E6', font: { weight: '600' } },
          },
        },
      },
    });
  },

  // ==========================================
  // CONSULTA 3.4: Búsqueda de Texto en Reseñas
  // ==========================================
  async loadSearchReviews() {
    const searchInput = document.getElementById('input-search-text');
    const text = searchInput?.value?.trim() || 'Great Location';
    const container = document.getElementById('reviews-results-container');
    const countBadge = document.getElementById('search-reviews-count-badge');

    try {
      if (container) {
        container.innerHTML = `<div class="py-12 text-center"><span class="spinner inline-block"></span><p class="mt-2 text-sm text-[#BAC8B1]">Buscando menciones de "${text}"...</p></div>`;
      }

      const res = await ApiClient.searchReviews(text, 25);
      const data = res.data || [];

      if (countBadge) {
        countBadge.textContent = `${data.length} coincidencias encontradas`;
      }

      if (container) {
        if (data.length === 0) {
          container.innerHTML = `<div class="py-12 text-center text-[#BAC8B1]/70">No se encontraron reseñas que contengan el texto solicitado.</div>`;
          return;
        }

        const regex = new RegExp(`(${text})`, 'gi');

        container.innerHTML = data
          .map((item) => {
            const highlighted = (item.comentario || '').replace(
              regex,
              '<mark class="bg-[#7B9669]/40 text-[#BAC8B1] px-1 rounded font-semibold border border-[#7B9669]/50">$1</mark>'
            );

            return `
            <div class="glass-card p-5 hover:border-[#7B9669]/60 transition">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 class="font-bold text-white text-sm mb-1">${item.nombre_propiedad}</h4>
                  <p class="text-xs text-[#BAC8B1] font-medium flex items-center gap-1">
                    <span>✍️ Reseña por:</span>
                    <strong class="text-white">${item.nombre_reviewer || 'Anónimo'}</strong>
                  </p>
                </div>
              </div>
              <blockquote class="text-xs text-[#E6E6E6] leading-relaxed bg-[#1b2319]/80 p-3.5 rounded-lg border border-[#404E3B] italic">
                "${highlighted}"
              </blockquote>
            </div>`;
          })
          .join('');
      }
    } catch (error) {
      showToast(`Error en búsqueda de reseñas: ${error.message}`, 'error');
    }
  },
};
