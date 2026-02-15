// ===== DOM Elements =====
const csvUpload      = document.getElementById('csvUpload');
const dropZone       = document.getElementById('dropZone');
const fileInfo       = document.getElementById('fileInfo');
const fileName       = document.getElementById('fileName');
const fileRows       = document.getElementById('fileRows');
const clearFile      = document.getElementById('clearFile');
const statsCard      = document.getElementById('statsCard');
const statsGrid      = document.getElementById('statsGrid');
const numericStatsSection = document.getElementById('numericStatsSection');
const numericStatsHead = document.getElementById('numericStatsHead');
const numericStatsBody = document.getElementById('numericStatsBody');
const controlsCard   = document.getElementById('controlsCard');
const columnSelect   = document.getElementById('columnSelect');
const filterCard     = document.getElementById('filterCard');
const filterChecks   = document.getElementById('filterChecks');
const filterSearch   = document.getElementById('filterSearch');
const selectAllBtn   = document.getElementById('selectAll');
const deselectAllBtn = document.getElementById('deselectAll');
const optionsCard    = document.getElementById('optionsCard');
const chartCard      = document.getElementById('chartCard');
const chartTitle     = document.getElementById('chartTitle');
const chartLayout    = document.getElementById('chartLayout');
const sideLegend     = document.getElementById('sideLegend');
const chartStats     = document.getElementById('chartStats');
const downloadChart  = document.getElementById('downloadChart');
const shareChartBtn  = document.getElementById('shareChart');
const shareToast     = document.getElementById('shareToast');
const animToggle     = document.getElementById('animToggle');
const themeToggle    = document.getElementById('themeToggle');
const crosstabCard   = document.getElementById('crosstabCard');
const crosstabCol1   = document.getElementById('crosstabCol1');
const crosstabCol2   = document.getElementById('crosstabCol2');
const crosstabChartWrap = document.getElementById('crosstabChartWrap');
const exportCard        = document.getElementById('exportCard');
const exportColSel      = document.getElementById('exportColumnSelect');
const exportFilterSec   = document.getElementById('exportFilterSection');
const exportChecks      = document.getElementById('exportChecks');
const exportSearch      = document.getElementById('exportSearch');
const exportSelectAll   = document.getElementById('exportSelectAll');
const exportDeselectAll = document.getElementById('exportDeselectAll');
const exportPreview     = document.getElementById('exportPreview');
const exportCount       = document.getElementById('exportCount');
const exportCsvBtn      = document.getElementById('exportCsvBtn');
const tableCard      = document.getElementById('tableCard');
const tableHead      = document.getElementById('tableHead');
const tableBody      = document.getElementById('tableBody');
const rowBadge       = document.getElementById('rowBadge');
const tableSearchInput = document.getElementById('tableSearch');
const downloadFullCsvBtn = document.getElementById('downloadFullCsv');

let parsedData     = [];
let headers        = [];
let chartInstance  = null;
let crosstabInstance = null;
let currentColumn  = '';
let allValueCounts = {};

let currentLabels   = [];
let currentData     = [];
let currentBgColors = [];

// ===== State =====
let chartType   = 'pie';
let paletteName = 'vibrant';
let useAnimations = true;

// ===== Table sort state =====
let sortColumn = null;
let sortDirection = null; // 'asc', 'desc', null

