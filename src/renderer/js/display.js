/**
 * Display Calibration Controller
 * Real-time Windows GDI gamma + hardware brightness control
 */
class DisplayController {
  constructor() {
    this.tempSlider  = document.getElementById('slider-temperature');
    this.brightSlider= document.getElementById('slider-brightness');
    this.tempVal     = document.getElementById('disp-temp-val');
    this.brightVal   = document.getElementById('disp-bright-val');
    this.autoDayNightToggle = document.getElementById('toggle-autodaynight');
    this.resetBtn    = document.getElementById('btn-reset-display');
    this.presetCards = document.querySelectorAll('.preset-card');
    this.dayNightIcon= document.getElementById('day-night-icon');

    this.debounceTimer = null;
    this._applying = false;

    this.init();
  }

  async init() {
    this.setupSliders();
    this.setupPresets();
    this.setupAutoDayNight();
    this.setupReset();
    await this.loadInitialSettings();
    this.listenForBackendChanges();
  }

  // ─── Sliders ────────────────────────────────────────────────────────────

  setupSliders() {
    this.tempSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.tempVal.textContent = `${val}K`;
      this.highlightActivePreset(null);
      this.debounceApply(() => window.eyesCare.display.setTemperature(val));
    });

    this.brightSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.brightVal.textContent = `${val}%`;
      this.highlightActivePreset(null);
      this.debounceApply(() => window.eyesCare.display.setBrightness(val));
    });
  }

  // ─── Presets ────────────────────────────────────────────────────────────

  setupPresets() {
    this.presetCards.forEach(card => {
      card.addEventListener('click', async () => {
        const preset = card.dataset.preset;
        this.highlightActivePreset(preset);
        try {
          await window.eyesCare.display.applyProfile(preset);
          // The backend emits DISPLAY_CHANGED which will update sliders
        } catch (e) {
          console.error('[Display] Preset error:', e);
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

  highlightActivePreset(presetName) {
    this.presetCards.forEach(c => {
      c.classList.toggle(
        'active',
        presetName !== null &&
        c.dataset.preset.toLowerCase() === (presetName || '').toLowerCase()
      );
    });
  }

  // ─── Auto Day/Night ──────────────────────────────────────────────────────

  setupAutoDayNight() {
    this.autoDayNightToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      try {
        const cur = await window.eyesCare.dayNight.getSettings();
        await window.eyesCare.dayNight.saveSettings({ ...cur, enabled: enabled ? 1 : 0 });
        this._updateDayNightIcon(enabled);
        window.eyesCareApp?.showToast(
          enabled ? '🌓 Auto Day/Night enabled' : '⏸ Auto Day/Night disabled',
          'info', 2000
        );
      } catch (e) {
        console.error('[Display] Day/Night toggle error:', e);
      }
    });
  }

  _updateDayNightIcon(enabled) {
    if (this.dayNightIcon) {
      this.dayNightIcon.textContent = enabled ? '🌓' : '⏸';
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  setupReset() {
    this.resetBtn.addEventListener('click', async () => {
      this.resetBtn.disabled = true;
      try {
        await window.eyesCare.display.reset();
        this.tempSlider.value   = 6500;
        this.tempVal.textContent = '6500K';
        this.brightSlider.value  = 100;
        this.brightVal.textContent = '100%';
        this.highlightActivePreset('Pause');
        window.eyesCareApp?.showToast('✓ Display reset to defaults', 'success', 2200);
      } catch (e) {
        window.eyesCareApp?.showToast('Reset failed: ' + e.message, 'error');
      }
      this.resetBtn.disabled = false;
    });
  }

  // ─── Load Initial ─────────────────────────────────────────────────────────

  async loadInitialSettings() {
    try {
      const settings = await window.eyesCare.display.getSettings();
      if (settings) {
        const temp   = settings.temperature || 6500;
        const bright = settings.brightness  || 100;

        this.tempSlider.value   = temp;
        this.tempVal.textContent = `${temp}K`;
        this.brightSlider.value  = bright;
        this.brightVal.textContent = `${bright}%`;
        this.highlightActivePreset(settings.profile || null);
        this.autoDayNightToggle.checked = !!settings.autoDayNight;
        this._updateDayNightIcon(!!settings.autoDayNight);
      }

      // Monitor count
      const monitors = await window.eyesCare.display.getMonitors();
      const badgeText = document.getElementById('monitor-badge-text');
      if (badgeText && monitors && monitors.length > 0) {
        badgeText.textContent = `${monitors.length} Display${monitors.length > 1 ? 's' : ''} Active`;
      }

      // Capabilities
      const caps = await window.eyesCare.display.getCapabilities();
      const capText = document.getElementById('display-capability-text');
      if (capText && caps) {
        const methods = [];
        if (caps.gammaRamp) methods.push('GDI Gamma Ramp');
        if (caps.wmi)       methods.push('WMI HW Brightness');
        if (caps.ddc)       methods.push('DDC/CI');
        capText.textContent = methods.length > 0
          ? methods.join(' + ') + ' Active'
          : 'Software Brightness Fallback Active';
      }
    } catch (e) {
      console.error('[Display] Initial load error:', e);
    }
  }

  // ─── Real-time Backend Events ─────────────────────────────────────────────

  listenForBackendChanges() {
    window.eyesCare.display.onChanged((data) => {
      if (data.temperature !== undefined) {
        this.tempSlider.value   = data.temperature;
        this.tempVal.textContent = `${data.temperature}K`;
      }
      if (data.brightness !== undefined) {
        this.brightSlider.value  = data.brightness;
        this.brightVal.textContent = `${data.brightness}%`;
      }
      if (data.profile) {
        this.highlightActivePreset(data.profile);
      }
    });
  }

  // ─── Debounce helper ──────────────────────────────────────────────────────

  debounceApply(fn) {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(fn, 180);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.displayController = new DisplayController();
});
