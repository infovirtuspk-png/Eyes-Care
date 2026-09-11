/**
 * Eyes Care — Master Application Controller
 * Handles navigation, title bar, license status, toast notifications,
 * and custom modal dialogs (replacing alert/prompt/confirm).
 */
class EyesCareApp {
  constructor() {
    this.currentPage = 'display';
    this._modalResolve = null;
    this._modalReject = null;
    this.init();
  }

  async init() {
    this.setupTitleBar();
    this.setupNavigation();
    this.setupModal();
    await this.setupLicenseStatus();
  }

  // ─── Title Bar ───────────────────────────────────────────────────────────

  setupTitleBar() {
    document.getElementById('btn-minimize').addEventListener('click', async () => {
      await window.eyesCare.window.minimize();
    });

    document.getElementById('btn-close').addEventListener('click', async () => {
      await window.eyesCare.window.close();
    });

    document.getElementById('btn-terminal-quick').addEventListener('click', async () => {
      await window.eyesCare.window.openTerminal();
    });

    document.getElementById('sidebar-terminal-btn').addEventListener('click', async () => {
      await window.eyesCare.window.openTerminal();
    });

    document.getElementById('btn-help').addEventListener('click', () => {
      this.navigateTo('about');
    });

    document.getElementById('btn-open-terminal-about')?.addEventListener('click', async () => {
      await window.eyesCare.window.openTerminal();
    });

    document.getElementById('btn-open-logs-dir')?.addEventListener('click', async () => {
      await window.eyesCare.backend.openLogsDir();
    });
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  setupNavigation() {
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTo(item.dataset.page);
      });
      // Keyboard accessibility
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigateTo(item.dataset.page);
        }
      });
    });
  }

  navigateTo(pageName) {
    if (this.currentPage === pageName) return;

    // Update sidebar
    document.querySelectorAll('.sidebar-item').forEach(i => {
      i.classList.toggle('active', i.dataset.page === pageName);
      i.setAttribute('aria-current', i.dataset.page === pageName ? 'page' : 'false');
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${pageName}`);
    if (target) {
      target.classList.add('active');
      this.currentPage = pageName;
    }
  }

  // ─── License / Activation ────────────────────────────────────────────────

  async setupLicenseStatus() {
    try {
      const status = await window.eyesCare.activation.getStatus();
      this._renderLicenseUI(status);

      // Activate button
      const actBtn = document.getElementById('btn-activate-license');
      if (actBtn && !actBtn._hasListener) {
        actBtn._hasListener = true;
        actBtn.addEventListener('click', async () => {
          const keyInput = document.getElementById('inp-license-key');
          const key = (keyInput.value || '').trim();
          if (!key) {
            this.showToast('Please enter the activation key', 'warning');
            keyInput.focus();
            return;
          }
          actBtn.disabled = true;
          actBtn.textContent = '⌛ Activating...';
          try {
            const res = await window.eyesCare.activation.activate(key);
            if (res && res.success) {
              this.showToast('🎉 Eyes Care activated successfully!', 'success');
              keyInput.value = '';
              const updStatus = await window.eyesCare.activation.getStatus();
              this._renderLicenseUI(updStatus);
            } else {
              this.showToast(res.message || 'Invalid activation key. Try @Nuttertools123', 'error');
            }
          } catch (e) {
            this.showToast('Activation error: ' + e.message, 'error');
          }
          actBtn.disabled = false;
          actBtn.textContent = '🔓 Activate';
        });
      }
    } catch (e) {
      console.error('[App] License check error:', e);
    }
  }

  _renderLicenseUI(status) {
    const headerBadge = document.getElementById('header-license-badge');
    const licBadge    = document.getElementById('lic-status-badge');
    const licDays     = document.getElementById('lic-days-text');
    const machIdEl    = document.getElementById('lic-machine-id');

    if (machIdEl && status.machine_id) {
      machIdEl.textContent = status.machine_id.substring(0, 12) + '…';
    }

    if (status.activated) {
      if (headerBadge) {
        headerBadge.textContent = '✓ PRO ACTIVE';
        headerBadge.className = 'header-status-pill active';
      }
      if (licBadge) {
        licBadge.textContent = '✓ Lifetime Offline License Active';
        licBadge.className = 'activate-status-badge active';
      }
      if (licDays) {
        licDays.innerHTML = 'Thank you for activating <strong>Eyes Care</strong>! All features are permanently unlocked offline.';
      }
    } else {
      const days = status.days_remaining !== undefined ? status.days_remaining : 15;
      if (headerBadge) {
        headerBadge.textContent = `Trial (${days}d)`;
        headerBadge.className = 'header-status-pill trial';
      }
      if (licBadge) {
        licBadge.textContent = `⏳ ${days} Days remaining in Trial`;
        licBadge.className = 'activate-status-badge trial';
      }
      if (licDays) {
        licDays.innerHTML = `You are running the <strong>${days}-day full-feature trial</strong>. All offline display calibration, break management, focus, and background automation features are fully active.`;
      }
    }
  }

  // ─── Toast Notification System ────────────────────────────────────────────

  showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('dismissing');
      setTimeout(() => toast.remove(), 220);
    };

    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
    return toast;
  }

  // ─── Custom Modal (replaces window.alert / window.prompt / window.confirm) ─

  setupModal() {
    const overlay = document.getElementById('modal-overlay');
    const cancelBtn = document.getElementById('modal-cancel');
    const okBtn     = document.getElementById('modal-ok');
    const inp       = document.getElementById('modal-input');

    const close = (value) => {
      overlay.style.display = 'none';
      if (this._modalResolve) {
        this._modalResolve(value);
        this._modalResolve = null;
        this._modalReject  = null;
      }
    };

    cancelBtn.addEventListener('click', () => close(null));
    okBtn.addEventListener('click', () => close(inp ? inp.value : true));
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') close(inp.value);
      if (e.key === 'Escape') close(null);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
  }

  /**
   * Show a custom input modal.
   * @param {string} title
   * @param {string} body
   * @param {string} defaultValue
   * @param {string} placeholder
   * @returns {Promise<string|null>}
   */
  showPrompt(title, body, defaultValue = '', placeholder = '') {
    return new Promise((resolve) => {
      this._modalResolve = resolve;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').textContent = body;
      const inp = document.getElementById('modal-input');
      inp.style.display = 'block';
      inp.value = defaultValue;
      inp.placeholder = placeholder;
      document.getElementById('modal-ok').textContent = 'OK';
      document.getElementById('modal-cancel').style.display = 'inline-flex';
      overlay.style.display = 'flex';
      setTimeout(() => inp.focus(), 80);
    });
  }

  /**
   * Show an alert modal.
   * @returns {Promise<void>}
   */
  showAlert(title, body, okLabel = 'OK') {
    return new Promise((resolve) => {
      this._modalResolve = resolve;
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = body;
      const inp = document.getElementById('modal-input');
      inp.style.display = 'none';
      document.getElementById('modal-ok').textContent = okLabel;
      document.getElementById('modal-cancel').style.display = 'none';
      overlay.style.display = 'flex';
    });
  }

  /**
   * Show a confirm dialog.
   * @returns {Promise<boolean>}
   */
  showConfirm(title, body, okLabel = 'Confirm') {
    return new Promise((resolve) => {
      this._modalResolve = (v) => resolve(v !== null);
      const overlay = document.getElementById('modal-overlay');
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-body').innerHTML = body;
      const inp = document.getElementById('modal-input');
      inp.style.display = 'none';
      document.getElementById('modal-ok').textContent = okLabel;
      document.getElementById('modal-cancel').style.display = 'inline-flex';
      document.getElementById('modal-cancel').textContent = 'Cancel';
      overlay.style.display = 'flex';
    });
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.eyesCareApp = new EyesCareApp();
});
