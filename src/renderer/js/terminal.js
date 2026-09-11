document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('terminal-logs-container');
  const countText = document.getElementById('terminal-count-text');
  const searchInput = document.getElementById('input-terminal-search');
  const autoScrollChk = document.getElementById('chk-autoscroll');

  let allLogs = [];
  let currentFilter = 'ALL';
  let searchQuery = '';

  // Load initial status & logs
  async function refreshStatus() {
    try {
      const status = await window.eyesCare.backend.getStatus();
      document.getElementById('stat-backend').textContent = status.backend === 'ONLINE' ? '● ONLINE' : '○ OFFLINE';
      document.getElementById('stat-uptime').textContent = status.uptime || '00:00:00';
      document.getElementById('stat-sqlite').textContent = status.sqlite === 'CONNECTED' ? '● CONNECTED' : '○ ERROR';
      document.getElementById('stat-display').textContent = `● ${status.displayEngine} (${status.currentTemperature}K / ${status.currentBrightness}%)`;
      document.getElementById('stat-break').textContent = `● ${status.breakEngine}`;
      document.getElementById('stat-timer').textContent = `● ${status.timerEngine}`;
      document.getElementById('stat-rules').textContent = `● ${status.ruleEngine}`;
      document.getElementById('stat-tray').textContent = `● ${status.tray}`;
    } catch (e) {
      console.error('Status fetch error:', e);
    }
  }

  async function loadInitialLogs() {
    try {
      allLogs = await window.eyesCare.backend.getLogs({ limit: 500, level: 'ALL' });
      renderLogs();
    } catch (e) {
      console.error('Logs fetch error:', e);
    }
  }

  function appendLogLine(log) {
    allLogs.push(log);
    if (matchesFilter(log)) {
      const lineEl = createLogElement(log);
      container.appendChild(lineEl);
      updateCount();
      if (autoScrollChk.checked) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  function matchesFilter(log) {
    if (currentFilter !== 'ALL' && log.level !== currentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const combined = `${log.timestamp} ${log.level} ${log.category} ${log.message} ${log.data || ''}`.toLowerCase();
      return combined.includes(q);
    }
    return true;
  }

  function createLogElement(log) {
    const div = document.createElement('div');
    div.className = 'log-line';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${log.timestamp}]`;

    const badgeSpan = document.createElement('span');
    badgeSpan.className = `log-badge ${log.level}`;
    badgeSpan.textContent = log.level.padEnd(7, ' ');

    const catSpan = document.createElement('span');
    catSpan.className = 'log-category';
    catSpan.textContent = `[${log.category}]`;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = log.message + (log.data ? ` | ${log.data}` : '');

    div.appendChild(timeSpan);
    div.appendChild(badgeSpan);
    div.appendChild(catSpan);
    div.appendChild(msgSpan);

    return div;
  }

  function renderLogs() {
    container.innerHTML = '';
    const filtered = allLogs.filter(matchesFilter);
    for (const l of filtered) {
      container.appendChild(createLogElement(l));
    }
    updateCount();
    if (autoScrollChk.checked) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function updateCount() {
    countText.textContent = `Displaying ${container.children.length} of ${allLogs.length} logs`;
  }

  // Level filter buttons
  document.querySelectorAll('.filter-btn[data-lvl]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-lvl]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.lvl;
      renderLogs();
    });
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderLogs();
  });

  // Action buttons
  document.getElementById('btn-clear-logs').addEventListener('click', async () => {
    await window.eyesCare.backend.clearLogs();
    allLogs = [];
    renderLogs();
  });

  document.getElementById('btn-open-dir').addEventListener('click', async () => {
    await window.eyesCare.backend.openLogsDir();
  });

  document.getElementById('btn-export-logs').addEventListener('click', () => {
    const text = allLogs.map(l => `[${l.fullTimestamp}] [${l.level}] [${l.category}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EyesCare-Logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Real-time log hook
  window.eyesCare.backend.onLog((log) => {
    appendLogLine(log);
  });

  // Periodic status poll
  setInterval(refreshStatus, 2000);

  await refreshStatus();
  await loadInitialLogs();
});
