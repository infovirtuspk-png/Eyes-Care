const logger = require('./logger');

/**
 * Automation Priority Engine
 * Priority hierarchy:
 * 1. Emergency / Manual Override
 * 2. Active Application Rule (e.g. Photoshop.exe -> Editing, Game.exe -> Game)
 * 3. User Schedule (e.g. Office Morning Mon-Fri)
 * 4. Auto Day / Night (Sunrise / Sunset / Time boundary)
 * 5. Default Profile (Health / 6500K)
 */
class AutomationEngine {
  constructor() {
    this.manualOverrideActive = false;
    this.overrideTimeout = null;
    this.currentLevel = 'DEFAULT';
  }

  setManualOverride(durationMinutes = 60) {
    this.manualOverrideActive = true;
    this.currentLevel = 'MANUAL_OVERRIDE';
    logger.info('AUTOMATION', `Manual override enabled for ${durationMinutes} minutes`);

    if (this.overrideTimeout) clearTimeout(this.overrideTimeout);
    this.overrideTimeout = setTimeout(() => {
      this.clearManualOverride();
    }, durationMinutes * 60 * 1000);
  }

  clearManualOverride() {
    this.manualOverrideActive = false;
    this.currentLevel = 'AUTOMATIC';
    logger.info('AUTOMATION', 'Manual override released. Resuming scheduled automation.');
  }

  isManualOverrideActive() {
    return this.manualOverrideActive;
  }
}

module.exports = new AutomationEngine();