// ===== Color Palettes =====
const PALETTES = {
  vibrant: [
    '#6c5ce7','#00cec9','#fd79a8','#fdcb6e','#0984e3',
    '#e17055','#00b894','#e84393','#74b9ff','#55efc4',
    '#fab1a0','#81ecec','#a29bfe','#ffeaa7','#ff7675',
    '#636e72','#e056fd','#f9ca24','#eb4d4b','#22a6b3',
    '#7ed6df','#badc58','#f0932b','#30336b','#130f40'
  ],
  pastel: [
    '#b8e0d2','#d6c1e8','#eac4d5','#f7d9c4','#c4d7e0',
    '#f2e6c9','#c7ceea','#fbc2eb','#bbe1fa','#e2f0cb',
    '#ffdac1','#b5ead7','#c9c9ff','#f8e8d4','#d4f0f0',
    '#fce4ec','#e8daef','#dcedc1','#ffccbc','#d1c4e9'
  ],
  ocean: [
    '#0077b6','#00b4d8','#90e0ef','#023e8a','#48cae4',
    '#0096c7','#ade8f4','#caf0f8','#03045e','#0353a4',
    '#006d77','#83c5be','#edf6f9','#ffddd2','#e29578',
    '#168aad','#34a0a4','#52b69a','#76c893','#99d98c'
  ],
  sunset: [
    '#f94144','#f3722c','#f8961e','#f9844a','#f9c74f',
    '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
    '#e76f51','#264653','#2a9d8f','#e9c46a','#f4a261',
    '#8338ec','#3a86ff','#fb5607','#ff006e','#ffbe0b'
  ]
};

// =====================================================
// ===== FEATURE 1: Dark / Light Theme Toggle ==========
// =====================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('hya28-theme', theme);
}
// Load saved theme
const savedTheme = localStorage.getItem('hya28-theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
  // Redraw chart if exists (tooltip/grid colors change)
  if (chartInstance && currentColumn) renderFilteredChart();
});

// ===== FEATURE 5: Animation Toggle =====
const savedAnim = localStorage.getItem('hya28-animations');
if (savedAnim === 'false') { useAnimations = false; animToggle.classList.remove('active'); }

animToggle.addEventListener('click', () => {
  useAnimations = !useAnimations;
  animToggle.classList.toggle('active', useAnimations);
  localStorage.setItem('hya28-animations', useAnimations);
  if (chartInstance && currentColumn) renderFilteredChart();
});

// ===== Drag & Drop =====
dropZone.addEventListener('click', (e) => {
  // Don't trigger if clicking the Browse Files label (it already opens file dialog via 'for' attr)
  if (e.target.tagName === 'LABEL' || e.target.closest('label')) return;
  csvUpload.click();
});
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) handleFile(file);
});
csvUpload.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
clearFile.addEventListener('click', resetAll);

// ===== Parse CSV =====
function handleFile(file) {
  dropZone.innerHTML = '<p class="upload-text">⏳ Parsing file…</p>';
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    worker: true,
    complete(results) {
      parsedData = results.data;
      headers = results.meta.fields || [];

      dropZone.style.display = 'none';

      fileName.textContent = file.name;
      const sizeStr = file.size > 1048576
        ? (file.size / 1048576).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(1) + ' KB';
      fileRows.textContent = `${parsedData.length.toLocaleString()} rows · ${headers.length} cols · ${sizeStr}`;
      fileInfo.style.display = 'flex';

      showSummary();

      // Chart column selector
      columnSelect.innerHTML = '<option value="">— Choose a column —</option>';
      headers.forEach(h => {
        const o = document.createElement('option'); o.value = h; o.textContent = h;
        columnSelect.appendChild(o);
      });
      show(controlsCard);

      // Export column selector
      exportColSel.innerHTML = '<option value="">— Column —</option>';
      headers.forEach(h => {
        const o = document.createElement('option'); o.value = h; o.textContent = h;
        exportColSel.appendChild(o);
      });
      exportFilterSec.style.display = 'none';
      exportCsvBtn.disabled = true;
      exportPreview.style.display = 'none';
      show(exportCard);

      // Cross-tab selectors
      const resetSel = (sel, label) => {
        sel.innerHTML = `<option value="">— ${label} —</option>`;
        headers.forEach(h => {
          const o = document.createElement('option'); o.value = h; o.textContent = h;
          sel.appendChild(o);
        });
      };
      resetSel(crosstabCol1, 'Column A');
      resetSel(crosstabCol2, 'Column B');
      crosstabChartWrap.style.display = 'none';
      show(crosstabCard);

      renderTable();
      hide(filterCard); hide(optionsCard); hide(chartCard);
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

      // Check if URL has share hash
      tryRestoreFromHash();
    },
    error(err) { restoreDropZone(); alert('Error parsing CSV: ' + err.message); }
  });
}

