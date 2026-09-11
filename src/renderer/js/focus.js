/**
 * Focus & Reading Tools Controller
 * Manages Reading Ruler, Spotlight, and Focus Blur overlay modes.
 */
class FocusController {
  constructor() {
    this.focusCards      = document.querySelectorAll('.focus-card');
    this.sizeSlider      = document.getElementById('slider-focus-size');
    this.opacitySlider   = document.getElementById('slider-focus-opacity');
    this.sizeVal         = document.getElementById('focus-size-val');
    this.opacityVal      = document.getElementById('focus-opacity-val');
    this.toggleOverlayBtn = document.getElementById('btn-toggle-focus-overlay');

    this.activeMode = 'read';
    this.isActive   = false;
    this._paramDebounce = null;

    this.init();
  }

  async init() {
    this.setupModes();
    this.setupSliders();
    this.setupToggle();
    await this.loadInitialSettings();
  }

  // ─── Mode Selection ──────────────────────────────────────────────────────

  setupModes() {
    this.focusCards.forEach(card => {
      card.addEventListener('click', async () => {
        this.focusCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.activeMode = card.dataset.focusmode;
        try {
          await window.eyesCare.focus.setMode(this.activeMode);
        } catch (e) {
          console.error('[Focus] Set mode error:', e);
        }
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  // ─── Sliders ────────────────────────────────────────────────────────────

  setupSliders() {
    this.sizeSlider.addEventListener('input', (e) => {
      this.sizeVal.textContent = `${e.target.value}px`;
      this.debounceParams();
    });

    this.opacitySlider.addEventListener('input', (e) => {
      this.opacityVal.textContent = `${e.target.value}%`;
      this.debounceParams();
    });
  }

  debounceParams() {
    if (this._paramDebounce) clearTimeout(this._paramDebounce);
    this._paramDebounce = setTimeout(() => this.updateParams(), 160);
  }

  async updateParams() {
    try {
      await window.eyesCare.focus.updateParams({
        size:    parseInt(this.sizeSlider.value,   10),
        opacity: parseInt(this.opacitySlider.value, 10)
      });
    } catch (e) {
      console.error('[Focus] Param update error:', e);
    }
  }

  // ─── Toggle Overlay ──────────────────────────────────────────────────────

  setupToggle() {
    this.toggleOverlayBtn.addEventListener('click', async () => {
      this.isActive = !this.isActive;
      if (this.isActive) {
        await window.eyesCare.focus.enable();
        this.toggleOverlayBtn.textContent = '🔴 Deactivate Focus Overlay';
        this.toggleOverlayBtn.className   = 'btn btn-danger focus-activate-btn';
        window.eyesCareApp?.showToast(`🎯 Focus overlay active (${this.activeMode})`, 'success', 2500);
      } else {
        await window.eyesCare.focus.disable();
        this.toggleOverlayBtn.textContent = '🎯 Activate Focus Overlay';
        this.toggleOverlayBtn.className   = 'btn btn-primary focus-activate-btn';
        window.eyesCareApp?.showToast('Focus overlay closed', 'info', 1800);
      }
    });
  }

  // ─── Load ────────────────────────────────────────────────────────────────

  async loadInitialSettings() {
    try {
      const s = await window.eyesCare.focus.getSettings();
      if (s) {
        this.activeMode = s.mode || 'read';
        this.sizeSlider.value   = s.focus_size || 140;
        this.sizeVal.textContent = `${s.focus_size || 140}px`;

        const op = Math.round((s.opacity || 0.65) * 100);
        this.opacitySlider.value   = op;
        this.opacityVal.textContent = `${op}%`;

        this.focusCards.forEach(c => {
          c.classList.toggle('active', c.dataset.focusmode === this.activeMode);
        });
      }
    } catch (e) {
      console.error('[Focus] Load error:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.focusController = new FocusController();
});
