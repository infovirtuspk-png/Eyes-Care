const logger = require('./logger');
const eventBus = require('./event-bus');
const db = require('../database/database-manager');
const displayEngine = require('./display-engine');
const breakEngine = require('./break-engine');
const userTimerEngine = require('./timer-engine');
const schedulerEngine = require('./scheduler-engine');
const ruleEngine = require('./rule-engine');
const automationEngine = require('./automation-engine');
const focusEngine = require('./focus-engine');
const magicXEngine = require('./magicx-engine');
const notificationEngine = require('./notification-engine');
const hotkeyEngine = require('./hotkey-engine');
const watchdog = require('./watchdog');

class BackendManager {
  constructor() {
    this.startTime = Date.now();
    this.isOnline = false;
    this.windowManagerRef = null;
    this.trayManagerRef = null;
  }

  setManagers(windowManager, trayManager) {
    this.windowManagerRef = windowManager;
    this.trayManagerRef = trayManager;

    breakEngine.setWindowManager(windowManager);
    focusEngine.setWindowManager(windowManager);
    magicXEngine.setWindowManager(windowManager);
    watchdog.setBackendManager(this);
  }

  async initialize() {
    logger.initialize();
    logger.info('BACKEND', 'Starting Eyes Care Unified Backend Runtime...');

    try {
      // 1. Initialize SQLite
      await db.initialize();

      // 2. Initialize Display Engine
      await displayEngine.initialize();

      // 3. Initialize Notifications
      await notificationEngine.initialize();

      // 4. Initialize Break Engine
      await breakEngine.initialize();

      // 5. Initialize User Timer Engine
      userTimerEngine.setReferences(displayEngine, breakEngine, notificationEngine);
      await userTimerEngine.initialize();

      // 6. Initialize Scheduler
      schedulerEngine.setReferences(displayEngine);
      await schedulerEngine.initialize();

      // 7. Initialize Rule Engine
      ruleEngine.setReferences(displayEngine);
      await ruleEngine.initialize();

      // 8. Initialize Focus & MagicX
      await focusEngine.initialize();
      await magicXEngine.initialize();

      // 9. Initialize Hotkeys
      hotkeyEngine.setReferences(displayEngine, breakEngine, focusEngine, magicXEngine);
      await hotkeyEngine.initialize();

      // 10. Start Watchdog
      watchdog.initialize();

      this.isOnline = true;
      logger.success('BACKEND', 'Eyes Care Backend is ONLINE and all engines are running.');
      eventBus.emit(eventBus.constructor.EVENTS.BACKEND_STARTED, { status: 'ONLINE' });
    } catch (err) {
      logger.error('BACKEND', 'Fatal error during backend startup: ' + err.message);
      throw err;
    }
  }

  getSystemStatus() {
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;
    const uptimeFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    return {
      backend: this.isOnline ? 'ONLINE' : 'OFFLINE',
      uptime: uptimeFormatted,
      uptimeSeconds: uptimeSec,
      sqlite: db.isInitialized ? 'CONNECTED' : 'DISCONNECTED',
      displayEngine: displayEngine.isInitialized ? 'RUNNING' : 'STOPPED',
      timerEngine: userTimerEngine.state !== 'IDLE' ? 'RUNNING' : 'IDLE',
      breakEngine: breakEngine.enabled ? 'RUNNING' : 'STOPPED',
      automationEngine: 'RUNNING',
      ruleEngine: 'RUNNING',
      tray: this.trayManagerRef ? 'RUNNING' : 'STOPPED',
      safeMode: watchdog.isSafeMode,
      currentTemperature: displayEngine.getTemperature(),
      currentBrightness: displayEngine.getBrightness(),
      currentProfile: displayEngine.getCurrentProfile(),
      monitorsCount: displayEngine.getMonitors().length
    };
  }

  async restartServices() {
    logger.warn('BACKEND', 'Restarting backend services...');
    await displayEngine.initialize();
    await breakEngine.initialize();
    await schedulerEngine.initialize();
    await ruleEngine.initialize();
    await hotkeyEngine.registerAllShortcuts();
    eventBus.emit(eventBus.constructor.EVENTS.BACKEND_RESTARTED, {});
  }
}

module.exports = new BackendManager();