function restoreDropZone() {
  dropZone.innerHTML = `
    <div class="upload-icon">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <p class="upload-text">Drag & drop your <strong>.csv</strong> file here</p>
    <p class="upload-or">or</p>
    <label for="csvUpload" class="btn-primary">Browse Files</label>
    <p class="upload-hint">Supports any standard CSV file</p>`;
}

// =====================================================
// ===== Summary + FEATURE 7: Numeric Stats ============
// =====================================================
function showSummary() {
  const numCols = headers.filter(h => parsedData.slice(0, 100).some(r => r[h] !== '' && !isNaN(parseFloat(r[h]))));
  statsGrid.innerHTML = [
    { label: 'Total Rows', value: parsedData.length.toLocaleString() },
    { label: 'Columns', value: headers.length },
    { label: 'Numeric Cols', value: numCols.length },
    { label: 'Text Cols', value: headers.length - numCols.length }
  ].map(s => `<div class="stat-box"><div class="stat-value">${s.value}</div><div class="stat-name">${s.label}</div></div>`).join('');

  // Numeric statistics
  if (numCols.length > 0) {
    numericStatsHead.innerHTML = '<tr><th>Column</th><th>Min</th><th>Max</th><th>Mean</th><th>Median</th><th>Std Dev</th></tr>';
    numericStatsBody.innerHTML = numCols.map(col => {
      const vals = parsedData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (vals.length === 0) return '';
      vals.sort((a, b) => a - b);
      const min = vals[0];
      const max = vals[vals.length - 1];
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const mid = Math.floor(vals.length / 2);
      const median = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
      const variance = vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
      const stdDev = Math.sqrt(variance);
      const fmt = v => Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
      return `<tr>
        <td style="color:var(--text);font-weight:600;">${esc(col)}</td>
        <td>${fmt(min)}</td><td>${fmt(max)}</td>
        <td>${fmt(mean)}</td><td>${fmt(median)}</td><td>${fmt(stdDev)}</td>
      </tr>`;
    }).join('');
    numericStatsSection.style.display = '';
  } else {
    numericStatsSection.style.display = 'none';
  }
  show(statsCard);
}

// ===== Column Selection =====
columnSelect.addEventListener('change', () => {
  currentColumn = columnSelect.value;
  if (!currentColumn) { hide(filterCard); hide(optionsCard); hide(chartCard); return; }
  computeAndShowFilters(currentColumn);
});

// ===== Compute Filters =====
function computeAndShowFilters(column) {
  allValueCounts = {};
  parsedData.forEach(row => {
    const val = (row[column] ?? '').toString().trim() || '(empty)';
    allValueCounts[val] = (allValueCounts[val] || 0) + 1;
  });
  const sorted = Object.entries(allValueCounts).sort((a, b) => b[1] - a[1]);
  filterChecks.innerHTML = sorted.map(([val, count]) => {
    const safeId = 'f_' + val.replace(/[^a-zA-Z0-9]/g, '_') + '_' + count;
    return `<label class="filter-check-item" for="${safeId}" data-search="${val.toLowerCase()}">
        <input type="checkbox" id="${safeId}" value="${esc(val)}" checked>
        <span class="check-label">${esc(val)}</span>
        <span class="check-count">${count.toLocaleString()}</span>
      </label>`;
  }).join('');
  filterSearch.value = '';
  show(filterCard); show(optionsCard);
  filterChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => renderFilteredChart());
  });
  renderFilteredChart();
}

