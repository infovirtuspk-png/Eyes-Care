// Polyfill node: protocol for Node 14 / Electron compatibility
const Module = require('module');
if (Module && Module._resolveFilename) {
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (typeof request === 'string' && request.startsWith('node:')) {
      request = request.slice(5);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
}

const { app, BrowserWindow, powerMonitor, screen } = require('electron');
const path = require('path');

// Disable hardware acceleration to eliminate EGL entry point and GPU process crash issues across all Windows environments
try {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
} catch (e) {
  // Ignore
}

const windowManager = require('./window-manager');
const TrayManager = require('./tray-manager');
const IPCManager = require('./ipc-manager');
const startupManager = require('./startup-manager');
const backendManager = require('../backend/backend-manager');
const displayEngine = require('../backend/display-engine');
const eventBus = require('../backend/event-bus');
const logger = require('../backend/logger');

// Enforce Single Instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let trayManager = null;
  let ipcManager = null;

  app.on('second-instance', () => {
    // Focus existing window when user attempts to launch second instance
    windowManager.showMainWindow();
  });

  app.whenReady().then(async () => {
    try {
      // 1. Setup Window & Tray Managers
      trayManager = new TrayManager(windowManager);
      ipcManager = new IPCManager(windowManager);
      ipcManager.setupHandlers();

      // 2. Connect Backend to Managers
      backendManager.setManagers(windowManager, trayManager);

      // 3. Initialize Backend Runtime
      await backendManager.initialize();

      // 4. Create System Tray
      trayManager.createTray();

      // 5. Check Startup Settings
      await startupManager.initialize();

      // 6. Create Main Window (730x500)
      const isStartMinimized = process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAsHidden;
      const mainWindow = windowManager.createMainWindow({ show: !isStartMinimized });

      // Forward EventBus events to main window and terminal if open
      eventBus.on('LOG_ENTRY', (logObj) => {
        if (windowManager.terminalWindow && !windowManager.terminalWindow.isDestroyed()) {
          windowManager.terminalWindow.webContents.send('terminal:log', logObj);
        }
      });

      eventBus.on(eventBus.constructor.EVENTS.BREAK_TICK, (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('event:break-tick', data);
        }
        for (const lw of windowManager.lockScreenWindows) {
          if (lw && !lw.isDestroyed()) {
            lw.webContents.send('lock-screen-tick', data);
          }
        }
      });

      eventBus.on(eventBus.constructor.EVENTS.DISPLAY_CHANGED, (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('event:display-changed', data);
        }
        if (trayManager) {
          trayManager.updateContextMenu();
        }
      });

      eventBus.on(eventBus.constructor.EVENTS.USER_TIMER_TICK, (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('event:timer-tick', data);
        }
      });

      // Power Monitor: Sleep / Wake handling
      powerMonitor.on('suspend', () => {
        logger.info('SYSTEM', 'Windows entering sleep/suspend state');
        eventBus.emit(eventBus.constructor.EVENTS.SYSTEM_SLEEP, {});
      });

      powerMonitor.on('resume', async () => {
        logger.info('SYSTEM', 'Windows resumed from sleep');
        await displayEngine.handleSystemResume();
        eventBus.emit(eventBus.constructor.EVENTS.SYSTEM_RESUME, {});
      });

      // Display metrics changed / hotplug
      screen.on('display-added', () => displayEngine.handleHotplug());
      screen.on('display-removed', () => displayEngine.handleHotplug());
      screen.on('display-metrics-changed', () => displayEngine.handleHotplug());

      logger.success('MAIN', 'Eyes Care application fully initialized and ready.');
    } catch (err) {
      console.error('Fatal initialization error:', err);
    }
  });

  // Keep backend running in background when all windows closed
  app.on('window-all-closed', () => {
    // Do not quit - backend continues running in system tray
  });

  app.on('before-quit', () => {
    windowManager.isQuitting = true;
  });
}