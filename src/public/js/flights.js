import { ApiClient, showToast } from './api.js';

let chartTopAirports = null;
let chartMonthlyPerf = null;
let chartRanking = null;

export const FlightsView = {
  initialized: false,
  allRankingData: [],
  allMonthlyData: [],

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindEvents();
    this.loadCountries();
  },

  async loadInitialData() {
    this.init();
    await Promise.all([
      this.loadTopAirports(),
      this.loadMonthlyPerformance(),
      this.loadProfitableRoutes(),
      this.loadMonthlyRanking(),
    ]);
  },

  async loadCountries() {
    try {
      const res = await ApiClient.getAvailableCountries();
      const select = document.getElementById('select-country');
      if (select && res.data) {
        select.innerHTML = res.data
          .map((c) => `<option value="${c}" ${c === 'SPAIN' ? 'selected' : ''}>${c}</option>`)
          .join('');
      }
    } catch (e) {
      console.error('Error cargando países:', e);
    }
  },

  bindEvents() {
    // Formulario consulta 2.1
    const form21 = document.getElementById('form-top-airports');
    if (form21) {
      form21.onsubmit = (e) => {
        e.preventDefault();
        this.loadTopAirports();
      };
    }

    // Filtro mes en consulta 2.4
    const selectMonthRank = document.getElementById('filter-ranking-month');
    if (selectMonthRank) {
      selectMonthRank.onchange = () => {
        this.renderMonthlyRankingTable(selectMonthRank.value);
      };
    }
  },

  // ==========================================
  // CONSULTA 2.1: Top 3 Aeropuertos
  // ==========================================
  async loadTopAirports() {
    const country = document.getElementById('select-country')?.value || 'SPAIN';
    const type = document.querySelector('input[name="airport-type"]:checked')?.value || 'destination';
    const tbody = document.getElementById('table-top-airports-body');
    const loadingEl = document.getElementById('loading-top-airports');

    try {
      if (loadingEl) loadingEl.classList.remove('hidden');
      const res = await ApiClient.getTopAirports(country, type);
      const data = res.data || [];

      // Render tabla
      if (tbody) {
        if (data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-[#717171]">No se encontraron aeropuertos para el país seleccionado.</td></tr>`;
        } else {
          tbody.innerHTML = data
            .map(
              (row, idx) => `
            <tr class="hover:bg-[#F9FAFB] transition">
              <td class="font-bold text-[#FF385C]">#${idx + 1}</td>
              <td class="font-bold text-[#222222]">${row.aeropuerto}</td>
              <td><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F7F7] text-[#717171] border border-[#EBEBEB]">${row.pais}</span></td>
              <td class="text-[#222222] font-semibold">${row.total_visitantes.toLocaleString()}</td>
              <td class="text-[#008489] font-bold">${row.total_vuelos.toLocaleString()}</td>
            </tr>`
            )
            .join('');
        }
      }

      this.renderTopAirportsChart(data, country, type);
    } catch (error) {
      showToast(`Error al consultar aeropuertos: ${error.message}`, 'error');
    } finally {
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  },

  renderTopAirportsChart(data, country, type) {
    const ctx = document.getElementById('chart-top-airports')?.getContext('2d');
    if (!ctx) return;

    if (chartTopAirports) chartTopAirports.destroy();

    const labels = data.map((d) => d.aeropuerto);
    const visitantes = data.map((d) => d.total_visitantes);
    const vuelos = data.map((d) => d.total_vuelos);

    chartTopAirports = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Visitantes',
            data: visitantes,
            backgroundColor: 'rgba(255, 56, 92, 0.85)', // #FF385C
            borderColor: '#FF385C',
            borderWidth: 1.5,
            borderRadius: 8,
            yAxisID: 'y',
          },
          {
            label: 'Total Vuelos',
            data: vuelos,
            backgroundColor: 'rgba(0, 132, 137, 0.85)', // #008489
            borderColor: '#008489',
            borderWidth: 1.5,
            borderRadius: 8,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#222222', font: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' } },
          },
          tooltip: {
            backgroundColor: '#FFFFFF',
            titleColor: '#222222',
            bodyColor: '#717171',
            borderColor: '#DDDDDD',
            borderWidth: 1,
            padding: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#717171', font: { weight: '600' } },
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: '#EBEBEB' },
            ticks: { color: '#FF385C', font: { weight: 'bold' } },
            title: { display: true, text: 'Visitantes', color: '#FF385C' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#008489', font: { weight: 'bold' } },
            title: { display: true, text: 'Vuelos', color: '#008489' },
          },
        },
      },
    });
  },

  // ==========================================
  // CONSULTA 2.2: Desempeño Mensual
  // ==========================================
  async loadMonthlyPerformance() {
    try {
      const res = await ApiClient.getMonthlyPerformance();
      this.allMonthlyData = res.data || [];

      // Render tabla
      const tbody = document.getElementById('table-monthly-perf-body');
      if (tbody) {
        tbody.innerHTML = this.allMonthlyData
          .slice(0, 25)
          .map(
            (row) => `
          <tr class="hover:bg-[#F9FAFB] transition">
            <td class="font-mono text-[#717171] font-bold">${row.anio} - M${row.mes.toString().padStart(2, '0')}</td>
            <td class="font-bold text-[#222222]">${row.aerolinea}</td>
            <td class="text-[#008489] font-bold">${row.total_vuelos.toLocaleString()}</td>
            <td class="text-[#222222] font-semibold">${row.total_pasajeros.toLocaleString()}</td>
            <td class="text-[#FF385C] font-black">$${row.total_ganancias.toLocaleString()}</td>
            <td>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-[#222222]">${row.promedio_factor_ocupacion}%</span>
                <div class="w-16 bg-[#EBEBEB] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#FF385C] h-full rounded-full" style="width: ${row.promedio_factor_ocupacion}%"></div>
                </div>
              </div>
            </td>
          </tr>`
          )
          .join('');
      }

      this.renderMonthlyPerfChart();
    } catch (error) {
      showToast(`Error al cargar desempeño mensual: ${error.message}`, 'error');
    }
  },

  renderMonthlyPerfChart() {
    const ctx = document.getElementById('chart-monthly-perf')?.getContext('2d');
    if (!ctx || this.allMonthlyData.length === 0) return;

    if (chartMonthlyPerf) chartMonthlyPerf.destroy();

    const monthlyTotals = {};
    for (const d of this.allMonthlyData) {
      const key = `${d.anio}-${d.mes.toString().padStart(2, '0')}`;
      if (!monthlyTotals[key]) {
        monthlyTotals[key] = { key, ganancias: 0, pasajeros: 0, vuelos: 0 };
      }
      monthlyTotals[key].ganancias += d.total_ganancias;
      monthlyTotals[key].pasajeros += d.total_pasajeros;
      monthlyTotals[key].vuelos += d.total_vuelos;
    }

    const months = Object.keys(monthlyTotals).sort();
    const revData = months.map((m) => Math.round(monthlyTotals[m].ganancias / 1000000));
    const passData = months.map((m) => Math.round(monthlyTotals[m].pasajeros / 1000));

    chartMonthlyPerf = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Ingresos Totales (Millones USD)',
            data: revData,
            borderColor: '#FF385C',
            backgroundColor: 'rgba(255, 56, 92, 0.08)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y',
          },
          {
            label: 'Pasajeros Totales (Miles)',
            data: passData,
            borderColor: '#008489',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.35,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#222222', font: { weight: 'bold' } } },
        },
        scales: {
          x: { grid: { color: '#EBEBEB' }, ticks: { color: '#717171' } },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: '#EBEBEB' },
            ticks: { color: '#FF385C', callback: (v) => `$${v}M`, font: { weight: 'bold' } },
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#008489', callback: (v) => `${v}k`, font: { weight: 'bold' } },
          },
        },
      },
    });
  },

  // ==========================================
  // CONSULTA 2.3: Top 50 Rutas Más Rentables
  // ==========================================
  async loadProfitableRoutes() {
    try {
      const res = await ApiClient.getProfitableRoutes(70, 50);
      const data = res.data || [];
      const tbody = document.getElementById('table-profitable-routes-body');

      if (tbody) {
        tbody.innerHTML = data
          .map(
            (r, i) => `
          <tr class="hover:bg-[#F9FAFB] transition">
            <td class="font-bold text-[#717171]">#${i + 1}</td>
            <td class="font-bold text-[#222222]">${r.aeropuerto_origen}</td>
            <td class="font-bold text-[#FF385C]">✈️ ${r.aeropuerto_destino}</td>
            <td class="text-center font-mono text-[#008489] font-bold">${r.total_vuelos}</td>
            <td class="text-right text-[#222222] font-semibold">${r.total_pasajeros.toLocaleString()}</td>
            <td class="text-right font-black text-[#FF385C]">$${r.total_ganancias.toLocaleString()}</td>
            <td class="text-right font-mono font-bold text-[#222222]">$${r.promedio_ganancias_vuelo.toLocaleString()}</td>
            <td>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0F2] text-[#FF385C] border border-[#FF385C]/20">
                ${r.promedio_factor_ocupacion}%
              </span>
            </td>
          </tr>`
          )
          .join('');
      }
    } catch (error) {
      showToast(`Error al cargar rutas rentables: ${error.message}`, 'error');
    }
  },

  // ==========================================
  // CONSULTA 2.4: Ranking Mensual Top 5
  // ==========================================
  async loadMonthlyRanking() {
    try {
      const res = await ApiClient.getMonthlyRanking(5);
      this.allRankingData = res.data || [];

      // Llenar selector de mes
      const months = [...new Set(this.allRankingData.map((d) => `${d.anio}-${d.mes.toString().padStart(2, '0')}`))];
      const select = document.getElementById('filter-ranking-month');
      if (select) {
        select.innerHTML = `
          <option value="all">Todos los meses</option>
          ${months.map((m) => `<option value="${m}">${m}</option>`).join('')}
        `;
      }

      this.renderMonthlyRankingTable('all');
      this.renderRankingChart();
    } catch (error) {
      showToast(`Error al cargar ranking mensual: ${error.message}`, 'error');
    }
  },

  renderMonthlyRankingTable(monthFilter) {
    const tbody = document.getElementById('table-ranking-body');
    if (!tbody) return;

    const filtered =
      monthFilter === 'all'
        ? this.allRankingData
        : this.allRankingData.filter((d) => `${d.anio}-${d.mes.toString().padStart(2, '0')}` === monthFilter);

    const medals = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4º', 5: '5º' };

    tbody.innerHTML = filtered
      .map(
        (r) => `
      <tr class="hover:bg-[#F9FAFB] transition">
        <td class="font-mono text-[#717171] font-bold">${r.anio}-${r.mes.toString().padStart(2, '0')}</td>
        <td class="font-bold text-base">${medals[r.posicion_jerarquia_mensual] || r.posicion_jerarquia_mensual}</td>
        <td class="font-bold text-[#222222]">${r.nombre_aerolinea}</td>
        <td class="text-right font-black text-[#FF385C]">$${r.total_ganancias.toLocaleString()}</td>
        <td class="text-right text-[#008489] font-bold">${r.total_vuelos.toLocaleString()}</td>
        <td class="text-right text-[#222222] font-semibold">${r.total_pasajeros.toLocaleString()}</td>
      </tr>`
      )
      .join('');
  },

  renderRankingChart() {
    const ctx = document.getElementById('chart-ranking')?.getContext('2d');
    if (!ctx || this.allRankingData.length === 0) return;

    if (chartRanking) chartRanking.destroy();

    const totals = {};
    for (const d of this.allRankingData) {
      totals[d.nombre_aerolinea] = (totals[d.nombre_aerolinea] || 0) + d.total_ganancias;
    }

    const sortedAirlines = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
    const labels = sortedAirlines.slice(0, 6);
    const data = labels.map((l) => Math.round(totals[l] / 1000000));

    // Paleta estilo Airbnb
    chartRanking = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos acumulados en Top 5 (Millones USD)',
            data,
            backgroundColor: [
              '#FF385C',
              '#E00B41',
              '#008489',
              '#FFB400',
              '#484848',
              '#717171',
            ],
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
        },
        scales: {
          x: {
            grid: { color: '#EBEBEB' },
            ticks: { color: '#717171', callback: (v) => `$${v}M`, font: { weight: 'bold' } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#222222', font: { weight: 'bold' } },
          },
        },
      },
    });
  },
};