// ===== Filter Search =====
filterSearch.addEventListener('input', () => {
  const q = filterSearch.value.toLowerCase();
  filterChecks.querySelectorAll('.filter-check-item').forEach(item => {
    item.classList.toggle('hidden', !item.dataset.search.includes(q));
  });
});

// ===== Select / Deselect All =====
selectAllBtn.addEventListener('click', () => {
  filterChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  renderFilteredChart();
});
deselectAllBtn.addEventListener('click', () => {
  filterChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderFilteredChart();
});

// ===== Options Toggles =====
document.getElementById('chartTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  document.querySelectorAll('#chartTypeToggle .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  chartType = btn.dataset.type;
  renderFilteredChart();
});

document.getElementById('paletteToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  document.querySelectorAll('#paletteToggle .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  paletteName = btn.dataset.palette;
  renderFilteredChart();
});

// ===== Render Chart =====
function renderFilteredChart() {
  const selected = new Set();
  filterChecks.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => selected.add(cb.value));

  const kept = [];
  let othersCount = 0;
  Object.entries(allValueCounts).sort((a, b) => b[1] - a[1]).forEach(([val, count]) => {
    if (selected.has(val)) kept.push([val, count]);
    else othersCount += count;
  });

  if (kept.length === 0 && othersCount === 0) { hide(chartCard); return; }
  if (othersCount > 0) kept.push(['Others', othersCount]);

  const labels   = kept.map(([l]) => l);
  const data     = kept.map(([, c]) => c);
  const palette  = PALETTES[paletteName] || PALETTES.vibrant;
  const bgColors = labels.map((_, i) => palette[i % palette.length]);
  const total    = data.reduce((a, b) => a + b, 0);

  currentLabels = labels; currentData = data; currentBgColors = bgColors;

  if (chartInstance) chartInstance.destroy();
  chartTitle.textContent = `Distribution of "${currentColumn}"`;
  show(chartCard);

  const isHbar = chartType === 'hbar';
  const isCircle = chartType === 'pie' || chartType === 'doughnut';

  // Side legend for circle charts
  if (isCircle) {
    chartLayout.classList.add('side-mode');
    sideLegend.innerHTML = labels.map((label, i) => {
      const pct = ((data[i] / total) * 100).toFixed(1);
      return `<div class="legend-item">
          <span class="legend-dot" style="background:${bgColors[i]}"></span>
          <span class="legend-text" title="${esc(label)}">${esc(label)}</span>
          <span class="legend-pct">${pct}%</span>
          <span class="legend-count">(${data[i].toLocaleString()})</span>
        </div>`;
    }).join('');
  } else {
    chartLayout.classList.remove('side-mode');
    sideLegend.innerHTML = '';
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tickColor = isDark ? '#8b8b9e' : '#6b6b80';

  const ctx = document.getElementById('dataChart').getContext('2d');

  const type = isHbar ? 'bar' : chartType;

  chartInstance = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderColor: isCircle ? 'var(--chart-border)' : bgColors,
        borderWidth: isCircle ? 2 : 0,
        hoverOffset: isCircle ? 16 : 0,
        borderRadius: isHbar ? 6 : 0,
        barPercentage: 0.7,
        categoryPercentage: 0.85
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: isCircle,
      indexAxis: isHbar ? 'y' : 'x',
      animation: useAnimations ? {} : false,
      layout: { padding: 10 },
      scales: isCircle ? {} : {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: "'Inter', sans-serif", size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: "'Inter', sans-serif", size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark ? '#fff' : '#1a1a2e',
          bodyColor: isDark ? '#a29bfe' : '#6c5ce7',
          borderColor: 'rgba(108,92,231,0.3)', borderWidth: 1,
          padding: 12, cornerRadius: 8,
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y ?? ctx.parsed.x ?? ctx.parsed;
              const pct = ((v / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${v.toLocaleString()} (${pct}%)`;
            }
          }
        },
        datalabels: { display: false }
      }
    }
  });

  // Stat chips
  chartStats.innerHTML = labels.map((label, i) => {
    const pct = ((data[i] / total) * 100).toFixed(1);
    return `<span class="stat-chip">
        <span class="stat-dot" style="background:${bgColors[i]}"></span>
        <span class="stat-label">${esc(label)}</span> ${pct}%
      </span>`;
  }).join('');
}

// ========================================================
// ===== Download Chart PNG (always includes legend) =======
// ========================================================
downloadChart.addEventListener('click', () => {
  if (!chartInstance) return;

  const S = 4;
  const srcCanvas = document.getElementById('dataChart');
  const chartW = srcCanvas.width * S;
  const chartH = srcCanvas.height * S;

  const titleText = chartTitle.textContent;
  const labels  = currentLabels;
  const data    = currentData;
  const colors  = currentBgColors;
  const total   = data.reduce((a, b) => a + b, 0);

  const pad    = 50 * S;
  const titleH = 40 * S;

  const legendItemH = 28 * S;
  const legendW = 280 * S;
  const legendGap = 30 * S;

  const totalW = pad + chartW + legendGap + legendW + pad;
  const legendTotalH = labels.length * legendItemH + 40 * S;
  const contentH = Math.max(chartH, legendTotalH);
  const totalH = pad + titleH + contentH + pad;

  const offscreen = document.createElement('canvas');
  offscreen.width  = totalW;
  offscreen.height = totalH;
  const ctx = offscreen.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  ctx.fillStyle = '#1a1a2e';
  ctx.font = `bold ${20 * S}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(titleText, pad, pad + 24 * S);

  ctx.drawImage(srcCanvas, pad, pad + titleH, chartW, chartH);

  const legX = pad + chartW + legendGap;
  let legY = pad + titleH + 10 * S;

  ctx.fillStyle = '#555';
  ctx.font = `bold ${12 * S}px Inter, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Legend', legX, legY);
  legY += 22 * S;

  const legBoxH = labels.length * legendItemH + 20 * S;
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = S;
  ctx.beginPath();
  ctx.roundRect(legX - 10 * S, legY - 10 * S, legendW + 10 * S, legBoxH, 8 * S);
  ctx.stroke();

  labels.forEach((label, i) => {
    const pct = ((data[i] / total) * 100).toFixed(1);

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect(legX, legY, 14 * S, 14 * S, 3 * S);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = `500 ${11 * S}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    const maxLabelW = legendW - 110 * S;
    let displayLabel = label;
    while (ctx.measureText(displayLabel).width > maxLabelW && displayLabel.length > 3) {
      displayLabel = displayLabel.slice(0, -1);
    }
    if (displayLabel !== label) displayLabel += '…';
    ctx.fillText(displayLabel, legX + 20 * S, legY + 11 * S);

    ctx.fillStyle = '#6c5ce7';
    ctx.font = `700 ${11 * S}px Inter, sans-serif`;
    ctx.fillText(`${pct}%`, legX + legendW - 90 * S, legY + 11 * S);

    ctx.fillStyle = '#999';
    ctx.font = `400 ${9 * S}px Inter, sans-serif`;
    ctx.fillText(`(${data[i].toLocaleString()})`, legX + legendW - 45 * S, legY + 11 * S);

    legY += legendItemH;
  });

  const link = document.createElement('a');
  link.download = `${currentColumn || 'chart'}_distribution.png`;
  link.href = offscreen.toDataURL('image/png', 1.0);
  link.click();
});

