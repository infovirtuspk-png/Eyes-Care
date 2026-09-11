const { app } = require('electron');
const logger = require('../backend/logger');
const db = require('../database/database-manager');

class StartupManager {
  async initialize() {
    try {
      const general = await db.getGeneralSettings();
      const shouldStart = general.start_with_windows !== '0';
      this.setStartup(shouldStart);
    } catch (err) {
      logger.error('STARTUP', 'Failed to initialize startup settings: ' + err.message);
    }
  }

  setStartup(enable) {
    try {
      app.setLoginItemSettings({
        openAtLogin: !!enable,
        openAsHidden: true,
        name: 'Eyes Care'
      });
      logger.info('STARTUP', `Windows startup on login set to: ${enable ? 'ON' : 'OFF'}`);
    } catch (err) {
      logger.error('STARTUP', 'Error updating Windows startup: ' + err.message);
    }
  }

  isStartupEnabled() {
    try {
      const s = app.getLoginItemSettings();
      return s.openAtLogin;
    } catch {
      return false;
    }
  }
}

module.exports = new StartupManager();
