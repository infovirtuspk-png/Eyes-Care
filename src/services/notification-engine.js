// Notification Engine - Handles break notifications and alerts
class NotificationEngine {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.notificationsEnabled = true;
    this.soundEnabled = true;
    this.volume = 50;
  }

  async initialize() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      // Load notification settings from database
      const settings = await this.databaseManager.getAppSetting('notifications');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.notificationsEnabled = parsed.enabled !== false;
        this.soundEnabled = parsed.sound !== false;
        this.volume = parsed.volume || 50;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async showBreakNotification(message, duration) {
    if (!this.notificationsEnabled) return;

    try {
      // Use Electron's Notification API
      if (typeof Notification !== 'undefined') {
        const notification = new Notification('Eyes Care - Break Time', {
          body: message,
          icon: 'src/renderer/assets/icons/icon.png',
          silent: !this.soundEnabled
        });

        notification.onclick = () => {
          console.log('Notification clicked');
        };

        // Auto-close after duration
        setTimeout(() => {
          notification.close();
        }, duration * 1000);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async showFocusNotification(message) {
    if (!this.notificationsEnabled) return;

    try {
      if (typeof Notification !== 'undefined') {
        const notification = new Notification('Eyes Care - Focus Mode', {
          body: message,
          icon: 'src/renderer/assets/icons/icon.png',
          silent: true
        });

        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Error showing focus notification:', error);
    }
  }

  async showMagicXNotification(message) {
    if (!this.notificationsEnabled) return;

    try {
      if (typeof Notification !== 'undefined') {
        const notification = new Notification('Eyes Care - MagicX', {
          body: message,
          icon: 'src/renderer/assets/icons/icon.png',
          silent: true
        });

        setTimeout(() => notification.close(), 3000);
      }
    } catch (error) {
      console.error('Error showing MagicX notification:', error);
    }
  }

  playSound(soundType) {
    if (!this.soundEnabled) return;

    try {
      // In production, this would play actual sound files
      console.log(`Playing sound: ${soundType} at volume ${this.volume}%`);
      // Placeholder for sound playback
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  async enableNotifications(enabled) {
    this.notificationsEnabled = enabled;
    await this.saveSettings();
  }

  async enableSound(enabled) {
    this.soundEnabled = enabled;
    await this.saveSettings();
  }

  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(100, volume));
    await this.saveSettings();
  }

  async saveSettings() {
    try {
      const settings = {
        enabled: this.notificationsEnabled,
        sound: this.soundEnabled,
        volume: this.volume
      };
      await this.databaseManager.saveAppSetting('notifications', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  isEnabled() {
    return this.notificationsEnabled;
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  getVolume() {
    return this.volume;
  }
}

module.exports = NotificationEngine;