// =====================================================
// ===== FEATURE 8: Share Chart as Link ================
// =====================================================
shareChartBtn.addEventListener('click', () => {
  if (!currentColumn || !chartInstance) return;

  const checkedVals = [];
  filterChecks.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => checkedVals.push(cb.value));

  const state = {
    col: currentColumn,
    type: chartType,
    pal: paletteName,
    vals: checkedVals
  };

  const hash = '#share=' + encodeURIComponent(JSON.stringify(state));
  const url = window.location.origin + window.location.pathname + hash;

  navigator.clipboard.writeText(url).then(() => {
    showToast();
  }).catch(() => {
    // Fallback
    prompt('Copy this link:', url);
  });
});

function showToast() {
  shareToast.classList.add('show');
  setTimeout(() => shareToast.classList.remove('show'), 2500);
}

function tryRestoreFromHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return;
  try {
    const state = JSON.parse(decodeURIComponent(hash.slice(7)));
    if (!state.col || !headers.includes(state.col)) return;

    // Set column
    columnSelect.value = state.col;
    currentColumn = state.col;

    // Set chart type
    if (state.type) {
      chartType = state.type;
      document.querySelectorAll('#chartTypeToggle .toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === chartType);
      });
    }

    // Set palette
    if (state.pal) {
      paletteName = state.pal;
      document.querySelectorAll('#paletteToggle .toggle-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.palette === paletteName);
      });
    }

    // Build filters for this column
    computeAndShowFilters(state.col);

    // Apply value selections
    if (state.vals && state.vals.length > 0) {
      const valSet = new Set(state.vals);
      filterChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = valSet.has(cb.value);
      });
      renderFilteredChart();
    }

    // Clear hash
    history.replaceState(null, '', window.location.pathname);
  } catch (e) { /* ignore bad hash */ }
}

