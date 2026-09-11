const displayNative = require('../native/windows/display-native');
const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');

class DisplayEngine {
  constructor() {
    this.monitors = [];
    this.currentBrightness = 100;
    this.currentTemperature = 6500;
    this.currentProfile = 'Pause';
    this.autoDayNight = false;
    this.isSmoothTransitioning = false;
    this.saveTimeout = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await displayNative.initialize();
      this.monitors = await displayNative.detectMonitors();

      // Load saved settings from database
      const saved = await db.getDisplaySettings();
      if (saved && saved.length > 0) {
        const primary = saved[0];
        this.currentBrightness = primary.brightness !== undefined ? primary.brightness : 100;
        this.currentTemperature = primary.temperature !== undefined ? primary.temperature : 6500;
        this.autoDayNight = primary.auto_day_night === 1;
      }

      // Apply initial settings to hardware/gamma
      await this.applyDisplay(this.currentTemperature, this.currentBrightness);

      this.isInitialized = true;
      logger.success('DISPLAY', `DisplayEngine initialized with ${this.monitors.length} monitor(s) (Temp: ${this.currentTemperature}K, Brightness: ${this.currentBrightness}%)`);
    } catch (err) {
      logger.error('DISPLAY', 'Failed to initialize DisplayEngine: ' + err.message);
    }
  }

  getMonitors() {
    return this.monitors;
  }

  getMonitorCapabilities() {
    return displayNative.capabilities;
  }

  getBrightness() {
    return this.currentBrightness;
  }

  getTemperature() {
    return this.currentTemperature;
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  async setBrightness(level, skipPersist = false) {
    const val = Math.max(0, Math.min(100, Math.round(level)));
    this.currentBrightness = val;
    await this.applyDisplay(this.currentTemperature, this.currentBrightness);

    eventBus.emit(eventBus.constructor.EVENTS.BRIGHTNESS_CHANGED, { brightness: val });
    eventBus.emit(eventBus.constructor.EVENTS.DISPLAY_CHANGED, {
      brightness: this.currentBrightness,
      temperature: this.currentTemperature,
      profile: this.currentProfile
    });

    if (!skipPersist) {
      this.debouncePersist();
    }
    return val;
  }

  async setTemperature(kelvin, skipPersist = false) {
    const val = Math.max(1000, Math.min(10000, Math.round(kelvin)));
    this.currentTemperature = val;
    await this.applyDisplay(this.currentTemperature, this.currentBrightness);

    eventBus.emit(eventBus.constructor.EVENTS.TEMPERATURE_CHANGED, { temperature: val });
    eventBus.emit(eventBus.constructor.EVENTS.DISPLAY_CHANGED, {
      brightness: this.currentBrightness,
      temperature: this.currentTemperature,
      profile: this.currentProfile
    });

    if (!skipPersist) {
      this.debouncePersist();
    }
    return val;
  }

  async applyDisplay(kelvin, brightness) {
    try {
      // 1. Apply Gamma Ramp (Color Temperature + Gamma Brightness)
      await displayNative.applyGammaRamp(kelvin, brightness);

      // 2. Apply Hardware WMI brightness if monitor supports it
      if (displayNative.capabilities.hardwareBrightness) {
        await displayNative.setHardwareBrightness(brightness);
      }
    } catch (err) {
      logger.error('DISPLAY', 'Failed to apply display adjustments: ' + err.message);
    }
  }

  async applyProfile(profileName, options = { smooth: true, duration: 800 }) {
    const p = await db.getProfileByName(profileName);
    if (!p) {
      logger.warn('DISPLAY', `Profile '${profileName}' not found`);
      return false;
    }

    this.currentProfile = p.name;
    const targetTemp = p.temperature;
    const targetBright = p.brightness;

    logger.info('DISPLAY', `Applying Profile '${p.name}' -> ${targetTemp}K, ${targetBright}%`);

    if (options.smooth) {
      await this.smoothTransition(targetBright, targetTemp, options.duration);
    } else {
      this.currentBrightness = targetBright;
      this.currentTemperature = targetTemp;
      await this.applyDisplay(targetTemp, targetBright);
    }

    this.debouncePersist();
    eventBus.emit(eventBus.constructor.EVENTS.PROFILE_CHANGED, {
      profile: p.name,
      temperature: targetTemp,
      brightness: targetBright
    });

    return true;
  }

  async smoothTransition(targetBrightness, targetTemperature, durationMs = 800) {
    if (this.isSmoothTransitioning) return;
    this.isSmoothTransitioning = true;

    const startB = this.currentBrightness;
    const startT = this.currentTemperature;
    const steps = 12;
    const intervalMs = Math.max(25, Math.floor(durationMs / steps));

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      // Linear ease
      const curB = Math.round(startB + (targetBrightness - startB) * progress);
      const curT = Math.round(startT + (targetTemperature - startT) * progress);

      this.currentBrightness = curB;
      this.currentTemperature = curT;
      await this.applyDisplay(curT, curB);

      eventBus.emit(eventBus.constructor.EVENTS.DISPLAY_CHANGED, {
        brightness: curB,
        temperature: curT,
        profile: this.currentProfile
      });

      await new Promise(r => setTimeout(r, intervalMs));
    }

    this.currentBrightness = targetBrightness;
    this.currentTemperature = targetTemperature;
    this.isSmoothTransitioning = false;
  }

  async resetDisplay() {
    this.currentBrightness = 100;
    this.currentTemperature = 6500;
    this.currentProfile = 'Pause';
    await displayNative.resetDisplay();
    this.debouncePersist();

    eventBus.emit(eventBus.constructor.EVENTS.DISPLAY_CHANGED, {
      brightness: 100,
      temperature: 6500,
      profile: 'Pause'
    });
    logger.info('DISPLAY', 'Display reset to default 6500K / 100%');
    return true;
  }

  async handleHotplug() {
    logger.info('DISPLAY', 'Display hardware configuration changed - re-detecting monitors');
    this.monitors = await displayNative.detectMonitors();
    await this.applyDisplay(this.currentTemperature, this.currentBrightness);
    eventBus.emit(eventBus.constructor.EVENTS.MONITOR_CONNECTED, { monitors: this.monitors });
  }

  async handleSystemResume() {
    logger.info('DISPLAY', 'System resumed from sleep - restoring display calibration');
    await displayNative.detectCapabilities();
    await displayNative.detectMonitors();
    await this.applyDisplay(this.currentTemperature, this.currentBrightness);
  }

  debouncePersist() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        await db.saveDisplaySettings({
          monitor_id: 'MON_1',
          brightness: this.currentBrightness,
          temperature: this.currentTemperature,
          enabled: 1,
          sync_enabled: 1,
          auto_day_night: this.autoDayNight ? 1 : 0
        });
      } catch (err) {
        logger.error('DISPLAY', 'Failed to persist display settings: ' + err.message);
      }
    }, 400);
  }
}

module.exports = new DisplayEngine();
