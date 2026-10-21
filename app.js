// ==========================================================================
// EXNESS XAUUSD PNL CALENDAR ENGINE (Vertical Stream & Auto-Sync)
// ==========================================================================

// Exact historical snapshot from user screenshot (October 2026 baseline)
const SNAPSHOT_OCTOBER_2026 = {
  "2026-10-01": { pnl: 0.00, trades: [] },
  "2026-10-02": { pnl: -10480, trades: [{ time: "14:22", type: "SELL", lot: 0.10, profit: -10480 }] },
  "2026-10-03": { pnl: -27080, trades: [{ time: "19:40", type: "BUY", lot: 0.15, profit: -27080 }] },
  "2026-10-04": { pnl: -39560, trades: [{ time: "20:15", type: "SELL", lot: 0.20, profit: -39560 }] },
  "2026-10-05": { pnl: -31990, trades: [{ time: "11:05", type: "BUY", lot: 0.12, profit: -31990 }] },
  "2026-10-06": { pnl: -25160, trades: [{ time: "16:30", type: "SELL", lot: 0.15, profit: -25160 }] },
  "2026-10-07": { pnl: 2420000, trades: [{ time: "21:12", type: "BUY", lot: 0.50, profit: 2420000 }] },
  "2026-10-08": { pnl: -1410000, trades: [{ time: "15:45", type: "SELL", lot: 0.35, profit: -1410000 }] },
  "2026-10-09": { pnl: -15310, trades: [{ time: "18:20", type: "BUY", lot: 0.10, profit: -15310 }] },
  "2026-10-10": { pnl: -7710000, trades: [{ time: "20:50", type: "SELL", lot: 0.80, profit: -7710000 }] },
  "2026-10-11": { pnl: -718520, trades: [{ time: "22:10", type: "BUY", lot: 0.25, profit: -718520 }] },
  "2026-10-12": { pnl: 169190, trades: [{ time: "13:15", type: "BUY", lot: 0.20, profit: 169190 }] },
  "2026-10-13": { pnl: 524530, trades: [{ time: "17:40", type: "BUY", lot: 0.30, profit: 524530 }] },
  "2026-10-14": { pnl: 0.00, trades: [] },
  "2026-10-15": { pnl: 0.00, trades: [] },
  "2026-10-16": { pnl: -225610, trades: [{ time: "15:20", type: "SELL", lot: 0.25, profit: -225610 }] },
  "2026-10-17": { pnl: -19320, trades: [{ time: "19:05", type: "BUY", lot: 0.10, profit: -19320 }] },
  "2026-10-18": { pnl: 1020000, trades: [{ time: "20:30", type: "BUY", lot: 0.40, profit: 1020000 }] },
  "2026-10-19": { pnl: 582750, trades: [{ time: "14:10", type: "BUY", lot: 0.30, profit: 582750 }] },
  "2026-10-20": { pnl: 24990, trades: [{ time: "18:45", type: "SELL", lot: 0.10, profit: 24990 }] },
  "2026-10-21": { pnl: 302380, trades: [{ time: "16:20", type: "BUY", lot: 0.25, profit: 302380 }] },
  "2026-10-22": { pnl: 254440, trades: [{ time: "17:50", type: "BUY", lot: 0.20, profit: 254440 }] },
  "2026-10-23": { pnl: 686320, trades: [{ time: "21:30", type: "BUY", lot: 0.35, profit: 686320 }] },
  "2026-10-24": { pnl: 175150, trades: [{ time: "19:15", type: "BUY", lot: 0.20, profit: 175150 }] },
  "2026-10-25": { pnl: -46970, trades: [{ time: "22:05", type: "SELL", lot: 0.15, profit: -46970 }] },
  "2026-10-26": { pnl: 67200, trades: [{ time: "13:40", type: "BUY", lot: 0.10, profit: 67200 }] },
  "2026-10-27": { pnl: 146510, trades: [{ time: "18:15", type: "BUY", lot: 0.15, profit: 146510 }] },
  "2026-10-28": { pnl: -5580000, trades: [{ time: "20:45", type: "SELL", lot: 0.60, profit: -5580000 }] },
  "2026-10-29": { pnl: 0.00, trades: [] },
  "2026-10-30": { pnl: -83750, trades: [{ time: "16:10", type: "SELL", lot: 0.15, profit: -83750 }] },
  "2026-10-31": { pnl: 429160, trades: [{ time: "21:00", type: "BUY", lot: 0.30, profit: 429160 }] }
};

