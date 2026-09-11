const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');

class FocusEngine {
  constructor() {
    this.enabled = false;
    this.mode = 'read'; // 'read', 'blur', 'spotlight'
    this.focusSize = 140; // px
    this.opacity = 0.65;
    this.blurStrength = 6;
    this.dimStrength = 40;
    this.windowManagerRef = null;
  }

  setWindowManager(wm) {
    this.windowManagerRef = wm;
  }

  async initialize() {
    try {
      const s = await db.getFocusSettings();
      if (s) {
        this.enabled = s.enabled === 1;
        this.mode = s.mode || 'read';
        this.focusSize = s.focus_size || 140;
        this.opacity = s.opacity !== undefined ? s.opacity : 0.65;
        this.blurStrength = s.blur_strength || 6;
        this.dimStrength = s.dim_strength || 40;
      }
      logger.success('FOCUS', `FocusEngine initialized (Mode: ${this.mode}, Size: ${this.focusSize}px)`);
    } catch (err) {
      logger.error('FOCUS', 'Failed to initialize FocusEngine: ' + err.message);
    }
  }

  enableFocus() {
    this.enabled = true;
    if (this.windowManagerRef) {
      this.windowManagerRef.showFocusOverlay({
        mode: this.mode,
        size: this.focusSize,
        opacity: this.opacity,
        blur: this.blurStrength,
        dim: this.dimStrength
      });
    }
    logger.info('FOCUS', `Focus overlay enabled (Mode: ${this.mode})`);
    eventBus.emit(eventBus.constructor.EVENTS.FOCUS_CHANGED, { enabled: true, mode: this.mode });
    this.saveSettings();
  }

  disableFocus() {
    this.enabled = false;
    if (this.windowManagerRef) {
      this.windowManagerRef.hideFocusOverlay();
    }
    logger.info('FOCUS', 'Focus overlay disabled');
    eventBus.emit(eventBus.constructor.EVENTS.FOCUS_CHANGED, { enabled: false, mode: this.mode });
    this.saveSettings();
  }

  toggleFocus() {
    if (this.enabled) {
      this.disableFocus();
    } else {
      this.enableFocus();
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (this.enabled) {
      this.enableFocus(); // Refresh overlay with new mode
    }
    this.saveSettings();
  }

  updateParameters(params) {
    if (params.focusSize !== undefined) this.focusSize = params.focusSize;
    if (params.opacity !== undefined) this.opacity = params.opacity;
    if (params.blurStrength !== undefined) this.blurStrength = params.blurStrength;
    if (params.dimStrength !== undefined) this.dimStrength = params.dimStrength;

    if (this.enabled && this.windowManagerRef) {
      this.windowManagerRef.updateFocusOverlay({
        mode: this.mode,
        size: this.focusSize,
        opacity: this.opacity,
        blur: this.blurStrength,
        dim: this.dimStrength
      });
    }
    this.saveSettings();
  }

  async saveSettings() {
    try {
      await db.saveFocusSettings({
        enabled: this.enabled ? 1 : 0,
        mode: this.mode,
        focus_size: this.focusSize,
        opacity: this.opacity,
        blur_strength: this.blurStrength,
        dim_strength: this.dimStrength
      });
    } catch (err) {
      logger.error('FOCUS', 'Failed to save focus settings: ' + err.message);
    }
  }
}

module.exports = new FocusEngine();