// ========================================================
// ===== FEATURE 6: Cross-Tab Analysis ====================
// ========================================================
function renderCrossTab() {
  const col1 = crosstabCol1.value;
  const col2 = crosstabCol2.value;
  if (!col1 || !col2 || col1 === col2) {
    crosstabChartWrap.style.display = 'none';
    return;
  }

  // Get unique values for each column (top 15 for readability)
  const count1 = {};
  const count2 = {};
  parsedData.forEach(row => {
    const v1 = (row[col1] ?? '').toString().trim(); if (v1) count1[v1] = (count1[v1] || 0) + 1;
    const v2 = (row[col2] ?? '').toString().trim(); if (v2) count2[v2] = (count2[v2] || 0) + 1;
  });

  const top1 = Object.entries(count1).sort((a,b) => b[1]-a[1]).slice(0, 12).map(([v]) => v);
  const top2 = Object.entries(count2).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([v]) => v);

  // Build matrix
  const matrix = {};
  top2.forEach(v2 => { matrix[v2] = {}; top1.forEach(v1 => { matrix[v2][v1] = 0; }); });
  parsedData.forEach(row => {
    const v1 = (row[col1] ?? '').toString().trim();
    const v2 = (row[col2] ?? '').toString().trim();
    if (top1.includes(v1) && top2.includes(v2)) matrix[v2][v1]++;
  });

  const palette = PALETTES[paletteName] || PALETTES.vibrant;
  const datasets = top2.map((v2, i) => ({
    label: v2,
    data: top1.map(v1 => matrix[v2][v1]),
    backgroundColor: palette[i % palette.length],
    borderRadius: 4,
    barPercentage: 0.8,
    categoryPercentage: 0.85
  }));

  if (crosstabInstance) crosstabInstance.destroy();
  crosstabChartWrap.style.display = '';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tickColor = isDark ? '#8b8b9e' : '#6b6b80';

  crosstabInstance = new Chart(document.getElementById('crosstabChart').getContext('2d'), {
    type: 'bar',
    data: { labels: top1, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: useAnimations ? {} : false,
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxRotation: 45 } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor } }
      },
      plugins: {
        legend: {
          display: true, position: 'top',
          labels: { color: tickColor, font: { family: "'Inter', sans-serif", size: 11 }, usePointStyle: true, pointStyleWidth: 10, padding: 12 }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark ? '#fff' : '#1a1a2e',
          bodyColor: isDark ? '#a29bfe' : '#6c5ce7',
          borderColor: 'rgba(108,92,231,0.3)', borderWidth: 1, padding: 10, cornerRadius: 8
        }
      }
    }
  });
}

