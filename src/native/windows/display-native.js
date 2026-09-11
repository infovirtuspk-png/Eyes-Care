const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Windows Native Display Interface
 * Handles GDI SetDeviceGammaRamp for Color Temperature,
 * WMI/CIM/DDC for Hardware Brightness, and Gamma Scaling fallback.
 */
class DisplayNative {
  constructor() {
    this.currentBrightness = 100;
    this.currentTemperature = 6500;
    this.capabilities = {
      hardwareBrightness: false,
      gammaRamp: true,
      ddcCi: false,
      softwareOverlayFallback: true
    };
    this.monitors = [];
  }

  async initialize() {
    await this.detectCapabilities();
    await this.detectMonitors();
  }

  async detectCapabilities() {
    try {
      // Test if WmiMonitorBrightness is supported (mostly Laptops / eDP)
      const res = await execAsync(
        'powershell -NoProfile -Command "Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue | Select-Object -Property CurrentBrightness"'
      );
      if (res.stdout && res.stdout.trim().length > 0) {
        this.capabilities.hardwareBrightness = true;
      }
    } catch {
      this.capabilities.hardwareBrightness = false;
    }
  }

  async detectMonitors() {
    try {
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms;
        $screens = [System.Windows.Forms.Screen]::AllScreens;
        $result = @();
        $idx = 1;
        foreach ($s in $screens) {
          $result += [PSCustomObject]@{
            id = "MON_" + $idx;
            name = $s.DeviceName;
            primary = $s.Primary;
            width = $s.Bounds.Width;
            height = $s.Bounds.Height;
            x = $s.Bounds.X;
            y = $s.Bounds.Y;
          };
          $idx++;
        };
        $result | ConvertTo-Json -Compress
      `;
      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const cmd = `powershell -NoProfile -EncodedCommand ${encoded}`;
      const res = await execAsync(cmd);
      let parsed = [];
      if (res.stdout && res.stdout.trim()) {
        const raw = JSON.parse(res.stdout.trim());
        parsed = Array.isArray(raw) ? raw : [raw];
      }

      this.monitors = parsed.map((m, i) => ({
        id: m.id || `MON_${i + 1}`,
        name: m.name ? `Display ${i + 1} (${m.width}x${m.height})` : `Monitor ${i + 1}`,
        deviceName: m.name || `\\\\.\\DISPLAY${i + 1}`,
        primary: !!m.primary,
        width: m.width || 1920,
        height: m.height || 1080,
        x: m.x || 0,
        y: m.y || 0,
        brightness: this.currentBrightness,
        temperature: this.currentTemperature,
        capabilities: { ...this.capabilities }
      }));

      if (this.monitors.length === 0) {
        this.monitors = [{
          id: 'MON_1',
          name: 'Primary Display',
          deviceName: '\\\\.\\DISPLAY1',
          primary: true,
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          brightness: 100,
          temperature: 6500,
          capabilities: { ...this.capabilities }
        }];
      }

      return this.monitors;
    } catch (err) {
      console.error('Monitor detection fallback:', err.message);
      this.monitors = [{
        id: 'MON_1',
        name: 'Primary Display',
        deviceName: '\\\\.\\DISPLAY1',
        primary: true,
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        brightness: 100,
        temperature: 6500,
        capabilities: { ...this.capabilities }
      }];
      return this.monitors;
    }
  }

  /**
   * Converts Kelvin temperature (1000K to 10000K) and brightness (0-100)
   * into RGB multipliers and generates 256-point 16-bit gamma ramp curves
   */
  kelvinAndBrightnessToRamp(kelvin, brightnessPercent) {
    kelvin = Math.max(1000, Math.min(10000, kelvin));
    brightnessPercent = Math.max(5, Math.min(100, brightnessPercent));
    const bFactor = brightnessPercent / 100;

    // Tanner Helland algorithm for Kelvin -> RGB
    const temp = kelvin / 100;
    let red, green, blue;

    // Calculate Red
    if (temp <= 66) {
      red = 255;
    } else {
      red = temp - 60;
      red = 329.698727446 * Math.pow(red, -0.1332047592);
      if (red < 0) red = 0;
      if (red > 255) red = 255;
    }

    // Calculate Green
    if (temp <= 66) {
      green = temp;
      green = 99.4708025861 * Math.log(green) - 161.1195681661;
      if (green < 0) green = 0;
      if (green > 255) green = 255;
    } else {
      green = temp - 60;
      green = 288.1221695283 * Math.pow(green, -0.0755148492);
      if (green < 0) green = 0;
      if (green > 255) green = 255;
    }

    // Calculate Blue
    if (temp >= 66) {
      blue = 255;
    } else if (temp <= 19) {
      blue = 0;
    } else {
      blue = temp - 10;
      blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
      if (blue < 0) blue = 0;
      if (blue > 255) blue = 255;
    }

    const rMult = (red / 255) * bFactor;
    const gMult = (green / 255) * bFactor;
    const bMult = (blue / 255) * bFactor;

    return { rMult, gMult, bMult };
  }

  /**
   * Applies GDI Gamma Ramp via Win32 API SetDeviceGammaRamp
   */
  async applyGammaRamp(kelvin, brightness) {
    try {
      this.currentTemperature = kelvin;
      this.currentBrightness = brightness;

      const { rMult, gMult, bMult } = this.kelvinAndBrightnessToRamp(kelvin, brightness);

      // Construct inline C# script with P/Invoke
      const csharpType = `
        using System;
        using System.Runtime.InteropServices;

        public class NativeGamma {
            [DllImport("gdi32.dll")]
            public static extern bool SetDeviceGammaRamp(IntPtr hDC, ref RAMP lpRamp);

            [DllImport("user32.dll")]
            public static extern IntPtr GetDC(IntPtr hWnd);

            [DllImport("user32.dll")]
            public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

            [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
            public struct RAMP {
                [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
                public ushort[] Red;
                [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
                public ushort[] Green;
                [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
                public ushort[] Blue;
            }

            public static bool SetGamma(double r, double g, double b) {
                IntPtr hdc = GetDC(IntPtr.Zero);
                if (hdc == IntPtr.Zero) return false;

                RAMP ramp = new RAMP();
                ramp.Red = new ushort[256];
                ramp.Green = new ushort[256];
                ramp.Blue = new ushort[256];

                for (int i = 0; i < 256; i++) {
                    double norm = (double)i / 255.0;
                    ramp.Red[i] = (ushort)Math.Max(0, Math.Min(65535, (int)(norm * r * 65535.0)));
                    ramp.Green[i] = (ushort)Math.Max(0, Math.Min(65535, (int)(norm * g * 65535.0)));
                    ramp.Blue[i] = (ushort)Math.Max(0, Math.Min(65535, (int)(norm * b * 65535.0)));
                }

                bool res = SetDeviceGammaRamp(hdc, ref ramp);
                ReleaseDC(IntPtr.Zero, hdc);
                return res;
            }
        }
      `;

      const psCommand = `
        if (-not ([System.Management.Automation.PSTypeName]'NativeGamma').Type) {
          Add-Type -TypeDefinition @"
${csharpType}
"@
        }
        [NativeGamma]::SetGamma(${rMult.toFixed(4)}, ${gMult.toFixed(4)}, ${bMult.toFixed(4)})
      `;

      const encoded = Buffer.from(psCommand, 'utf16le').toString('base64');
      const child = spawn('powershell', ['-NoProfile', '-EncodedCommand', encoded], {
        windowsHide: true
      });

      return new Promise((resolve) => {
        child.on('close', (code) => {
          resolve(code === 0);
        });
        child.on('error', () => {
          resolve(false);
        });
      });
    } catch (err) {
      console.error('applyGammaRamp error:', err.message);
      return false;
    }
  }

  /**
   * Sets hardware brightness if supported by WMI
   */
  async setHardwareBrightness(level) {
    if (!this.capabilities.hardwareBrightness) return false;
    try {
      const b = Math.max(0, Math.min(100, Math.round(level)));
      const cmd = `powershell -NoProfile -Command "(Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${b})"`;
      await execAsync(cmd);
      return true;
    } catch {
      return false;
    }
  }

  async resetDisplay() {
    this.currentBrightness = 100;
    this.currentTemperature = 6500;
    await this.applyGammaRamp(6500, 100);
    if (this.capabilities.hardwareBrightness) {
      await this.setHardwareBrightness(100);
    }
  }
}

module.exports = new DisplayNative();
