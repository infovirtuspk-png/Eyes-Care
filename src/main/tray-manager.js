const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const logger = require('../backend/logger');
const db = require('../database/database-manager');
const displayEngine = require('../backend/display-engine');
const breakEngine = require('../backend/break-engine');
const userTimerEngine = require('../backend/timer-engine');
const schedulerEngine = require('../backend/scheduler-engine');
const focusEngine = require('../backend/focus-engine');
const magicXEngine = require('../backend/magicx-engine');
const eventBus = require('../backend/event-bus');

class TrayManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.tray = null;
    this.isDayNightEnabled = false;
    this.updateThrottle = null;
  }

  async createTray() {
    try {
      const fs = require('fs');
      let iconPath = path.join(__dirname, '../renderer/assets/icons/tray-icon.ico');
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(__dirname, '../renderer/assets/icons/tray-icon.png');
      }

      let trayIcon = nativeImage.createFromPath(iconPath);
      if (trayIcon.isEmpty()) {
        const fallback = path.join(__dirname, '../renderer/assets/icons/tray-icon.png');
        trayIcon = nativeImage.createFromPath(fallback);
      }

      this.tray = new Tray(trayIcon);
      this.tray.setToolTip('Eyes Care - Eye Protection & Productivity');

      // Load initial Day/Night state
      try {
        const dn = await db.getDayNightSettings();
        if (dn) {
          this.isDayNightEnabled = dn.enabled === 1;
        }
      } catch (e) {
        // Fallback
      }

      this.updateContextMenu();

      // Hook EventBus for dynamic real-time tray menu and tooltip synchronization
      this.setupEventListeners();

      // Click behavior
      this.tray.on('click', () => {
        this.windowManager.toggleMainWindow();
      });

      this.tray.on('double-click', () => {
        this.windowManager.showMainWindow();
      });

      logger.success('TRAY', 'System tray integration active');
    } catch (err) {
      logger.error('TRAY', 'Failed to create system tray icon: ' + err.message);
    }
  }

  setupEventListeners() {
    const throttledUpdate = () => {
      if (this.updateThrottle) return;
      this.updateThrottle = setTimeout(() => {
        this.updateContextMenu();
        this.updateThrottle = null;
      }, 500);
    };

    eventBus.on(eventBus.constructor.EVENTS.DISPLAY_CHANGED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.BREAK_STARTED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.BREAK_STOPPED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.BREAK_PAUSED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.BREAK_RESUMED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.DAY_MODE_STARTED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.NIGHT_MODE_STARTED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.FOCUS_CHANGED, throttledUpdate);
    eventBus.on(eventBus.constructor.EVENTS.MAGICX_CHANGED, throttledUpdate);
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  updateContextMenu() {
    if (!this.tray) return;

    const curProfile = displayEngine.getCurrentProfile() || 'Office';
    const curBright = displayEngine.getBrightness();
    const curTemp = displayEngine.getTemperature();

    // Break status
    let breakStatusText = 'Break: Inactive';
    if (breakEngine.state === 'IN_BREAK') {
      breakStatusText = `Resting (${this.formatTime(breakEngine.breakRemainingSec)} left)`;
    } else if (breakEngine.state === 'PAUSED') {
      breakStatusText = 'Break: Paused';
    } else if (breakEngine.enabled) {
      breakStatusText = `Next Break: ${this.formatTime(breakEngine.workRemainingSec)}`;
    }

    // Status label
    const statusLine = `● Online: ${curProfile} (${curTemp}K / ${curBright}%)`;

    // Tooltip update
    this.tray.setToolTip(`Eyes Care\n${statusLine}\n${breakStatusText}`);

    const contextMenu = Menu.buildFromTemplate([
      // 1. Header & Status
      {
        label: '👁 Eyes Care',
        enabled: false
      },
      {
        label: `Status: ${statusLine}`,
        enabled: false
      },
      { type: 'separator' },

      // 2. Display Profiles
      {
        label: 'Display',
        submenu: [
          {
            label: '❤ Health Mode',
            type: 'checkbox',
            checked: curProfile === 'Health',
            click: () => { displayEngine.applyProfile('Health'); this.updateContextMenu(); }
          },
          {
            label: '💼 Office Mode',
            type: 'checkbox',
            checked: curProfile === 'Office',
            click: () => { displayEngine.applyProfile('Office'); this.updateContextMenu(); }
          },
          {
            label: '📖 Reading Mode',
            type: 'checkbox',
            checked: curProfile === 'Reading',
            click: () => { displayEngine.applyProfile('Reading'); this.updateContextMenu(); }
          },
          {
            label: '🎮 Game Mode',
            type: 'checkbox',
            checked: curProfile === 'Game',
            click: () => { displayEngine.applyProfile('Game'); this.updateContextMenu(); }
          },
          {
            label: '🎬 Movie Mode',
            type: 'checkbox',
            checked: curProfile === 'Movie',
            click: () => { displayEngine.applyProfile('Movie'); this.updateContextMenu(); }
          },
          {
            label: '⏸ Pause Protection',
            type: 'checkbox',
            checked: curProfile === 'Pause',
            click: () => { displayEngine.applyProfile('Pause'); this.updateContextMenu(); }
          }
        ]
      },

      // 3. Brightness Submenu
      {
        label: 'Brightness',
        submenu: [
          { label: '100% (Maximum)', type: 'checkbox', checked: curBright === 100, click: () => displayEngine.setBrightness(100) },
          { label: '90%', type: 'checkbox', checked: curBright === 90, click: () => displayEngine.setBrightness(90) },
          { label: '85% (Office Default)', type: 'checkbox', checked: curBright === 85, click: () => displayEngine.setBrightness(85) },
          { label: '80%', type: 'checkbox', checked: curBright === 80, click: () => displayEngine.setBrightness(80) },
          { label: '70% (Comfort)', type: 'checkbox', checked: curBright === 70, click: () => displayEngine.setBrightness(70) },
          { label: '60%', type: 'checkbox', checked: curBright === 60, click: () => displayEngine.setBrightness(60) },
          { label: '50% (Dim)', type: 'checkbox', checked: curBright === 50, click: () => displayEngine.setBrightness(50) },
          { label: '40%', type: 'checkbox', checked: curBright === 40, click: () => displayEngine.setBrightness(40) },
          { label: '30%', type: 'checkbox', checked: curBright === 30, click: () => displayEngine.setBrightness(30) },
          { label: '20%', type: 'checkbox', checked: curBright === 20, click: () => displayEngine.setBrightness(20) },
          { label: '10% (Minimum)', type: 'checkbox', checked: curBright === 10, click: () => displayEngine.setBrightness(10) },
          { type: 'separator' },
          { label: '▲ Brighter (+5%)', click: () => displayEngine.setBrightness(displayEngine.getBrightness() + 5) },
          { label: '▼ Dimmer (-5%)', click: () => displayEngine.setBrightness(displayEngine.getBrightness() - 5) }
        ]
      },

      // 4. Temperature Submenu
      {
        label: 'Temperature',
        submenu: [
          { label: '6500K (Standard Cool)', type: 'checkbox', checked: curTemp === 6500, click: () => displayEngine.setTemperature(6500) },
          { label: '5500K (Daylight)', type: 'checkbox', checked: curTemp === 5500, click: () => displayEngine.setTemperature(5500) },
          { label: '5000K (Office)', type: 'checkbox', checked: curTemp === 5000, click: () => displayEngine.setTemperature(5000) },
          { label: '4500K (Neutral)', type: 'checkbox', checked: curTemp === 4500, click: () => displayEngine.setTemperature(4500) },
          { label: '4000K (Warm Health)', type: 'checkbox', checked: curTemp === 4000, click: () => displayEngine.setTemperature(4000) },
          { label: '3500K (Night Amber)', type: 'checkbox', checked: curTemp === 3500, click: () => displayEngine.setTemperature(3500) },
          { label: '3000K (Cozy Reading)', type: 'checkbox', checked: curTemp === 3000, click: () => displayEngine.setTemperature(3000) },
          { label: '2500K (Candlelight)', type: 'checkbox', checked: curTemp === 2500, click: () => displayEngine.setTemperature(2500) },
          { label: '2000K (Ultra Warm)', type: 'checkbox', checked: curTemp === 2000, click: () => displayEngine.setTemperature(2000) },
          { label: '1000K (Night Glow)', type: 'checkbox', checked: curTemp === 1000, click: () => displayEngine.setTemperature(1000) },
          { type: 'separator' },
          { label: '▲ Cooler (+500K)', click: () => displayEngine.setTemperature(displayEngine.getTemperature() + 500) },
          { label: '▼ Warmer (-500K)', click: () => displayEngine.setTemperature(displayEngine.getTemperature() - 500) }
        ]
      },
      { type: 'separator' },

      // 5. Break Timer Submenu
      {
        label: 'Break Timer',
        submenu: [
          { label: breakStatusText, enabled: false },
          { type: 'separator' },
          {
            label: '20-20-20 Mode (20m / 20s)',
            type: 'checkbox',
            checked: breakEngine.mode === '20-20-20',
            click: () => {
              breakEngine.setMode('20-20-20', 20, 20);
              this.updateContextMenu();
            }
          },
          {
            label: 'Pomodoro Mode (25m / 5m)',
            type: 'checkbox',
            checked: breakEngine.mode === 'pomodoro',
            click: () => {
              breakEngine.setMode('pomodoro', 25, 300);
              this.updateContextMenu();
            }
          },
          {
            label: 'Standard Mode (50m / 10m)',
            type: 'checkbox',
            checked: breakEngine.mode === 'standard',
            click: () => {
              breakEngine.setMode('standard', 50, 600);
              this.updateContextMenu();
            }
          },
          { type: 'separator' },
          {
            label: breakEngine.state === 'PAUSED' ? '▶ Resume Break Timer' : '⏸ Pause Break Timer',
            click: () => {
              if (breakEngine.state === 'PAUSED') {
                breakEngine.resume();
              } else {
                breakEngine.pause();
              }
              this.updateContextMenu();
            }
          },
          {
            label: '↺ Reset Break Timer',
            click: () => {
              breakEngine.resetTimer();
              this.updateContextMenu();
            }
          }
        ]
      },

      // 6. Take Break Now Action
      {
        label: 'Take Break Now',
        click: () => breakEngine.takeBreakNow()
      },
      { type: 'separator' },

      // 7. User Timer Submenu
      {
        label: 'User Timer',
        submenu: [
          {
            label: '⏱ 15m Quick Focus',
            click: () => userTimerEngine.startTimer({ name: 'Quick Focus', durationSeconds: 900, completionAction: 'notification' })
          },
          {
            label: '⏱ 25m Pomodoro Sprint',
            click: () => userTimerEngine.startTimer({ name: 'Pomodoro Sprint', durationSeconds: 1500, completionAction: 'notification' })
          },
          {
            label: '⏱ 45m Deep Work Block',
            click: () => userTimerEngine.startTimer({ name: 'Deep Work Block', durationSeconds: 2700, completionAction: 'notification' })
          },
          {
            label: '⏱ 60m Power Block',
            click: () => userTimerEngine.startTimer({ name: 'Power Block', durationSeconds: 3600, completionAction: 'notification' })
          },
          { type: 'separator' },
          {
            label: '⏹ Stop Active Timer',
            click: () => userTimerEngine.stopTimer()
          }
        ]
      },
      { type: 'separator' },

      // 8. Auto Day/Night Toggle
      {
        label: 'Auto Day/Night',
        type: 'checkbox',
        checked: this.isDayNightEnabled,
        click: async () => {
          this.isDayNightEnabled = !this.isDayNightEnabled;
          try {
            const current = await db.getDayNightSettings();
            if (current) {
              current.enabled = this.isDayNightEnabled ? 1 : 0;
              await db.saveDayNightSettings(current);
            }
            schedulerEngine.evaluateSchedules();
          } catch (e) {
            logger.error('TRAY', 'Error toggling Auto Day/Night: ' + e.message);
          }
          this.updateContextMenu();
        }
      },
      { type: 'separator' },

      // 9. Focus Submenu
      {
        label: 'Focus',
        submenu: [
          {
            label: '🎯 Toggle Focus Overlay',
            type: 'checkbox',
            checked: focusEngine.enabled,
            click: () => {
              focusEngine.toggleFocus();
              this.updateContextMenu();
            }
          },
          { type: 'separator' },
          {
            label: '📖 Reading Ruler',
            type: 'checkbox',
            checked: focusEngine.mode === 'read',
            click: () => {
              focusEngine.setMode('read');
              focusEngine.enableFocus();
              this.updateContextMenu();
            }
          },
          {
            label: '🔦 Spotlight Focus',
            type: 'checkbox',
            checked: focusEngine.mode === 'spotlight',
            click: () => {
              focusEngine.setMode('spotlight');
              focusEngine.enableFocus();
              this.updateContextMenu();
            }
          },
          {
            label: '🌫️ Focus Blur',
            type: 'checkbox',
            checked: focusEngine.mode === 'blur',
            click: () => {
              focusEngine.setMode('blur');
              focusEngine.enableFocus();
              this.updateContextMenu();
            }
          }
        ]
      },

      // 10. MagicX Submenu
      {
        label: 'MagicX',
        submenu: [
          {
            label: '✨ Toggle Floating Toolbar',
            type: 'checkbox',
            checked: magicXEngine.isToolbarOpen,
            click: () => {
              magicXEngine.toggleToolbar();
              this.updateContextMenu();
            }
          },
          { type: 'separator' },
          {
            label: '🌙 Dark Invert Filter',
            type: 'checkbox',
            checked: magicXEngine.currentFilter === 'dark',
            click: () => {
              magicXEngine.applyFilter('dark');
              this.updateContextMenu();
            }
          },
          {
            label: '🔘 Grayscale Filter',
            type: 'checkbox',
            checked: magicXEngine.currentFilter === 'gray',
            click: () => {
              magicXEngine.applyFilter('gray');
              this.updateContextMenu();
            }
          },
          {
            label: '🕶️ Night Dim Filter',
            type: 'checkbox',
            checked: magicXEngine.currentFilter === 'dim',
            click: () => {
              magicXEngine.applyFilter('dim');
              this.updateContextMenu();
            }
          },
          {
            label: '☀️ Restore / Normal',
            type: 'checkbox',
            checked: magicXEngine.currentFilter === 'none',
            click: () => {
              magicXEngine.applyFilter('none');
              this.updateContextMenu();
            }
          }
        ]
      },
      { type: 'separator' },

      // 11. Backend Terminal
      {
        label: '⚡ Backend Terminal',
        click: () => this.windowManager.createTerminalWindow()
      },
      { type: 'separator' },

      // 12. Open Eyes Care
      {
        label: 'Open Eyes Care',
        click: () => this.windowManager.showMainWindow()
      },

      // 13. Exit
      {
        label: 'Exit',
        click: () => {
          this.windowManager.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;
