const { spawn } = require('child_process');

/**
 * Windows Native Idle Detector
 * Queries user32.dll GetLastInputInfo to determine system-wide user idle time (seconds)
 */
class IdleDetector {
  constructor() {
    this.cachedIdleSeconds = 0;
    this.isQuerying = false;
  }

  /**
   * Returns how many seconds the user has been idle (no mouse/keyboard input across entire Windows OS)
   */
  async getSystemIdleSeconds() {
    if (this.isQuerying) return this.cachedIdleSeconds;
    this.isQuerying = true;

    try {
      const psScript = `
        Add-Type @'
        using System;
        using System.Runtime.InteropServices;
        public struct LASTINPUTINFO {
            public uint cbSize;
            public uint dwTime;
        }
        public class IdleCheck {
            [DllImport("User32.dll")]
            public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
            [DllImport("Kernel32.dll")]
            public static extern uint GetTickCount();

            public static uint GetIdleTime() {
                LASTINPUTINFO lii = new LASTINPUTINFO();
                lii.cbSize = (uint)Marshal.SizeOf(lii);
                if (GetLastInputInfo(ref lii)) {
                    return (GetTickCount() - lii.dwTime) / 1000;
                }
                return 0;
            }
        }
'@
        [IdleCheck]::GetIdleTime()
      `;

      const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
      const child = spawn('powershell', ['-NoProfile', '-EncodedCommand', encoded], {
        windowsHide: true
      });

      let stdout = '';
      child.stdout.on('data', (d) => { stdout += d.toString(); });

      return new Promise((resolve) => {
        child.on('close', (code) => {
          this.isQuerying = false;
          if (code === 0 && stdout.trim()) {
            const sec = parseInt(stdout.trim(), 10);
            this.cachedIdleSeconds = isNaN(sec) ? 0 : sec;
          }
          resolve(this.cachedIdleSeconds);
        });
        child.on('error', () => {
          this.isQuerying = false;
          resolve(this.cachedIdleSeconds);
        });
      });
    } catch {
      this.isQuerying = false;
      return this.cachedIdleSeconds;
    }
  }
}

module.exports = new IdleDetector();
