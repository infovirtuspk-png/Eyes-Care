/**
 * MagicX Window Enhancement Controller
 * Manages visual shaders (dark invert, grayscale, night dim) and floating toolbar.
 */
class MagicXController {
  constructor() {
    this.filterButtons    = document.querySelectorAll('.magicx-filter-btn');
    this.toggleToolbarBtn = document.getElementById('btn-toggle-magicx-toolbar');
    this.toolbarStatusDot = document.getElementById('magicx-toolbar-dot');
    this.toolbarStatusTxt = document.getElementById('magicx-toolbar-status-text');

    this.toolbarOpen = false;
    this.init();
  }

  async init() {
    this.setupFilters();
    this.setupToolbarToggle();
    await this.loadInitialSettings();
  }

  // ─── Filters ─────────────────────────────────────────────────────────────

  setupFilters() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        this.filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        try {
          await window.eyesCare.magicx.setFilter(filter);
          const labels = { dark: '🌙 Dark invert', gray: '🔘 Grayscale', dim: '🕶️ Night dim', none: '☀️ Filter restored' };
          window.eyesCareApp?.showToast(labels[filter] || 'Filter applied', 'info', 1800);
        } catch (e) {
          console.error('[MagicX] Filter error:', e);
        }
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  // ─── Toolbar Toggle ──────────────────────────────────────────────────────

  setupToolbarToggle() {
    this.toggleToolbarBtn.addEventListener('click', async () => {
      try {
        await window.eyesCare.magicx.toggle();
        this.toolbarOpen = !this.toolbarOpen;
        this._updateToolbarStatus(this.toolbarOpen);
        window.eyesCareApp?.showToast(
          this.toolbarOpen ? '✨ Toolbar opened' : '✨ Toolbar closed',
          'info', 1800
        );
      } catch (e) {
        console.error('[MagicX] Toolbar toggle error:', e);
      }
    });
  }

  _updateToolbarStatus(isOpen) {
    if (this.toolbarStatusDot) {
      this.toolbarStatusDot.className = 'status-dot' + (isOpen ? '' : ' muted');
    }
    if (this.toolbarStatusTxt) {
      this.toolbarStatusTxt.textContent = isOpen ? 'Toolbar is open' : 'Toolbar is closed';
    }
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  async loadInitialSettings() {
    try {
      const s = await window.eyesCare.magicx.getSettings();
      if (s) {
        const activeFilter = s.active_filter || 'none';
        this.filterButtons.forEach(b => {
          b.classList.toggle('active', b.dataset.filter === activeFilter);
        });
      }
    } catch (e) {
      console.error('[MagicX] Load error:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.magicXController = new MagicXController();
});
