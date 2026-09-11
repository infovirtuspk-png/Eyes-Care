const { globalShortcut } = require('electron');
const db = require('../database/database-manager');
const logger = require('./logger');

class HotkeyEngine {
  constructor() {
    this.displayEngineRef = null;
    this.breakEngineRef = null;
    this.focusEngineRef = null;
    this.magicXEngineRef = null;
  }

  setReferences(displayEng, breakEng, focusEng, magicXEng) {
    this.displayEngineRef = displayEng;
    this.breakEngineRef = breakEng;
    this.focusEngineRef = focusEng;
    this.magicXEngineRef = magicXEng;
  }

  async initialize() {
    this.registerAllShortcuts();
    logger.success('HOTKEY', 'HotkeyEngine initialized (Global Windows keyboard shortcuts)');
  }

  async registerAllShortcuts() {
    globalShortcut.unregisterAll();
    try {
      const hotkeys = await db.getHotkeys();
      for (const h of hotkeys) {
        if (!h.enabled || !h.accelerator) continue;
        try {
          const ret = globalShortcut.register(h.accelerator, () => {
            this.handleAction(h.action);
          });
          if (ret) {
            logger.debug('HOTKEY', `Registered shortcut: ${h.accelerator} -> ${h.action}`);
          }
        } catch (e) {
          logger.warn('HOTKEY', `Failed to register shortcut ${h.accelerator}: ${e.message}`);
        }
      }
    } catch (err) {
      logger.error('HOTKEY', 'Error registering hotkeys: ' + err.message);
    }
  }

  async handleAction(action) {
    logger.info('HOTKEY', `Global hotkey triggered: ${action}`);
    switch (action) {
      case 'increase_brightness':
        if (this.displayEngineRef) {
          const cur = this.displayEngineRef.getBrightness();
          await this.displayEngineRef.setBrightness(cur + 5);
        }
        break;
      case 'decrease_brightness':
        if (this.displayEngineRef) {
          const cur = this.displayEngineRef.getBrightness();
          await this.displayEngineRef.setBrightness(cur - 5);
        }
        break;
      case 'increase_temperature':
        if (this.displayEngineRef) {
          const cur = this.displayEngineRef.getTemperature();
          await this.displayEngineRef.setTemperature(cur + 500);
        }
        break;
      case 'decrease_temperature':
        if (this.displayEngineRef) {
          const cur = this.displayEngineRef.getTemperature();
          await this.displayEngineRef.setTemperature(cur - 500);
        }
        break;
      case 'pause_protection':
        if (this.displayEngineRef) {
          await this.displayEngineRef.applyProfile('Pause');
        }
        break;
      case 'mode_health':
        if (this.displayEngineRef) await this.displayEngineRef.applyProfile('Health');
        break;
      case 'mode_office':
        if (this.displayEngineRef) await this.displayEngineRef.applyProfile('Office');
        break;
      case 'mode_reading':
        if (this.displayEngineRef) await this.displayEngineRef.applyProfile('Reading');
        break;
      case 'mode_game':
        if (this.displayEngineRef) await this.displayEngineRef.applyProfile('Game');
        break;
      case 'take_break_now':
        if (this.breakEngineRef) this.breakEngineRef.takeBreakNow();
        break;
      case 'toggle_focus':
        if (this.focusEngineRef) this.focusEngineRef.toggleFocus();
        break;
      case 'toggle_magicx':
        if (this.magicXEngineRef) this.magicXEngineRef.toggleToolbar();
        break;
      default:
        break;
    }
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }
}

module.exports = new HotkeyEngine();
