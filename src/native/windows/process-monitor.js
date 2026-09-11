const { spawn } = require('child_process');

/**
 * Windows Active Process / Window Detector
 * Queries foreground window and running process names to match Application Rules
 */
class ProcessMonitor {
  constructor() {
    this.cachedForegroundProcess = '';
    this.isQuerying = false;
  }

  /**
   * Returns the foreground process executable name (e.g. "chrome.exe", "photoshop.exe", "code.exe")
   */
  async getForegroundProcess() {
    if (this.isQuerying) return this.cachedForegroundProcess;
    this.isQuerying = true;

    try {
      const psScript = `
        Add-Type @'
        using System;
        using System.Diagnostics;
        using System.Runtime.InteropServices;
        public class WinDetect {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();

            [DllImport("user32.dll")]
            public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

            public static string GetActiveProcessName() {
                IntPtr hwnd = GetForegroundWindow();
                if (hwnd == IntPtr.Zero) return "";
                uint pid;
                GetWindowThreadProcessId(hwnd, out pid);
                if (pid == 0) return "";
                try {
                    Process p = Process.GetProcessById((int)pid);
                    return p.ProcessName + ".exe";
                } catch {
                    return "";
                }
            }
        }
'@
        [WinDetect]::GetActiveProcessName()
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
            this.cachedForegroundProcess = stdout.trim().toLowerCase();
          }
          resolve(this.cachedForegroundProcess);
        });
        child.on('error', () => {
          this.isQuerying = false;
          resolve(this.cachedForegroundProcess);
        });
      });
    } catch {
      this.isQuerying = false;
      return this.cachedForegroundProcess;
    }
  }
}

module.exports = new ProcessMonitor();
