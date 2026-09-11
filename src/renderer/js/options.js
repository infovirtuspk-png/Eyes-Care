/**
 * Options & Advanced Configurations Controller
 * Manages General settings, Schedules, Timers, App Rules, Hotkeys, and Backup.
 * All user input uses custom modal dialogs (no native alert/prompt/confirm).
 */
class OptionsController {
  constructor() {
    this.tabButtons   = document.querySelectorAll('.opt-tab-btn');
    this.tabContents  = document.querySelectorAll('.opt-tab-content');

    this.startWindowsToggle = document.getElementById('opt-start-windows');
    this.closeTrayToggle    = document.getElementById('opt-close-tray');
    this.smoothTransToggle  = document.getElementById('opt-smooth-trans');

    this.schedulesTbody = document.getElementById('schedules-tbody');
    this.timersTbody    = document.getElementById('timers-tbody');
    this.rulesTbody     = document.getElementById('rules-tbody');
    this.hotkeysTbody   = document.getElementById('hotkeys-tbody');

    this.init();
  }

  async init() {
    this.setupTabs();
    this.setupGeneralSettings();
    this.setupSchedules();
    this.setupTimers();
    this.setupRules();
    this.setupBackupRestore();
    await this.loadAll();
  }

  // ─── Tab Navigation ──────────────────────────────────────────────────────