crosstabCol1.addEventListener('change', renderCrossTab);
crosstabCol2.addEventListener('change', renderCrossTab);

// ========================================================
// ===== CSV Export (Multi-Value) ==========================
// ========================================================
exportColSel.addEventListener('change', () => {
  const col = exportColSel.value;
  if (!col) {
    exportFilterSec.style.display = 'none';
    exportCsvBtn.disabled = true;
    exportPreview.style.display = 'none';
    return;
  }

  const counts = {};
  parsedData.forEach(row => {
    const val = (row[col] ?? '').toString().trim();
    if (val) counts[val] = (counts[val] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  exportChecks.innerHTML = sorted.map(([val, count]) => {
    const safeId = 'ex_' + val.replace(/[^a-zA-Z0-9]/g, '_') + '_' + count;
    return `<label class="filter-check-item" for="${safeId}" data-search="${val.toLowerCase()}">
        <input type="checkbox" id="${safeId}" value="${esc(val)}">
        <span class="check-label">${esc(val)}</span>
        <span class="check-count">${count.toLocaleString()}</span>
      </label>`;
  }).join('');

  exportSearch.value = '';
  exportFilterSec.style.display = '';
  exportCsvBtn.disabled = true;
  exportPreview.style.display = 'none';

  exportChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateExportPreview);
  });
});

exportSearch.addEventListener('input', () => {
  const q = exportSearch.value.toLowerCase();
  exportChecks.querySelectorAll('.filter-check-item').forEach(item => {
    item.classList.toggle('hidden', !item.dataset.search.includes(q));
  });
});

exportSelectAll.addEventListener('click', () => {
  exportChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  updateExportPreview();
});
exportDeselectAll.addEventListener('click', () => {
  exportChecks.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateExportPreview();
});

function updateExportPreview() {
  const col = exportColSel.value;
  const selectedVals = new Set();
  exportChecks.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => selectedVals.add(cb.value));

  if (selectedVals.size === 0) {
    exportCsvBtn.disabled = true;
    exportPreview.style.display = 'none';
    return;
  }

  const matchCount = parsedData.filter(row => {
    const val = (row[col] ?? '').toString().trim();
    return selectedVals.has(val);
  }).length;

  exportCount.textContent = matchCount.toLocaleString();
  exportPreview.style.display = 'inline-flex';
  exportCsvBtn.disabled = matchCount === 0;
}

