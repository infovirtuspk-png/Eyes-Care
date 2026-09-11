const logger = require('./logger');
const eventBus = require('./event-bus');

class BackendWatchdog {
  constructor() {
    this.crashCount = 0;
    this.maxCrashesBeforeSafeMode = 4;
    this.checkInterval = null;
    this.isSafeMode = false;
    this.backendManagerRef = null;
    this.lastHeartbeat = Date.now();
  }

  setBackendManager(bm) {
    this.backendManagerRef = bm;
  }

  initialize() {
    this.startHealthCheck();
    logger.success('WATCHDOG', 'Backend Watchdog active (Self-healing & fault recovery)');
  }

  startHealthCheck() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.verifyHealth();
    }, 15000);
  }

  recordHeartbeat() {
    this.lastHeartbeat = Date.now();
  }

  async verifyHealth() {
    if (!this.backendManagerRef) return;
    try {
      const status = this.backendManagerRef.getSystemStatus();
      if (!status.sqlite || !status.displayEngine || !status.breakEngine) {
        this.handleFailure('Subsystem check failed');
      }
    } catch (err) {
      this.handleFailure(err.message);
    }
  }

  async handleFailure(reason) {
    this.crashCount++;
    logger.error('WATCHDOG', `Subsystem anomaly detected: ${reason}. Crash count: ${this.crashCount}/${this.maxCrashesBeforeSafeMode}`);

    if (this.crashCount >= this.maxCrashesBeforeSafeMode) {
      this.enterSafeMode();
    } else {
      logger.info('WATCHDOG', 'Attempting automatic backend service recovery...');
      try {
        await this.backendManagerRef.restartServices();
        logger.success('WATCHDOG', 'Backend services successfully recovered.');
      } catch (e) {
        logger.error('WATCHDOG', 'Recovery attempt failed: ' + e.message);
      }
    }
  }

  enterSafeMode() {
    this.isSafeMode = true;
    logger.warn('WATCHDOG', 'Entering SAFE MODE: Native display modifications disabled. UI and SQLite remain active for diagnosis.');
    eventBus.emit(eventBus.constructor.EVENTS.STATUS_UPDATE, { safeMode: true });
  }
}

module.exports = new BackendWatchdog();
