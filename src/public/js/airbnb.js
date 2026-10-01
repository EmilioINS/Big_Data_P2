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
          <tr class="hover:bg-[#F9FAFB] transition">
            <td class="font-bold text-[#717171]">#${idx + 1}</td>
            <td class="font-bold text-[#222222]">${row.property_type}</td>
            <td class="text-right font-mono font-bold text-[#FF385C]">$${row.precio_promedio.toLocaleString()}</td>
            <td class="text-right text-[#008489] font-bold">${row.total_anuncios.toLocaleString()}</td>
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
            backgroundColor: 'rgba(255, 56, 92, 0.85)', // #FF385C
            borderColor: '#FF385C',
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
            backgroundColor: '#FFFFFF',
            titleColor: '#222222',
            bodyColor: '#717171',
            borderColor: '#DDDDDD',
            borderWidth: 1,
            callbacks: {
              label: (context) => ` Precio promedio: $${context.parsed.y} USD`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#717171', font: { size: 11, weight: 'bold' } },
          },
          y: {
            grid: { color: '#EBEBEB' },
            ticks: { color: '#FF385C', callback: (v) => `$${v}`, font: { weight: 'bold' } },
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
        container.innerHTML = `<div class="col-span-full py-12 text-center"><span class="spinner inline-block"></span><p class="mt-2 text-sm text-[#717171]">Buscando alojamientos...</p></div>`;
      }

      const res = await ApiClient.filterAmenitiesAndRating(minAmenities, minRating, 30);
      const data = res.data || [];

      if (countBadge) {
        countBadge.textContent = `${data.length} encontrados`;
      }

      if (container) {
        if (data.length === 0) {
          container.innerHTML = `<div class="col-span-full py-12 text-center text-[#717171]">No se encontraron propiedades con esos criterios.</div>`;
          return;
        }

        container.innerHTML = data
          .map(
            (item) => `
          <div class="glass-card p-5 flex flex-col justify-between bg-white border border-[#EBEBEB] rounded-2xl hover:shadow-xl transition group">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F7F7F7] text-[#222222] border border-[#EBEBEB]">
                  ${item.property_type}
                </span>
                <div class="flex items-center text-[#222222] text-xs font-bold gap-1 bg-[#F7F7F7] px-2 py-0.5 rounded-full border border-[#EBEBEB]">
                  ★ <span class="font-black text-[#222222]">${item.review_scores_rating || 'N/A'}</span>
                </div>
              </div>
              <h4 class="font-extrabold text-[#222222] text-sm mb-2 line-clamp-2 group-hover:text-[#FF385C] transition">
                ${item.name || 'Alojamiento en Airbnb'}
              </h4>
              <p class="text-xs text-[#717171] mb-3 flex items-center gap-2">
                <span>🛋️ <strong>${item.total_amenities}</strong> comodidades</span>
                <span>•</span>
                <span>👥 ${item.accommodates || 1} huéspedes</span>
              </p>
            </div>
            <div class="pt-3 border-t border-[#EBEBEB] flex items-center justify-between">
              <div>
                <span class="text-xl font-black text-[#222222]">$${item.price || 0}</span>
                <span class="text-xs text-[#717171]"> / noche</span>
              </div>
              ${
                item.listing_url
                  ? `<a href="${item.listing_url}" target="_blank" rel="noopener" class="text-xs text-[#FF385C] hover:underline font-bold flex items-center gap-1">Ver anuncio &rarr;</a>`
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
          <tr class="hover:bg-[#F9FAFB] transition">
            <td class="font-bold text-lg">${medals[idx] || `#${idx + 1}`}</td>
            <td class="font-bold text-[#222222] flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-[#FF385C] flex items-center justify-center text-xs font-black text-white uppercase shadow-sm">
                ${row.reviewer_name?.charAt(0) || 'U'}
              </div>
              ${row.reviewer_name}
            </td>
            <td class="text-[#717171] font-mono text-xs">${row.reviewer_id}</td>
            <td class="text-right font-black text-[#FF385C] font-mono">${row.total_resenas} reseñas</td>
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
            backgroundColor: 'rgba(0, 132, 137, 0.85)', // #008489
            borderColor: '#008489',
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
            backgroundColor: '#FFFFFF',
            titleColor: '#222222',
            bodyColor: '#717171',
            borderColor: '#DDDDDD',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: '#EBEBEB' },
            ticks: { color: '#717171', stepSize: 2, font: { weight: 'bold' } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#222222', font: { weight: 'bold' } },
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
        container.innerHTML = `<div class="py-12 text-center"><span class="spinner inline-block"></span><p class="mt-2 text-sm text-[#717171]">Buscando menciones de "${text}"...</p></div>`;
      }

      const res = await ApiClient.searchReviews(text, 25);
      const data = res.data || [];

      if (countBadge) {
        countBadge.textContent = `${data.length} menciones`;
      }

      if (container) {
        if (data.length === 0) {
          container.innerHTML = `<div class="py-12 text-center text-[#717171]">No se encontraron reseñas que contengan el texto solicitado.</div>`;
          return;
        }

        const regex = new RegExp(`(${text})`, 'gi');

        container.innerHTML = data
          .map((item) => {
            const highlighted = (item.comentario || '').replace(
              regex,
              '<mark class="bg-[#FFF0F2] text-[#FF385C] px-1 rounded font-bold border border-[#FF385C]/30">$1</mark>'
            );

            return `
            <div class="glass-card p-5 bg-white border border-[#EBEBEB] rounded-2xl hover:shadow-md transition">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 class="font-extrabold text-[#222222] text-sm mb-1">${item.nombre_propiedad}</h4>
                  <p class="text-xs text-[#717171] font-semibold flex items-center gap-1">
                    <span>✍️ Reseña por:</span>
                    <strong class="text-[#222222]">${item.nombre_reviewer || 'Huésped'}</strong>
                  </p>
                </div>
              </div>
              <blockquote class="text-xs text-[#484848] leading-relaxed bg-[#F7F7F7] p-4 rounded-xl border border-[#EBEBEB] italic">
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