exportCsvBtn.addEventListener('click', () => {
  const col = exportColSel.value;
  if (!col) return;

  const selectedVals = new Set();
  exportChecks.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => selectedVals.add(cb.value));
  if (selectedVals.size === 0) return;

  const filtered = parsedData.filter(row => {
    const val = (row[col] ?? '').toString().trim();
    return selectedVals.has(val);
  });
  if (filtered.length === 0) return;

  const csvContent = Papa.unparse(filtered, { columns: headers });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const valNames = [...selectedVals].slice(0, 3).join('_').replace(/[^a-zA-Z0-9_]/g, '');
  const suffix = selectedVals.size > 3 ? `_and_${selectedVals.size - 3}_more` : '';
  link.download = `${col}_${valNames}${suffix}_filtered.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
});

// =====================================================
// ===== FEATURE 10: Download Full CSV =================
// =====================================================
downloadFullCsvBtn.addEventListener('click', () => {
  if (parsedData.length === 0) return;
  const csvContent = Papa.unparse(parsedData, { columns: headers });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = (fileName.textContent || 'data') + '_clean.csv';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
});

// =====================================================
// ===== Render Table + FEATURE 3 & 4 ==================
// =====================================================
function renderTable() {
  sortColumn = null;
  sortDirection = null;
  const maxPreview = 500;
  const preview = parsedData.slice(0, maxPreview);
  rowBadge.textContent = parsedData.length > maxPreview
    ? `Showing ${maxPreview} of ${parsedData.length.toLocaleString()}`
    : `${parsedData.length.toLocaleString()} rows`;

  // Sortable headers
  tableHead.innerHTML = '<tr>' + headers.map(h =>
    `<th data-col="${esc(h)}">${esc(h)} <span class="sort-arrow">⇅</span></th>`
  ).join('') + '</tr>';

  // Attach sort listeners
  tableHead.querySelectorAll('th').forEach(th => {
    th.addEventListener('click', () => handleSort(th.dataset.col));
  });

  buildTableRows(preview);
  tableSearchInput.value = '';
  show(tableCard);
}

function buildTableRows(data) {
  const fragment = document.createDocumentFragment();
  data.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = row[h] ?? '';
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });
  tableBody.innerHTML = '';
  tableBody.appendChild(fragment);
}

// FEATURE 3: Sortable Columns
function handleSort(colName) {
  if (sortColumn === colName) {
    if (sortDirection === 'asc') sortDirection = 'desc';
    else if (sortDirection === 'desc') { sortDirection = null; sortColumn = null; }
  } else {
    sortColumn = colName;
    sortDirection = 'asc';
  }

  // Update arrows
  tableHead.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-active');
    const arrow = th.querySelector('.sort-arrow');
    arrow.textContent = '⇅';
  });

  const maxPreview = 500;
  if (!sortColumn) {
    buildTableRows(parsedData.slice(0, maxPreview));
    return;
  }

  const activeTh = tableHead.querySelector(`th[data-col="${CSS.escape(sortColumn)}"]`);
  if (activeTh) {
    activeTh.classList.add('sort-active');
    activeTh.querySelector('.sort-arrow').textContent = sortDirection === 'asc' ? '▲' : '▼';
  }

  const sorted = [...parsedData].sort((a, b) => {
    let va = (a[sortColumn] ?? '').toString().trim();
    let vb = (b[sortColumn] ?? '').toString().trim();
    // Try numeric
    const na = parseFloat(va), nb = parseFloat(vb);
    if (!isNaN(na) && !isNaN(nb)) {
      return sortDirection === 'asc' ? na - nb : nb - na;
    }
    // Text
    va = va.toLowerCase(); vb = vb.toLowerCase();
    if (va < vb) return sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  buildTableRows(sorted.slice(0, maxPreview));
}

// FEATURE 4: Table Search
let searchTimeout;
tableSearchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = tableSearchInput.value.toLowerCase().trim();
    const rows = tableBody.querySelectorAll('tr');
    if (!q) {
      rows.forEach(r => r.classList.remove('hidden-row'));
      return;
    }
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.classList.toggle('hidden-row', !text.includes(q));
    });
  }, 200);
});

// ===== Reset =====
function resetAll() {
  parsedData = []; headers = []; currentColumn = ''; allValueCounts = {};
  currentLabels = []; currentData = []; currentBgColors = [];
  sortColumn = null; sortDirection = null;
  csvUpload.value = '';
  fileInfo.style.display = 'none';
  dropZone.style.display = '';
  restoreDropZone();
  [statsCard, controlsCard, filterCard, optionsCard, chartCard, exportCard, crosstabCard, tableCard].forEach(hide);
  chartStats.innerHTML = ''; filterChecks.innerHTML = ''; sideLegend.innerHTML = '';
  exportFilterSec.style.display = 'none';
  exportPreview.style.display = 'none';
  numericStatsSection.style.display = 'none';
  crosstabChartWrap.style.display = 'none';
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  if (crosstabInstance) { crosstabInstance.destroy(); crosstabInstance = null; }
}

// ===== Helpers =====
function show(el) { el.style.display = ''; el.style.animation = 'fadeUp 0.45s ease both'; }
function hide(el) { el.style.display = 'none'; }
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}