const { Notification } = require('electron');
const path = require('path');
const db = require('../database/database-manager');
const logger = require('./logger');

class NotificationEngine {
  constructor() {
    this.enabled = true;
    this.soundEnabled = true;
    this.quietHoursEnabled = false;
    this.quietHoursStart = '22:00';
    this.quietHoursEnd = '07:00';
    this.iconPath = path.join(__dirname, '../renderer/assets/icons/icon.png');
  }

  async initialize() {
    try {
      const general = await db.getGeneralSettings();
      if (general) {
        this.quietHoursEnabled = general.quiet_hours_enabled === '1';
        this.quietHoursStart = general.quiet_hours_start || '22:00';
        this.quietHoursEnd = general.quiet_hours_end || '07:00';
      }
      logger.success('NOTIFICATION', 'NotificationEngine initialized with Windows Native Toasts');
    } catch (err) {
      logger.error('NOTIFICATION', 'Failed to initialize NotificationEngine: ' + err.message);
    }
  }

  isInQuietHours() {
    if (!this.quietHoursEnabled) return false;
    const now = new Date();
    const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (this.quietHoursStart <= this.quietHoursEnd) {
      return cur >= this.quietHoursStart && cur <= this.quietHoursEnd;
    } else {
      return cur >= this.quietHoursStart || cur <= this.quietHoursEnd;
    }
  }

  show(title, body, options = {}) {
    if (!this.enabled) return;

    if (this.isInQuietHours() && !options.urgent) {
      logger.info('NOTIFICATION', `Suppressed notification during Quiet Hours: ${title}`);
      return;
    }

    try {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title: title || 'Eyes Care',
          body: body || '',
          icon: this.iconPath,
          silent: !this.soundEnabled
        });
        notif.show();
        logger.info('NOTIFICATION', `Notification shown: ${title} - ${body}`);
      }
    } catch (err) {
      logger.error('NOTIFICATION', 'Error showing notification: ' + err.message);
    }
  }
}

module.exports = new NotificationEngine();
