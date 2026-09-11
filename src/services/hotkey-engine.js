// Hotkey Engine - Manages global hotkeys
class HotkeyEngine {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.registeredHotkeys = new Map();
    this.globalHotkeys = new Map();
  }

  async initialize() {
    await this.loadHotkeys();
    await this.registerGlobalHotkeys();
  }

  async loadHotkeys() {
    try {
      const hotkeys = await this.databaseManager.getHotkeys();
      this.globalHotkeys = new Map();
      
      hotkeys.forEach(hotkey => {
        if (hotkey.enabled && hotkey.accelerator) {
          this.globalHotkeys.set(hotkey.action, hotkey.accelerator);
        }
      });

      console.log('Hotkeys loaded:', this.globalHotkeys);
    } catch (error) {
      console.error('Error loading hotkeys:', error);
    }
  }

  async registerGlobalHotkeys() {
    // This would register global hotkeys using a library like 'global-hotkey'
    // For now, this is a placeholder for the implementation
    
    console.log('Registering global hotkeys...');
    
    // In production, this would:
    // 1. Use a global hotkey library
    // 2. Register each accelerator
    // 3. Bind to corresponding actions
    // 4. Handle conflicts
    
    // Example implementation with global-hotkey library:
    /*
    const GlobalHotkey = require('global-hotkey');
    
    for (const [action, accelerator] of this.globalHotkeys) {
      try {
        const hotkey = GlobalHotkey.register(accelerator, () => {
          this.executeAction(action);
        });
        this.registeredHotkeys.set(action, hotkey);
      } catch (error) {
        console.error(`Failed to register hotkey ${accelerator} for ${action}:`, error);
      }
    }
    */
  }

  executeAction(action) {
    console.log('Executing hotkey action:', action);
    
    // Emit event or call corresponding function
    switch (action) {
      case 'increase_brightness':
        this.emit('increase-brightness');
        break;
      case 'decrease_brightness':
        this.emit('decrease-brightness');
        break;
      case 'increase_temperature':
        this.emit('increase-temperature');
        break;
      case 'decrease_temperature':
        this.emit('decrease-temperature');
        break;
      case 'pause_protection':
        this.emit('pause-protection');
        break;
      case 'health_mode':
        this.emit('apply-preset', 'health');
        break;
      case 'game_mode':
        this.emit('apply-preset', 'game');
        break;
      case 'reading_mode':
        this.emit('apply-preset', 'reading');
        break;
      case 'start_break':
        this.emit('take-break-now');
        break;
      case 'pause_timer':
        this.emit('pause-timer');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }

  async registerHotkey(action, accelerator) {
    try {
      await this.databaseManager.saveHotkey({ action, accelerator, enabled: 1 });
      await this.loadHotkeys();
      await this.registerGlobalHotkeys();
      return true;
    } catch (error) {
      console.error('Error registering hotkey:', error);
      return false;
    }
  }

  async unregisterHotkey(action) {
    try {
      await this.databaseManager.saveHotkey({ action, accelerator: '', enabled: 0 });
      await this.loadHotkeys();
      await this.unregisterGlobalHotkey(action);
      return true;
    } catch (error) {
      console.error('Error unregistering hotkey:', error);
      return false;
    }
  }

  async unregisterGlobalHotkey(action) {
    const hotkey = this.registeredHotkeys.get(action);
    if (hotkey) {
      try {
        // Unregister the hotkey
        // hotkey.unregister();
        this.registeredHotkeys.delete(action);
      } catch (error) {
        console.error('Error unregistering global hotkey:', error);
      }
    }
  }

  async updateHotkey(action, accelerator) {
    try {
      await this.databaseManager.saveHotkey({ action, accelerator, enabled: 1 });
      await this.loadHotkeys();
      await this.registerGlobalHotkeys();
      return true;
    } catch (error) {
      console.error('Error updating hotkey:', error);
      return false;
    }
  }

  getHotkey(action) {
    return this.globalHotkeys.get(action);
  }

  getAllHotkeys() {
    return Object.fromEntries(this.globalHotkeys);
  }

  isHotkeyRegistered(action) {
    return this.globalHotkeys.has(action);
  }

  // Simple event emitter
  on(event, callback) {
    if (!this.events) this.events = {};
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (!this.events || !this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }

  async destroy() {
    // Unregister all hotkeys
    for (const [action] of this.registeredHotkeys) {
      await this.unregisterGlobalHotkey(action);
    }
  }
}

module.exports = HotkeyEngine;
