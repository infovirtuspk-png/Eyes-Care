const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');

class MagicXEngine {
  constructor() {
    this.enabled = false;
    this.showToolbar = true;
    this.toolbarPosition = 'top-right';
    this.toolbarOpacity = 0.95;
    this.activeFilter = 'none'; // 'none', 'dark', 'gray', 'dim'
    this.windowManagerRef = null;
  }

  setWindowManager(wm) {
    this.windowManagerRef = wm;
  }

  async initialize() {
    try {
      const s = await db.getMagicXSettings();
      if (s) {
        this.enabled = s.enabled === 1;
        this.showToolbar = s.show_toolbar === 1;
        this.toolbarPosition = s.toolbar_position || 'top-right';
        this.toolbarOpacity = s.toolbar_opacity !== undefined ? s.toolbar_opacity : 0.95;
        this.activeFilter = s.active_filter || 'none';
      }
      logger.success('MAGICX', `MagicXEngine initialized (Active Filter: ${this.activeFilter})`);
    } catch (err) {
      logger.error('MAGICX', 'Failed to initialize MagicXEngine: ' + err.message);
    }
  }

  toggleToolbar() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.showMagicXToolbar();
    } else {
      this.hideMagicXToolbar();
    }
    this.saveSettings();
  }

  showMagicXToolbar() {
    this.enabled = true;
    if (this.windowManagerRef) {
      this.windowManagerRef.showMagicXToolbar({
        position: this.toolbarPosition,
        opacity: this.toolbarOpacity,
        activeFilter: this.activeFilter
      });
    }
    logger.info('MAGICX', 'MagicX floating toolbar displayed');
    eventBus.emit(eventBus.constructor.EVENTS.MAGICX_CHANGED, { enabled: true, filter: this.activeFilter });
  }

  hideMagicXToolbar() {
    this.enabled = false;
    if (this.windowManagerRef) {
      this.windowManagerRef.hideMagicXToolbar();
    }
    logger.info('MAGICX', 'MagicX floating toolbar hidden');
    eventBus.emit(eventBus.constructor.EVENTS.MAGICX_CHANGED, { enabled: false, filter: this.activeFilter });
  }

  setFilter(filterName) {
    this.activeFilter = filterName;
    logger.info('MAGICX', `Applied MagicX filter: '${filterName}'`);
    if (this.windowManagerRef) {
      this.windowManagerRef.applyMagicXFilter(filterName);
    }
    eventBus.emit(eventBus.constructor.EVENTS.MAGICX_CHANGED, { enabled: this.enabled, filter: filterName });
    this.saveSettings();
  }

  async saveSettings() {
    try {
      await db.saveMagicXSettings({
        enabled: this.enabled ? 1 : 0,
        show_toolbar: this.showToolbar ? 1 : 0,
        toolbar_position: this.toolbarPosition,
        toolbar_opacity: this.toolbarOpacity,
        active_filter: this.activeFilter
      });
    } catch (err) {
      logger.error('MAGICX', 'Failed to save MagicX settings: ' + err.message);
    }
  }
}

module.exports = new MagicXEngine();
