const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BrightnessController {
  constructor() {
    this.currentBrightness = 100;
    this.monitorId = 'default';
  }

  async initialize() {
    await this.getCurrentBrightness();
  }

  async getCurrentBrightness() {
    try {
      const result = await execAsync(
        'powershell "(Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightness).Brightness"'
      );
      this.currentBrightness = parseInt(result.stdout.trim());
      return this.currentBrightness;
    } catch (error) {
      console.error('Error getting brightness:', error);
      return 100;
    }
  }

  async setBrightness(brightness) {
    try {
      brightness = Math.max(0, Math.min(100, brightness));

      const command = `powershell "(Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${brightness})"`;
      await execAsync(command);

      this.currentBrightness = brightness;
      return true;
    } catch (error) {
      console.error('Error setting brightness:', error);
      return false;
    }
  }

  async increaseBrightness(step = 5) {
    const newBrightness = Math.min(100, this.currentBrightness + step);
    return await this.setBrightness(newBrightness);
  }

  async decreaseBrightness(step = 5) {
    const newBrightness = Math.max(0, this.currentBrightness - step);
    return await this.setBrightness(newBrightness);
  }

  async resetBrightness() {
    return await this.setBrightness(100);
  }

  getCurrent() {
    return this.currentBrightness;
  }
}

module.exports = BrightnessController;
