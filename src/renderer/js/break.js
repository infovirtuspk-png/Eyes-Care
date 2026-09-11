/**
 * Break Management Controller
 * Controls 20-20-20, Pomodoro, Standard, and Custom break cycles.
 * Drives real-time countdown display and progress bar.
 */
class BreakController {
  constructor() {
    this.countdownEl  = document.getElementById('break-countdown-display');
    this.statusLabel  = document.getElementById('break-status-label');
    this.toggleBtn    = document.getElementById('btn-break-toggle');
    this.breakNowBtn  = document.getElementById('btn-break-now');
    this.resetBtn     = document.getElementById('btn-break-reset');
    this.progressBar  = document.getElementById('break-progress-bar');

    this.workMinInput   = document.getElementById('inp-break-work-min');
    this.restSecInput   = document.getElementById('inp-break-rest-sec');
    this.smartPauseToggle = document.getElementById('toggle-smart-pause');
    this.enforcedToggle   = document.getElementById('toggle-enforced-break');
    this.modeButtons    = document.querySelectorAll('.break-mode-btn');

    this.state = 'RUNNING';
    this.workDurationSec = 20 * 60;
    this.elapsedSec = 0;

    this.init();
  }

  async init() {
    this.setupButtons();
    this.setupModeTabs();
    this.setupInputs();
    await this.loadInitialSettings();
    this.listenForTicks();
  }

  // ─── Buttons ────────────────────────────────────────────────────────────

  setupButtons() {
    this.toggleBtn.addEventListener('click', async () => {
      if (this.state === 'RUNNING' || this.state === 'IN_BREAK') {
        await window.eyesCare.break.pause();
        this.setToggleState('PAUSED');
        window.eyesCareApp?.showToast('⏸ Break timer paused', 'info', 1800);
      } else {
        await window.eyesCare.break.resume();
        this.setToggleState('RUNNING');
        window.eyesCareApp?.showToast('▶ Break timer resumed', 'success', 1800);
      }
    });

    this.breakNowBtn.addEventListener('click', async () => {
      await window.eyesCare.break.takeNow();
      window.eyesCareApp?.showToast('☕ Break started — rest your eyes!', 'info', 2500);
    });

    this.resetBtn.addEventListener('click', async () => {
      await window.eyesCare.break.reset();
      this.setToggleState('RUNNING');
      if (this.progressBar) this.progressBar.style.width = '0%';
      window.eyesCareApp?.showToast('↺ Break timer reset', 'info', 1800);
    });
  }

  setToggleState(state) {
    this.state = state;
    if (state === 'PAUSED') {
      this.toggleBtn.innerHTML = '▶ Resume';
      this.toggleBtn.className = 'btn btn-secondary';
    } else {
      this.toggleBtn.innerHTML = '⏸ Pause';
      this.toggleBtn.className = 'btn btn-primary';
    }
  }

  // ─── Mode Tabs ───────────────────────────────────────────────────────────

  setupModeTabs() {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        this.modeButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        await this.applyMode(btn.dataset.breakmode);
      });
    });
  }

  async applyMode(mode) {
    const modes = {
      '20-20-20': { work: 20,  rest: 20  },
      'pomodoro':  { work: 25,  rest: 300 },
      'standard':  { work: 50,  rest: 600 },
    };
    const m = modes[mode];
    if (m) {
      this.workMinInput.value = m.work;
      this.restSecInput.value = m.rest;
    }
    this.workDurationSec = parseInt(this.workMinInput.value, 10) * 60;
    await this.saveCurrentSettings(mode);
    window.eyesCareApp?.showToast(`Mode set: ${mode}`, 'success', 1800);
  }

  // ─── Input Handlers ──────────────────────────────────────────────────────

  setupInputs() {
    const saveHandler = () => {
      this.workDurationSec = parseInt(this.workMinInput.value, 10) * 60;
      this.saveCurrentSettings('custom');
    };
    this.workMinInput.addEventListener('change', saveHandler);
    this.restSecInput.addEventListener('change', saveHandler);
    this.smartPauseToggle.addEventListener('change', saveHandler);
    this.enforcedToggle.addEventListener('change', saveHandler);
  }

  async saveCurrentSettings(profileName) {
    try {
      await window.eyesCare.break.saveSettings({
        enabled: 1,
        work_minutes:       parseInt(this.workMinInput.value,  10) || 20,
        short_break_seconds: parseInt(this.restSecInput.value, 10) || 20,
        smart_pause: this.smartPauseToggle.checked ? 1 : 0,
        enforced:    this.enforcedToggle.checked   ? 1 : 0,
        profile:     profileName || '20-20-20'
      });
    } catch (e) {
      console.error('[Break] Save error:', e);
    }
  }

  // ─── Load ────────────────────────────────────────────────────────────────

  async loadInitialSettings() {
    try {
      const s = await window.eyesCare.break.getSettings();
      if (s) {
        this.workMinInput.value  = s.work_minutes       || 20;
        this.restSecInput.value  = s.short_break_seconds || 20;
        this.smartPauseToggle.checked = s.smart_pause === 1;
        this.enforcedToggle.checked   = s.enforced      === 1;
        this.workDurationSec = (s.work_minutes || 20) * 60;

        this.modeButtons.forEach(b => {
          const isActive = b.dataset.breakmode === (s.profile || '20-20-20');
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      }

      const status = await window.eyesCare.break.getStatus();
      if (status) {
        this.state = status.state || 'RUNNING';
        if (this.countdownEl) this.countdownEl.textContent = status.formattedTime || '20:00';
        this.setToggleState(this.state === 'PAUSED' ? 'PAUSED' : 'RUNNING');
      }
    } catch (e) {
      console.error('[Break] Load error:', e);
    }
  }

  // ─── Real-time Ticks ─────────────────────────────────────────────────────

  listenForTicks() {
    window.eyesCare.break.onTick((data) => {
      this.state = data.state;

      if (data.formattedTime && this.countdownEl) {
        this.countdownEl.textContent = data.formattedTime;
      }

      // Progress bar
      if (this.progressBar && data.elapsedSeconds !== undefined && this.workDurationSec > 0) {
        const pct = Math.min(100, (data.elapsedSeconds / this.workDurationSec) * 100);
        this.progressBar.style.width = `${pct}%`;
      }

      // Countdown color + status
      if (this.countdownEl) {
        this.countdownEl.className = 'break-countdown';
      }
      if (data.state === 'IN_BREAK') {
        if (this.statusLabel) {
          this.statusLabel.textContent = '🛑 REST IN PROGRESS';
          this.statusLabel.style.color = 'var(--warning-color)';
        }
        this.toggleBtn.innerHTML = '⏸ Pause';
        this.toggleBtn.className = 'btn btn-primary';
        if (this.countdownEl) this.countdownEl.classList.add('in-break');
        if (this.progressBar)  this.progressBar.style.width = '0%';
      } else if (data.state === 'PAUSED') {
        if (this.statusLabel) {
          this.statusLabel.textContent = '⏸ PAUSED';
          this.statusLabel.style.color = 'var(--text-muted)';
        }
        this.toggleBtn.innerHTML = '▶ Resume';
        this.toggleBtn.className = 'btn btn-secondary';
        if (this.countdownEl) this.countdownEl.classList.add('paused');
      } else {
        // RUNNING / WAITING
        if (this.statusLabel) {
          this.statusLabel.textContent = 'NEXT REST IN';
          this.statusLabel.style.color = 'var(--text-muted)';
        }
        this.toggleBtn.innerHTML = '⏸ Pause';
        this.toggleBtn.className = 'btn btn-primary';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.breakController = new BreakController();
});