  setupTabs() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.tabContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const tab = btn.dataset.opttab;
        const target = document.getElementById(`opttab-${tab}`);
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
        }
      });
    });
  }

  // ─── General Settings ────────────────────────────────────────────────────

  setupGeneralSettings() {
    const save = async () => {
      try {
        await window.eyesCare.settings.saveGeneral({
          start_with_windows: this.startWindowsToggle.checked ? '1' : '0',
          close_to_tray:      this.closeTrayToggle.checked    ? '1' : '0',
          smooth_transition:  this.smoothTransToggle.checked  ? '1' : '0',
        });
        window.eyesCareApp?.showToast('✓ General settings saved', 'success', 1800);
      } catch (e) {
        window.eyesCareApp?.showToast('Save failed: ' + e.message, 'error');
      }
    };

    this.startWindowsToggle.addEventListener('change', save);
    this.closeTrayToggle.addEventListener('change', save);
    this.smoothTransToggle.addEventListener('change', save);
  }

  // ─── Schedules ───────────────────────────────────────────────────────────

  setupSchedules() {
    document.getElementById('btn-add-schedule')?.addEventListener('click', async () => {
      const app = window.eyesCareApp;
      if (!app) return;

      const name = await app.showPrompt('New Schedule', 'Enter a schedule name:', 'Evening Study', 'e.g. Evening Reading');
      if (!name) return;

      const start = await app.showPrompt('Start Time', 'Enter start time (24h format):', '18:00', 'e.g. 18:00');
      if (!start) return;

      const end = await app.showPrompt('End Time', 'Enter end time (24h format):', '22:00', 'e.g. 22:00');
      if (!end) return;

      const profiles = ['Health', 'Office', 'Reading', 'Movie', 'Game', 'Pause'];
      const profile = await app.showPrompt(
        'Target Profile',
        `Profile (${profiles.join(', ')}):`,
        'Reading',
        'Enter profile name'
      );
      if (!profile) return;

      try {
        await window.eyesCare.schedules.save({
          name,
          start_time:   start,
          end_time:     end,
          days:         'mon,tue,wed,thu,fri',
          profile_name: profile,
          brightness:   75,
          temperature:  4000,
          priority:     3,
          enabled:      1
        });
        await this.loadSchedules();
        app.showToast(`✓ Schedule "${name}" added`, 'success');
      } catch (e) {
        app.showToast('Failed to add schedule: ' + e.message, 'error');
      }
    });
  }

  // ─── Timers ──────────────────────────────────────────────────────────────

  setupTimers() {
    document.getElementById('btn-add-timer')?.addEventListener('click', async () => {
      const app = window.eyesCareApp;
      if (!app) return;

      const name = await app.showPrompt('New Timer', 'Enter timer name:', 'Sprint Focus', 'e.g. Pomodoro Sprint');
      if (!name) return;

      const mins = await app.showPrompt('Duration', 'Duration in minutes:', '25', 'e.g. 25');
      if (!mins) return;

      try {
        await window.eyesCare.timer.saveTimer({
          name,
          duration_seconds:  parseInt(mins, 10) * 60,
          completion_action: 'notification',
          target_profile:    'Office',
          enabled:           1
        });
        await this.loadTimers();
        app.showToast(`✓ Timer "${name}" added`, 'success');
      } catch (e) {
        app.showToast('Failed to add timer: ' + e.message, 'error');
      }
    });
  }

  // ─── App Rules ───────────────────────────────────────────────────────────

  setupRules() {
    document.getElementById('btn-add-rule')?.addEventListener('click', async () => {
      const app = window.eyesCareApp;
      if (!app) return;

      const appName = await app.showPrompt('New Rule – App Name', 'Application display name:', 'VLC Player', 'e.g. VLC Media Player');
      if (!appName) return;

      const exe = await app.showPrompt('Executable Name', 'Process filename (e.g. vlc.exe):', 'vlc.exe', 'filename.exe');
      if (!exe) return;

      const profile = await app.showPrompt(
        'Target Profile',
        'Profile (Health / Movie / Game / Office / Reading):',
        'Movie',
        'Enter profile name'
      );
      if (!profile) return;

      try {
        await window.eyesCare.rules.save({
          app_name:         appName,
          executable_name:  exe.toLowerCase(),
          action:           'profile',
          profile_name:     profile,
          priority:         2,
          enabled:          1
        });
        await this.loadRules();
        app.showToast(`✓ Rule for "${appName}" added`, 'success');
      } catch (e) {
        app.showToast('Failed to add rule: ' + e.message, 'error');
      }
    });
  }

  // ─── Backup / Restore ────────────────────────────────────────────────────

  setupBackupRestore() {
    document.getElementById('btn-export-settings')?.addEventListener('click', async () => {
      try {
        const jsonStr = await window.eyesCare.settings.export();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `EyesCareSettings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.eyesCareApp?.showToast('✓ Settings exported', 'success');
      } catch (e) {
        window.eyesCareApp?.showToast('Export failed: ' + e.message, 'error');
      }
    });

    document.getElementById('btn-import-settings')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const res = await window.eyesCare.settings.import(ev.target.result);
            if (res && res.success) {
              window.eyesCareApp?.showToast('✓ Settings restored — reloading…', 'success', 1800);
              setTimeout(() => location.reload(), 1500);
            } else {
              window.eyesCareApp?.showToast('Import failed: ' + (res?.error || 'Unknown error'), 'error');
            }
          } catch (err) {
            window.eyesCareApp?.showToast('Import error: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    document.getElementById('btn-reset-all')?.addEventListener('click', async () => {
      const app = window.eyesCareApp;
      if (!app) return;
      const confirmed = await app.showConfirm(
        '⚠️ Reset All Settings',
        'This will reset <strong>all</strong> Eyes Care settings, profiles, schedules, and rules to factory defaults. This cannot be undone.',
        '🗑️ Reset Everything'
      );
      if (!confirmed) return;
      try {
        await window.eyesCare.settings.reset();
        app.showToast('✓ All settings reset to defaults', 'success', 2500);
        setTimeout(() => location.reload(), 1200);
      } catch (e) {
        app.showToast('Reset failed: ' + e.message, 'error');
      }
    });
  }

  // ─── Load All ────────────────────────────────────────────────────────────

  async loadAll() {
    try {
      await this.loadGeneralSettings();
      await this.loadSchedules();
      await this.loadTimers();
      await this.loadRules();
      await this.loadHotkeys();
    } catch (e) {
      console.error('[Options] loadAll error:', e);
    }
  }

  async loadGeneralSettings() {
    const s = await window.eyesCare.settings.getGeneral();
    if (s) {
      this.startWindowsToggle.checked = s.start_with_windows !== '0';
      this.closeTrayToggle.checked    = s.close_to_tray      !== '0';
      this.smoothTransToggle.checked  = s.smooth_transition  !== '0';
    }
  }

  async loadSchedules() {
    try {
      const list = await window.eyesCare.schedules.get();
      this.schedulesTbody.innerHTML = '';
      if (!list || list.length === 0) {
        this.schedulesTbody.innerHTML = '<tr><td colspan="5" class="data-table-empty">No schedules configured. Click <strong>+ New Schedule</strong> to add one.</td></tr>';
        return;
      }
      for (const s of list) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="color:var(--text-primary)">${this._esc(s.name)}</strong></td>
          <td>${this._esc(s.start_time)} – ${this._esc(s.end_time)}</td>
          <td style="font-size:10px;color:var(--text-muted)">${this._esc(s.days)}</td>
          <td><span style="color:var(--accent-color);font-weight:700">${this._esc(s.profile_name)}</span></td>
          <td><button class="btn btn-outline btn-sm" data-del-sched="${s.id}">Delete</button></td>
        `;
        tr.querySelector('[data-del-sched]').addEventListener('click', async () => {
          await window.eyesCare.schedules.delete(s.id);
          await this.loadSchedules();
          window.eyesCareApp?.showToast('Schedule deleted', 'info', 1800);
        });
        this.schedulesTbody.appendChild(tr);
      }
    } catch (e) {
      console.error('[Options] loadSchedules error:', e);
    }
  }

  async loadTimers() {
    try {
      const list = await window.eyesCare.timer.getTimers();
      this.timersTbody.innerHTML = '';
      if (!list || list.length === 0) {
        this.timersTbody.innerHTML = '<tr><td colspan="4" class="data-table-empty">No timers configured.</td></tr>';
        return;
      }
      for (const t of list) {
        const mins = Math.round(t.duration_seconds / 60);
        const tr   = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="color:var(--text-primary)">${this._esc(t.name)}</strong></td>
          <td>${mins} min</td>
          <td style="color:var(--text-muted);font-size:10.5px">${this._esc(t.completion_action)}</td>
          <td style="display:flex;gap:4px">
            <button class="btn btn-primary btn-sm" data-start-timer="${t.id}">▶ Start</button>
            <button class="btn btn-outline btn-sm" data-del-timer="${t.id}">Delete</button>
          </td>
        `;
        tr.querySelector('[data-start-timer]').addEventListener('click', async () => {
          await window.eyesCare.timer.start({
            name:             t.name,
            durationSeconds:  t.duration_seconds,
            completionAction: t.completion_action,
            targetProfile:    t.target_profile
          });
          window.eyesCareApp?.showToast(`▶ Timer "${t.name}" started (${mins} min)`, 'success', 2200);
        });
        tr.querySelector('[data-del-timer]').addEventListener('click', async () => {
          await window.eyesCare.timer.deleteTimer(t.id);
          await this.loadTimers();
          window.eyesCareApp?.showToast('Timer deleted', 'info', 1800);
        });
        this.timersTbody.appendChild(tr);
      }
    } catch (e) {
      console.error('[Options] loadTimers error:', e);
    }
  }

  async loadRules() {
    try {
      const list = await window.eyesCare.rules.get();
      this.rulesTbody.innerHTML = '';
      if (!list || list.length === 0) {
        this.rulesTbody.innerHTML = '<tr><td colspan="4" class="data-table-empty">No app rules configured.</td></tr>';
        return;
      }
      for (const r of list) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="color:var(--text-primary)">${this._esc(r.app_name)}</strong></td>
          <td><code>${this._esc(r.executable_name)}</code></td>
          <td><span style="color:var(--accent-color);font-weight:700">${this._esc(r.profile_name)}</span></td>
          <td><button class="btn btn-outline btn-sm" data-del-rule="${r.id}">Delete</button></td>
        `;
        tr.querySelector('[data-del-rule]').addEventListener('click', async () => {
          await window.eyesCare.rules.delete(r.id);
          await this.loadRules();
          window.eyesCareApp?.showToast('Rule deleted', 'info', 1800);
        });
        this.rulesTbody.appendChild(tr);
      }
    } catch (e) {
      console.error('[Options] loadRules error:', e);
    }
  }

  async loadHotkeys() {
    try {
      const list = await window.eyesCare.hotkeys.get();
      this.hotkeysTbody.innerHTML = '';
      if (!list || list.length === 0) {
        this.hotkeysTbody.innerHTML = '<tr><td colspan="2" class="data-table-empty">No hotkeys found.</td></tr>';
        return;
      }
      for (const h of list) {
        const tr = document.createElement('tr');
        const label = (h.action || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tr.innerHTML = `
          <td style="color:var(--text-primary)">${this._esc(label)}</td>
          <td><kbd>${this._esc(h.accelerator)}</kbd></td>
        `;
        this.hotkeysTbody.appendChild(tr);
      }
    } catch (e) {
      console.error('[Options] loadHotkeys error:', e);
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  _esc(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.optionsController = new OptionsController();
});
