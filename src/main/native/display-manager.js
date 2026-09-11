const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DisplayManager {
  constructor() {
    this.monitors = [];
    this.currentSettings = new Map();
  }

  async initialize() {
    await this.detectMonitors();
    this.setupDisplayChangeListeners();
  }

  async detectMonitors() {
    try {
      // Use PowerShell to get monitor information
      const result = await execAsync(
        'powershell "Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightness | Select-Object -Property InstanceName, Brightness"'
      );

      const lines = result.stdout.trim().split('\n');
      this.monitors = [];

      for (const line of lines) {
        if (line.includes('InstanceName')) {
          const instanceName = line.split(':')[1]?.trim();
          const brightnessLine = lines[lines.indexOf(line) + 1];
          const brightness = brightnessLine?.split(':')[1]?.trim();

          if (instanceName && brightness) {
            this.monitors.push({
              id: instanceName,
              name: `Monitor ${this.monitors.length + 1}`,
              brightness: parseInt(brightness),
              maxBrightness: 100
            });
          }
        }
      }

      // If no monitors detected via WMI, try alternative method
      if (this.monitors.length === 0) {
        await this.detectMonitorsAlternative();
      }

      console.log('Detected monitors:', this.monitors);
      return this.monitors;
    } catch (error) {
      console.error('Error detecting monitors:', error);
      // Fallback to single monitor
      this.monitors = [{
        id: 'default',
        name: 'Primary Monitor',
        brightness: 100,
        maxBrightness: 100
      }];
      return this.monitors;
    }
  }

  async detectMonitorsAlternative() {
    try {
      // Alternative method using PowerShell
      const result = await execAsync(
        'powershell "Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorBrightnessMethods"'
      );

      // Parse the result to get monitor info
      const lines = result.stdout.trim().split('\n');
      this.monitors = [];

      for (const line of lines) {
        if (line.includes('InstanceName')) {
          const instanceName = line.split(':')[1]?.trim();
          if (instanceName) {
            this.monitors.push({
              id: instanceName,
              name: `Monitor ${this.monitors.length + 1}`,
              brightness: 100,
              maxBrightness: 100
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in alternative monitor detection:', error);
    }
  }

  async setBrightness(monitorId, brightness) {
    try {
      brightness = Math.max(0, Math.min(100, brightness));

      // Use PowerShell to set brightness
      const command = `powershell "(Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${brightness})"`;
      await execAsync(command);

      // Update local state
      const monitor = this.monitors.find(m => m.id === monitorId);
      if (monitor) {
        monitor.brightness = brightness;
      }

      this.currentSettings.set(monitorId, {
        ...this.currentSettings.get(monitorId),
        brightness
      });

      return true;
    } catch (error) {
      console.error('Error setting brightness:', error);
      return false;
    }
  }

  async getBrightness(monitorId) {
    try {
      const monitor = this.monitors.find(m => m.id === monitorId);
      if (monitor) {
        return monitor.brightness;
      }

      // Try to get current brightness
      const result = await execAsync(
        'powershell "(Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBrightness).Brightness"'
      );
      return parseInt(result.stdout.trim());
    } catch (error) {
      console.error('Error getting brightness:', error);
      return 100;
    }
  }

  async setColorTemperature(monitorId, kelvin) {
    try {
      // Color temperature adjustment is more complex and requires
      // either ICC profile manipulation or GPU driver API access
      // For now, we'll use a combination of gamma ramp adjustment

      // This is a simplified implementation
      // In production, you would use native Node addon or Windows API

      kelvin = Math.max(1000, Math.min(10000, kelvin));

      // Convert kelvin to RGB adjustment
      const rgbAdjustment = this.kelvinToRGB(kelvin);

      // Apply gamma ramp adjustment via PowerShell
      // Note: This requires additional native implementation
      const command = `powershell "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Gamma { [DllImport(\"gdi32.dll\")] public static extern bool SetDeviceGammaRamp(IntPtr hDC, ref RAMP lpRamp); [StructLayout(LayoutKind.Sequential)] public struct RAMP { [MarshalAs(UnmanagedType.ByValArray, SizeConst=256)] public ushort[] Red; [MarshalAs(UnmanagedType.ByValArray, SizeConst=256)] public ushort[] Green; [MarshalAs(UnmanagedType.ByValArray, SizeConst=256)] public ushort[] Blue; }'; $ramp = New-Object Gamma+RAMP; $ramp.Red = New-Object ushort[] 256; $ramp.Green = New-Object ushort[] 256; $ramp.Blue = New-Object ushort[] 256; for($i=0;$i-lt256;$i++) { $ramp.Red[$i] = [ushort]($i * ${rgbAdjustment.r}); $ramp.Green[$i] = [ushort]($i * ${rgbAdjustment.g}); $ramp.Blue[$i] = [ushort]($i * ${rgbAdjustment.b}); } [Gamma]::SetDeviceGammaRamp([System.IntPtr]::Zero, [ref]$ramp)"`;

      await execAsync(command);

      this.currentSettings.set(monitorId, {
        ...this.currentSettings.get(monitorId),
        temperature: kelvin
      });

      return true;
    } catch (error) {
      console.error('Error setting color temperature:', error);
      return false;
    }
  }

  kelvinToRGB(kelvin) {
    // Convert color temperature to RGB adjustment factors
    // This is a simplified conversion
    let r, g, b;

    if (kelvin <= 1000) {
      r = 1.0; g = 0.3; b = 0.1;
    } else if (kelvin <= 4000) {
      r = 1.0; g = 0.6 + (kelvin - 1000) / 3000 * 0.3; b = 0.2 + (kelvin - 1000) / 3000 * 0.3;
    } else if (kelvin <= 6500) {
      r = 1.0; g = 0.9 + (kelvin - 4000) / 2500 * 0.1; b = 0.5 + (kelvin - 4000) / 2500 * 0.5;
    } else {
      r = 1.0 - (kelvin - 6500) / 3500 * 0.1; g = 1.0; b = 1.0;
    }

    return { r, g, b };
  }

  async resetDisplay(monitorId) {
    try {
      await this.setBrightness(monitorId, 100);
      await this.setColorTemperature(monitorId, 6500);
      return true;
    } catch (error) {
      console.error('Error resetting display:', error);
      return false;
    }
  }

  async applyProfile(monitorId, profile) {
    try {
      if (profile.brightness !== undefined) {
        await this.setBrightness(monitorId, profile.brightness);
      }
      if (profile.temperature !== undefined) {
        await this.setColorTemperature(monitorId, profile.temperature);
      }
      return true;
    } catch (error) {
      console.error('Error applying profile:', error);
      return false;
    }
  }

  async getMonitorInfo(monitorId) {
    const monitor = this.monitors.find(m => m.id === monitorId);
    if (monitor) {
      return {
        ...monitor,
        currentBrightness: await this.getBrightness(monitorId),
        currentSettings: this.currentSettings.get(monitorId) || {}
      };
    }
    return null;
  }

  setupDisplayChangeListeners() {
    // Listen for display configuration changes
    // This would require native Windows API integration
    // For now, we'll poll periodically
    setInterval(async () => {
      await this.detectMonitors();
    }, 30000); // Check every 30 seconds
  }

  async smoothTransition(monitorId, targetBrightness, targetTemperature, duration = 1000) {
    const steps = 10;
    const stepDuration = duration / steps;

    const currentBrightness = await this.getBrightness(monitorId);
    const currentTemperature = this.currentSettings.get(monitorId)?.temperature || 6500;

    const brightnessStep = (targetBrightness - currentBrightness) / steps;
    const temperatureStep = (targetTemperature - currentTemperature) / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      await this.setBrightness(monitorId, currentBrightness + brightnessStep * i);
      await this.setColorTemperature(monitorId, currentTemperature + temperatureStep * i);
    }
  }
}

module.exports = DisplayManager;
