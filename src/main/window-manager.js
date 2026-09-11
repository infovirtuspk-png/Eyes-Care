const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const logger = require('../backend/logger');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.terminalWindow = null;
    this.lockScreenWindows = [];
    this.focusOverlayWindow = null;
    this.magicXToolbarWindow = null;
  }

  createMainWindow(options = { show: true }) {
    if (this.mainWindow) {
      if (options.show !== false) {
        this.showMainWindow();
      }
      return this.mainWindow;
    }

    this.mainWindow = new BrowserWindow({
      width: 730,
      height: 500,
      minWidth: 730,
      minHeight: 500,
      maxWidth: 730,
      maxHeight: 500,
      resizable: false,
      frame: false,
      backgroundColor: '#0D1117',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        nativeWindowOpen: true,
        preload: path.join(__dirname, '../preload/preload.js')
      },
      icon: path.join(__dirname, '../renderer/assets/icons/icon.png'),
      show: false,
      skipTaskbar: false
    });

    this.mainWindow.center();
    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.mainWindow.once('ready-to-show', () => {
      if (options.show !== false) {
        this.mainWindow.show();
      }
    });

    // Close to tray behavior
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    return this.mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  showMainWindow() {
    if (!this.mainWindow) {
      this.createMainWindow();
    } else {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  hideMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  toggleMainWindow() {
    if (this.mainWindow && this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showMainWindow();
    }
  }

  // Backend Terminal Window (900x550)
  createTerminalWindow() {
    if (this.terminalWindow && !this.terminalWindow.isDestroyed()) {
      this.terminalWindow.show();
      this.terminalWindow.focus();
      return this.terminalWindow;
    }

    this.terminalWindow = new BrowserWindow({
      width: 900,
      height: 550,
      minWidth: 750,
      minHeight: 450,
      frame: true,
      title: 'Eyes Care - Backend Terminal',
      backgroundColor: '#121416',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        nativeWindowOpen: true,
        preload: path.join(__dirname, '../preload/preload.js')
      },
      icon: path.join(__dirname, '../renderer/assets/icons/icon.png'),
      show: false
    });

    this.terminalWindow.loadFile(path.join(__dirname, '../renderer/terminal.html'));

    this.terminalWindow.once('ready-to-show', () => {
      this.terminalWindow.show();
    });

    this.terminalWindow.on('closed', () => {
      this.terminalWindow = null;
    });

    return this.terminalWindow;
  }

  // Break Lock Screen Full-Screen Window
  showLockScreen(breakData) {
    this.closeLockScreen();

    const displays = screen.getAllDisplays();
    this.lockScreenWindows = displays.map((disp) => {
      const win = new BrowserWindow({
        x: disp.bounds.x,
        y: disp.bounds.y,
        width: disp.bounds.width,
        height: disp.bounds.height,
        frame: false,
        transparent: false,
        backgroundColor: '#0F1113',
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          nativeWindowOpen: true,
          preload: path.join(__dirname, '../preload/preload.js')
        }
      });

      win.loadFile(path.join(__dirname, '../renderer/lock-screen.html'));
      win.webContents.once('did-finish-load', () => {
        win.webContents.send('lock-screen-init', breakData);
      });

      return win;
    });
  }

  closeLockScreen() {
    for (const win of this.lockScreenWindows) {
      if (win && !win.isDestroyed()) {
        win.close();
      }
    }
    this.lockScreenWindows = [];
  }

  // Focus Overlay Window (Transparent Full Screen)
  showFocusOverlay(params) {
    if (!this.focusOverlayWindow || this.focusOverlayWindow.isDestroyed()) {
      const primary = screen.getPrimaryDisplay();
      this.focusOverlayWindow = new BrowserWindow({
        x: primary.bounds.x,
        y: primary.bounds.y,
        width: primary.bounds.width,
        height: primary.bounds.height,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          nativeWindowOpen: true,
          preload: path.join(__dirname, '../preload/preload.js')
        }
      });

      // Ignore mouse events on overlay so user can still click through to underlying apps
      this.focusOverlayWindow.setIgnoreMouseEvents(true, { forward: true });

      this.focusOverlayWindow.loadFile(path.join(__dirname, '../renderer/focus-overlay.html'));
      this.focusOverlayWindow.webContents.once('did-finish-load', () => {
        this.focusOverlayWindow.webContents.send('focus-update', params);
      });
    } else {
      this.focusOverlayWindow.webContents.send('focus-update', params);
      this.focusOverlayWindow.show();
    }
  }

  updateFocusOverlay(params) {
    if (this.focusOverlayWindow && !this.focusOverlayWindow.isDestroyed()) {
      this.focusOverlayWindow.webContents.send('focus-update', params);
    }
  }

  hideFocusOverlay() {
    if (this.focusOverlayWindow && !this.focusOverlayWindow.isDestroyed()) {
      this.focusOverlayWindow.hide();
    }
  }

  // MagicX Floating Toolbar Window
  showMagicXToolbar(params) {
    if (!this.magicXToolbarWindow || this.magicXToolbarWindow.isDestroyed()) {
      const primary = screen.getPrimaryDisplay();
      this.magicXToolbarWindow = new BrowserWindow({
        width: 320,
        height: 60,
        x: primary.bounds.width - 340,
        y: 40,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          nativeWindowOpen: true,
          preload: path.join(__dirname, '../preload/preload.js')
        }
      });

      this.magicXToolbarWindow.loadFile(path.join(__dirname, '../renderer/magicx-toolbar.html'));
      this.magicXToolbarWindow.webContents.once('did-finish-load', () => {
        this.magicXToolbarWindow.webContents.send('magicx-init', params);
      });
    } else {
      this.magicXToolbarWindow.show();
    }
  }

  hideMagicXToolbar() {
    if (this.magicXToolbarWindow && !this.magicXToolbarWindow.isDestroyed()) {
      this.magicXToolbarWindow.hide();
    }
  }

  applyMagicXFilter(filterName) {
    if (this.magicXToolbarWindow && !this.magicXToolbarWindow.isDestroyed()) {
      this.magicXToolbarWindow.webContents.send('magicx-filter', filterName);
    }
  }
}

module.exports = new WindowManager();