const STATE = {
  pnlData: { ...SNAPSHOT_OCTOBER_2026 },
  activeYear: 2026,
  activeSemester: 2, // 1 = Jan - Jun, 2 = Jul - Des
  activeMonths: [],
  autoHideEnabled: localStorage.getItem('auto_hide_header') === 'true'
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Number Formatter matching screenshot (+2.42M, -10.48K, 0.00)
function formatPnL(val) {
  if (val === 0 || Math.abs(val) < 0.001) {
    return "0.00";
  }

  const sign = val > 0 ? "+" : "-";
  const abs = Math.abs(val);

  if (abs >= 1000000) {
    const m = (abs / 1000000).toFixed(2);
    return `${sign}${m}M`;
  } else if (abs >= 1000) {
    const k = (abs / 1000).toFixed(2);
    // e.g. +67.2K or +146.51K
    return `${sign}${k.replace(/\.00$/, '')}K`;
  } else {
    return `${sign}${abs.toFixed(2)}`;
  }
}

// Generate Calendar Days for a given Year & Month (0-indexed)
function renderMonthBlock(year, monthIndex) {
  const monthName = MONTH_NAMES[monthIndex];
  const section = document.createElement('section');
  section.className = 'month-section';
  section.id = `month-${year}-${monthIndex}`;

  // Calculate Month Totals
  let monthTotal = 0;
  let winDays = 0;
  let lossDays = 0;

  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  for (let d = 1; d <= totalDays; d++) {
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEntry = STATE.pnlData[dateKey];
    if (dayEntry && Math.abs(dayEntry.pnl) > 0.001) {
      monthTotal += dayEntry.pnl;
      if (dayEntry.pnl > 0) winDays++;
      else lossDays++;
    }
  }

  const isProfitMonth = monthTotal >= 0;
  const badgeClass = isProfitMonth ? 'profit' : 'loss';
  const badgeText = `${isProfitMonth ? '+' : ''}${formatPnL(monthTotal)}`;

  // Header HTML
  section.innerHTML = `
    <div class="month-header">
      <div class="month-title-wrap">
        <h2 class="month-title">${monthName}</h2>
        <span class="month-year">${year}</span>
      </div>
      <div class="month-summary-badge ${badgeClass}">
        <span>${badgeText}</span>
        <span style="font-size:11px;opacity:0.8;">(${winDays}W - ${lossDays}L)</span>
      </div>
    </div>

    <div class="weekdays-grid">
      <div class="weekday-col">Sun</div>
      <div class="weekday-col">Mon</div>
      <div class="weekday-col">Tue</div>
      <div class="weekday-col">Wed</div>
      <div class="weekday-col">Thu</div>
      <div class="weekday-col">Fri</div>
      <div class="weekday-col">Sat</div>
    </div>

    <div class="days-grid" id="grid-${year}-${monthIndex}"></div>
  `;

  const daysGrid = section.querySelector(`#grid-${year}-${monthIndex}`);

  // 1. Empty Leading Days (Padding before 1st of month)
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  // 2. Day Cells 01 to totalDays
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIndex;

  for (let d = 1; d <= totalDays; d++) {
    const dayPadded = String(d).padStart(2, '0');
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${dayPadded}`;
    const entry = STATE.pnlData[dateKey];

    const cell = document.createElement('div');
    cell.className = 'day-cell';

    if (isCurrentMonth && today.getDate() === d) {
      cell.classList.add('is-today');
    }

    let pnlVal = 0.00;
    if (entry !== undefined) {
      pnlVal = entry.pnl;
    }

    if (pnlVal > 0) {
      cell.classList.add('is-profit');
    } else if (pnlVal < 0) {
      cell.classList.add('is-loss');
    } else {
      cell.classList.add('is-zero');
    }

    cell.innerHTML = `
      <span class="day-num">${dayPadded}</span>
      <span class="day-pnl">${formatPnL(pnlVal)}</span>
    `;

    cell.onclick = () => openDayModal(dateKey, pnlVal, entry ? entry.trades : []);
    daysGrid.appendChild(cell);
  }

  return section;
}

// Render All Active Months in Semester (Ordered Sequentially Downwards)
function renderTimeline() {
  const container = document.getElementById('months-container') || document.getElementById('calendar-stream');
  if (!container) return;
  container.innerHTML = '';

  for (const m of STATE.activeMonths) {
    const monthNode = renderMonthBlock(m.year, m.month);
    container.appendChild(monthNode);
  }

  updateHeaderStats();
}

function updateActiveMonthsFromSemester() {
  const months = [];
  const startMonth = STATE.activeSemester === 1 ? 0 : 6;
  const endMonth = STATE.activeSemester === 1 ? 5 : 11;

  for (let m = startMonth; m <= endMonth; m++) {
    months.push({ year: STATE.activeYear, month: m });
  }

  STATE.activeMonths = months;
}

function switchSemester(sem) {
  STATE.activeSemester = sem;
  updateSemesterUI();
  updateActiveMonthsFromSemester();
  renderTimeline();
}

function changeYear(delta) {
  STATE.activeYear += delta;
  updateSemesterUI();
  updateActiveMonthsFromSemester();
  renderTimeline();
}

function updateSemesterUI() {
  const yearEl = document.getElementById('active-year-display');
  if (yearEl) yearEl.textContent = STATE.activeYear;

  const tab1 = document.getElementById('tab-sem-1');
  const tab2 = document.getElementById('tab-sem-2');
  const dSem1 = document.getElementById('d-sem-1');
  const dSem2 = document.getElementById('d-sem-2');

  if (STATE.activeSemester === 1) {
    if (tab1) tab1.classList.add('active');
    if (tab2) tab2.classList.remove('active');
    if (dSem1) dSem1.classList.add('active');
    if (dSem2) dSem2.classList.remove('active');
  } else {
    if (tab2) tab2.classList.add('active');
    if (tab1) tab1.classList.remove('active');
    if (dSem2) dSem2.classList.add('active');
    if (dSem1) dSem1.classList.remove('active');
  }

  const quickBadge = document.getElementById('quick-semester-badge');
  if (quickBadge) {
    const semName = STATE.activeSemester === 1 ? 'Jan — Jun' : 'Jul — Des';
    quickBadge.textContent = `Semester ${STATE.activeSemester} (${semName} ${STATE.activeYear})`;
  }
}

// Update Top App Header Stats (Based on the active Semester Period)
function updateHeaderStats() {
  let netPnl = 0;
  let winCount = 0;
  let lossCount = 0;

  const activePrefixes = new Set(
    STATE.activeMonths.map(m => `${m.year}-${String(m.month + 1).padStart(2, '0')}`)
  );

  for (const [key, val] of Object.entries(STATE.pnlData)) {
    const prefix = key.slice(0, 7);
    if (activePrefixes.has(prefix)) {
      netPnl += val.pnl;
      if (val.pnl > 0) winCount++;
      else if (val.pnl < 0) lossCount++;
    }
  }

  const statMonthPnl = document.getElementById('stat-month-pnl');
  const statWinrate = document.getElementById('stat-winrate');
  const statWinDays = document.getElementById('stat-win-days');
  const statLossDays = document.getElementById('stat-loss-days');

  if (statMonthPnl) {
    statMonthPnl.textContent = formatPnL(netPnl);
    statMonthPnl.className = `d-stat-val ${netPnl >= 0 ? 'profit' : 'loss'}`;
  }

  const totalTradingDays = winCount + lossCount;
  const wr = totalTradingDays > 0 ? ((winCount / totalTradingDays) * 100).toFixed(1) : "0.0";
  if (statWinrate) statWinrate.textContent = `${wr}%`;
  if (statWinDays) statWinDays.textContent = `${winCount}W`;
  if (statLossDays) statLossDays.textContent = `${lossCount}L`;
}

// Modal Details Interaction
function openDayModal(dateKey, pnlVal, trades) {
  const modal = document.getElementById('day-modal');
  const modalDate = document.getElementById('modal-date');
  const modalPnlBanner = document.getElementById('modal-pnl-banner');
  const modalPnlVal = document.getElementById('modal-pnl-val');
  const tradesList = document.getElementById('modal-trades-list');

  const [y, m, d] = dateKey.split('-');
  const monthName = MONTH_NAMES[parseInt(m) - 1];
  modalDate.textContent = `${d} ${monthName} ${y}`;

  modalPnlVal.textContent = formatPnL(pnlVal);
  modalPnlVal.className = `modal-pnl-val ${pnlVal > 0 ? 'profit' : (pnlVal < 0 ? 'loss' : '')}`;
  if (pnlVal > 0) {
    modalPnlBanner.style.borderColor = 'rgba(0, 210, 255, 0.3)';
    modalPnlVal.style.color = 'var(--profit-text)';
  } else if (pnlVal < 0) {
    modalPnlBanner.style.borderColor = 'rgba(255, 77, 109, 0.3)';
    modalPnlVal.style.color = 'var(--loss-text)';
  } else {
    modalPnlBanner.style.borderColor = 'var(--border-subtle)';
    modalPnlVal.style.color = 'var(--neutral-text)';
  }

  tradesList.innerHTML = '';
  if (!trades || trades.length === 0) {
    tradesList.innerHTML = `<div style="text-align:center;padding:16px;color:#64748B;font-size:13px;">No closed trades logged on this date.</div>`;
  } else {
    for (const t of trades) {
      const row = document.createElement('div');
      row.className = 'trade-row';
      const isWin = t.profit >= 0;
      row.innerHTML = `
        <div class="trade-meta">
          <span class="trade-type ${t.type.toLowerCase()}">XAUUSD ${t.type} (${t.lot} Lot)</span>
          <span class="trade-time">${t.time} WIB</span>
        </div>
        <div class="trade-profit" style="color:${isWin ? 'var(--profit-text)' : 'var(--loss-text)'}">
          ${formatPnL(t.profit)}
        </div>
      `;
      tradesList.appendChild(row);
    }
  }

  modal.classList.remove('hidden');
}

function closeModal(e) {
  const modal = document.getElementById('day-modal');
  modal.classList.add('hidden');
}

// Fetch live trade data from backend API or static JSON (for GitHub Pages)
async function fetchTradeData() {
  const syncPill = document.getElementById('sync-status');
  let loaded = false;

  // 1. Coba hubungi Backend API lokal jika server sedang berjalan
  try {
    const res = await fetch('/api/pnl');
    if (res.ok) {
      const data = await res.json();
      if (data && data.history && Object.keys(data.history).length > 0) {
        STATE.pnlData = data.history;
        loaded = true;
      }
    }
  } catch (e) {
    // Backend API lokal tidak aktif (misal running di GitHub Pages)
  }

  // 2. Jika di GitHub Pages / Static Hosting, baca langsung file trades_data.json
  if (!loaded) {
    try {
      const res = await fetch('./trades_data.json');
      if (res.ok) {
        const staticData = await res.json();
        if (staticData && Object.keys(staticData).length > 0) {
          STATE.pnlData = staticData;
          loaded = true;
        }
      }
    } catch (e) {
      console.warn("Could not load static trades_data.json", e);
    }
  }

  // 3. Gabungkan dengan data transaksi yang disimpan di localStorage browser (jika ada import di HP/web)
  const localSaved = localStorage.getItem('local_trades_data');
  if (localSaved) {
    try {
      const parsedLocal = JSON.parse(localSaved);
      STATE.pnlData = { ...STATE.pnlData, ...parsedLocal };
    } catch (e) {}
  }

  updateActiveMonthsFromSemester();
  renderTimeline();
}

// Client-Side MT5 HTML Report Parser (Berjalan di Browser / GitHub Pages tanpa server)
function parseMt5ReportClientSide(content) {
  const daily = {};
  let dealsIdx = content.indexOf('Transaksi');
  if (dealsIdx === -1) dealsIdx = content.indexOf('Deals');
  if (dealsIdx === -1) return { daily, totalTrades: 0 };

  const dealsPart = content.slice(dealsIdx);
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let totalTrades = 0;

  while ((match = rowRegex.exec(dealsPart)) !== null) {
    const rowContent = match[1];
    const colRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cols = [];
    let colMatch;
    while ((colMatch = colRegex.exec(rowContent)) !== null) {
      cols.push(colMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (cols.length >= 13) {
      const waktu = cols[0];
      const simbol = cols[2];
      const tipe = cols[3];
      const arah = cols[4].toLowerCase();
      const volume = cols[5];
      const profitStr = cols[12].replace(/\s+/g, '').replace(/&nbsp;/g, '');
      const swapStr = cols[11].replace(/\s+/g, '').replace(/&nbsp;/g, '');
      const commStr = cols[9].replace(/\s+/g, '').replace(/&nbsp;/g, '');

      if (arah === 'out') {
        const profit = parseFloat(profitStr);
        const swap = parseFloat(swapStr) || 0;
        const comm = parseFloat(commStr) || 0;
        if (!isNaN(profit)) {
          const net = Math.round((profit + swap + comm) * 100) / 100;
          const parts = waktu.split(' ');
          const dateKey = parts[0].replace(/\./g, '-');
          const timeStr = parts.length > 1 ? parts[1].slice(0, 5) : '00:00';
          if (!daily[dateKey]) {
            daily[dateKey] = { pnl: 0, trades: [] };
          }
          daily[dateKey].pnl = Math.round((daily[dateKey].pnl + net) * 100) / 100;
          daily[dateKey].trades.push({
            time: timeStr,
            symbol: simbol,
            type: tipe.toUpperCase(),
            lot: parseFloat(volume) || 0.01,
            profit: net
          });
          totalTrades++;
        }
      }
    }
  }
  return { daily, totalTrades };
}

// ==========================================================================
// DRAWER MENU & AUTO-HIDE HEADER CONTROLS
// ==========================================================================
function openDrawerMenu() {
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) {
    renderDrawerAccounts();
    overlay.classList.remove('hidden');
  }
}

function closeDrawerMenu() {
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function renderDrawerAccounts() {
  const listEl = document.getElementById('drawer-accounts-list');
  if (!listEl) return;

  if (connectedAccounts.length === 0) {
    listEl.innerHTML = `
      <div class="account-card active" onclick="closeDrawerMenu(); openBrokerModal();">
        <div class="account-info">
          <span class="account-title">Exness (MT5) <span class="badge-active-acct">Active</span></span>
          <span class="account-server">Login: 463678568 • Exness-MT5Trial17</span>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  connectedAccounts.forEach((acct, idx) => {
    const isActive = idx === activeBrokerIndex;
    const card = document.createElement('div');
    card.className = `account-card ${isActive ? 'active' : ''}`;
    card.onclick = () => {
      switchActiveBroker(idx);
      closeDrawerMenu();
    };
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="account-info">
        <span class="account-title">${acct.title} (${acct.platform}) ${isActive ? '<span class="badge-active-acct">Active</span>' : ''}</span>
        <span class="account-server">Server: ${acct.server} | Login: ${acct.login}</span>
      </div>
    `;
    listEl.appendChild(card);
  });
}

// Auto-hide & Minimize Header Features
let isHeaderMinimized = false;
let idleTimer = null;

function toggleHeaderMinimize(forceHide) {
  const header = document.getElementById('app-header');
  const floatBtn = document.getElementById('floating-header-btn');
  if (!header || !floatBtn) return;

  if (forceHide !== undefined) {
    isHeaderMinimized = forceHide;
  } else {
    isHeaderMinimized = !isHeaderMinimized;
  }

  if (isHeaderMinimized) {
    header.classList.add('minimized');
    floatBtn.classList.remove('hidden');
  } else {
    header.classList.remove('minimized');
    floatBtn.classList.add('hidden');
  }
}

function restoreHeader() {
  toggleHeaderMinimize(false);
  resetIdleTimer();
}

function toggleAutoHideSetting(e) {
  STATE.autoHideEnabled = e.target.checked;
  localStorage.setItem('auto_hide_header', STATE.autoHideEnabled ? 'true' : 'false');
  if (STATE.autoHideEnabled) {
    showToast('👁️ Header akan otomatis sembunyi saat idle');
    resetIdleTimer();
  } else {
    showToast('👁️ Auto-hide dinonaktifkan');
    if (idleTimer) clearTimeout(idleTimer);
    restoreHeader();
  }
}

function resetIdleTimer() {
  if (!STATE.autoHideEnabled) return;
  if (isHeaderMinimized) {
    restoreHeader();
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (STATE.autoHideEnabled && !isHeaderMinimized) {
      const drawerOpen = !document.getElementById('drawer-overlay')?.classList.contains('hidden');
      const modalOpen = !document.getElementById('broker-modal')?.classList.contains('hidden') || !document.getElementById('day-modal')?.classList.contains('hidden');
      if (!drawerOpen && !modalOpen) {
        toggleHeaderMinimize(true);
      }
    }
  }, 4000);
}

['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
  window.addEventListener(evt, resetIdleTimer, { passive: true });
});

function showToast(msg, duration = 3500) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

function handleFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (file) {
    uploadReportFile(file);
    event.target.value = '';
  }
}

async function uploadReportFile(file) {
  showToast('⏳ Membaca dan menyinkronkan laporan MT5...');
  try {
    const text = await file.text();
    let imported = false;

    // Coba kirim ke backend API jika server lokal sedang aktif
    try {
      const res = await fetch('/api/upload_report', {
        method: 'POST',
        body: text
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          showToast(`✔ Berhasil mengimpor riwayat MT5 (${data.total_trades || 0} transaksi)!`, 4000);
          fetchTradeData();
          imported = true;
        }
      }
    } catch (e) {
      // Backend lokal offline, gunakan parser client-side
    }

    // Jika berjalan di GitHub Pages / tanpa backend, parsing langsung di browser
    if (!imported) {
      const { daily, totalTrades } = parseMt5ReportClientSide(text);
      if (totalTrades > 0) {
        STATE.pnlData = { ...STATE.pnlData, ...daily };
        localStorage.setItem('local_trades_data', JSON.stringify(STATE.pnlData));
        showToast(`✔ Berhasil mengimpor riwayat MT5 (${totalTrades} transaksi) di browser!`, 4000);
        updateActiveMonthsFromData();
        renderTimeline();
      } else {
        showToast('❌ Tidak ditemukan deal closed di file laporan ini.');
      }
    }
  } catch (err) {
    showToast('❌ Gagal membaca file laporan.');
  }
}

// Drag & drop support on whole window
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  const overlay = document.getElementById('drop-overlay');
  if (overlay) overlay.classList.remove('hidden');
});

window.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) {
    const overlay = document.getElementById('drop-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  const overlay = document.getElementById('drop-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    uploadReportFile(e.dataTransfer.files[0]);
  }
});

// ==========================================================================
// UNIVERSAL MULTI-BROKER CONNECTOR (MT4 / MT5 Any Broker)
// ==========================================================================
let connectedAccounts = JSON.parse(localStorage.getItem('trading_accounts') || '[]');
let activeBrokerIndex = parseInt(localStorage.getItem('active_broker_index') || '0');

function openBrokerModal() {
  const modal = document.getElementById('broker-modal');
  if (modal) {
    renderConnectedAccounts();
    modal.classList.remove('hidden');
  }
}

function closeBrokerModal() {
  const modal = document.getElementById('broker-modal');
  if (modal) modal.classList.add('hidden');
}

function selectBrokerPreset(name, defaultServer) {
  const btns = document.querySelectorAll('.preset-btn');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  const serverInput = document.getElementById('inp-server');
  if (serverInput && defaultServer) {
    serverInput.value = defaultServer;
  }
}

function togglePlatformTab(platform) {
  const tabMt5 = document.getElementById('tab-mt5');
  const tabMt4 = document.getElementById('tab-mt4');
  if (platform === 'MT5') {
    tabMt5.classList.add('active');
    tabMt4.classList.remove('active');
  } else {
    tabMt4.classList.add('active');
    tabMt5.classList.remove('active');
  }
}

function handleSaveBroker(e) {
  e.preventDefault();
  const server = document.getElementById('inp-server').value.trim();
  const login = document.getElementById('inp-login').value.trim();
  const password = document.getElementById('inp-investor-pass').value.trim();
  const platform = document.querySelector('input[name="platform"]:checked')?.value || 'MT5';

  if (!server || !login || !password) {
    alert('Harap isi semua kolom kredensial!');
    return;
  }

  // Derive readable broker title
  let brokerTitle = 'Custom Broker';
  const serverLower = server.toLowerCase();
  if (serverLower.includes('exness')) brokerTitle = 'Exness';
  else if (serverLower.includes('xm')) brokerTitle = 'XM Global';
  else if (serverLower.includes('icmarkets')) brokerTitle = 'IC Markets';
  else if (serverLower.includes('octa')) brokerTitle = 'OctaFX';
  else if (serverLower.includes('hfm') || serverLower.includes('hfmarkets')) brokerTitle = 'HFM';
  else if (serverLower.includes('vantage')) brokerTitle = 'Vantage';
  else brokerTitle = server.split('-')[0] || 'Broker';

  const newAccount = {
    id: Date.now(),
    title: brokerTitle,
    platform,
    server,
    login,
    addedAt: new Date().toISOString()
  };

  connectedAccounts.unshift(newAccount);
  activeBrokerIndex = 0;
  localStorage.setItem('trading_accounts', JSON.stringify(connectedAccounts));
  localStorage.setItem('active_broker_index', activeBrokerIndex.toString());

  // Update App Header Label
  updateActiveBrokerUI();

  // Reset form
  document.getElementById('inp-investor-pass').value = '';
  renderConnectedAccounts();

  // Visual success feedback
  const saveBtn = document.getElementById('btn-save-broker');
  const oldText = saveBtn.innerHTML;
  saveBtn.innerHTML = `<span>✔ Berhasil Terhubung!</span>`;
  saveBtn.style.background = '#10B981';

  setTimeout(() => {
    saveBtn.innerHTML = oldText;
    saveBtn.style.background = '';
    closeBrokerModal();
    fetchTradeData();
  }, 1200);
}

function renderConnectedAccounts() {
  const listEl = document.getElementById('accounts-list');
  if (!listEl) return;

  if (connectedAccounts.length === 0) {
    // Default initial Exness account
    listEl.innerHTML = `
      <div class="account-card active">
        <div class="account-info">
          <span class="account-title">Exness (MT5) <span class="badge-active-acct">Active</span></span>
          <span class="account-server">Login: 463678568 • Exness-MT5Trial17</span>
        </div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = '';
  connectedAccounts.forEach((acct, idx) => {
    const isActive = idx === activeBrokerIndex;
    const card = document.createElement('div');
    card.className = `account-card ${isActive ? 'active' : ''}`;
    card.onclick = () => switchActiveBroker(idx);
    card.style.cursor = 'pointer';

    card.innerHTML = `
      <div class="account-info">
        <span class="account-title">${acct.title} (${acct.platform}) ${isActive ? '<span class="badge-active-acct">Active</span>' : ''}</span>
        <span class="account-server">Server: ${acct.server} | Login: ${acct.login}</span>
      </div>
      <button onclick="event.stopPropagation(); deleteBrokerAccount(${idx})" style="background:transparent;border:none;color:#EF4444;font-size:16px;cursor:pointer;" title="Hapus Akun">&times;</button>
    `;
    listEl.appendChild(card);
  });
}

function switchActiveBroker(idx) {
  activeBrokerIndex = idx;
  localStorage.setItem('active_broker_index', activeBrokerIndex.toString());
  updateActiveBrokerUI();
  renderConnectedAccounts();
  fetchTradeData();
}

function deleteBrokerAccount(idx) {
  if (confirm('Hapus koneksi akun broker ini?')) {
    connectedAccounts.splice(idx, 1);
    if (activeBrokerIndex >= connectedAccounts.length) activeBrokerIndex = 0;
    localStorage.setItem('trading_accounts', JSON.stringify(connectedAccounts));
    localStorage.setItem('active_broker_index', activeBrokerIndex.toString());
    updateActiveBrokerUI();
    renderConnectedAccounts();
  }
}

function updateActiveBrokerUI() {
  const brokerLabel = document.getElementById('active-broker-label');
  if (!brokerLabel) return;

  if (connectedAccounts.length > 0 && connectedAccounts[activeBrokerIndex]) {
    const cur = connectedAccounts[activeBrokerIndex];
    brokerLabel.textContent = `${cur.title.toUpperCase()} LIVE`;
  } else {
    brokerLabel.textContent = `EXNESS LIVE`;
  }
}

// Initialize on load & setup auto-refresh polling
window.addEventListener('DOMContentLoaded', () => {
  updateActiveBrokerUI();
  updateSemesterUI();
  updateActiveMonthsFromSemester();
  renderTimeline();
  fetchTradeData();

  // Set initial auto-hide checkbox state
  const chkAutoHide = document.getElementById('chk-auto-hide');
  if (chkAutoHide) {
    chkAutoHide.checked = STATE.autoHideEnabled;
  }
  if (STATE.autoHideEnabled) {
    resetIdleTimer();
  }

  // Auto-sync polling every 15 seconds
  setInterval(fetchTradeData, 15000);
});
