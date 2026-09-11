const { screen } = require('electron');

class MonitorManager {
  constructor() {
    this.monitors = [];
    this.primaryMonitor = null;
  }

  async initialize() {
    await this.detectMonitors();
    this.setupMonitorListeners();
  }

  async detectMonitors() {
    try {
      const displays = screen.getAllDisplays();
      this.monitors = displays.map((display, index) => ({
        id: `monitor-${index}`,
        name: display.label || `Monitor ${index + 1}`,
        bounds: display.bounds,
        workArea: display.workArea,
        primary: display.primary,
        scaleFactor: display.scaleFactor,
        rotation: display.rotation
      }));

      this.primaryMonitor = this.monitors.find(m => m.primary) || this.monitors[0];

      console.log('Detected monitors:', this.monitors);
      return this.monitors;
    } catch (error) {
      console.error('Error detecting monitors:', error);
      return [];
    }
  }

  getMonitors() {
    return this.monitors;
  }

  getPrimaryMonitor() {
    return this.primaryMonitor;
  }

  getMonitorById(id) {
    return this.monitors.find(m => m.id === id);
  }

  setupMonitorListeners() {
    // Listen for display changes
    screen.on('display-added', async () => {
      console.log('Display added');
      await this.detectMonitors();
    });

    screen.on('display-removed', async () => {
      console.log('Display removed');
      await this.detectMonitors();
    });

    screen.on('display-metrics-changed', async () => {
      console.log('Display metrics changed');
      await this.detectMonitors();
    });
  }

  async applySettingsToMonitor(monitorId, settings) {
    const monitor = this.getMonitorById(monitorId);
    if (!monitor) {
      console.error('Monitor not found:', monitorId);
      return false;
    }

    // Apply settings through DisplayManager
    // This would be integrated with the DisplayManager
    console.log('Applying settings to monitor:', monitorId, settings);
    return true;
  }

  async applySettingsToAllMonitors(settings) {
    const results = [];
    for (const monitor of this.monitors) {
      const result = await this.applySettingsToMonitor(monitor.id, settings);
      results.push({ monitorId: monitor.id, success: result });
    }
    return results;
  }

  async syncMonitors(settings) {
    // Apply same settings to all monitors
    return await this.applySettingsToAllMonitors(settings);
  }

  getMonitorCount() {
    return this.monitors.length;
  }

  hasMultipleMonitors() {
    return this.monitors.length > 1;
  }
}

module.exports = MonitorManager;
