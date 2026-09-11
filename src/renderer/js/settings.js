// Settings Module JavaScript - Handles general application settings
class SettingsModule {
  constructor() {
    this.settings = {};
    this.init();
  }

  init() {
    this.setupAboutPage();
    this.setupActivatePage();
    this.loadSettings();
  }

  setupAboutPage() {
    document.getElementById('documentation-btn')?.addEventListener('click', () => {
      this.showDocumentation();
    });

    document.getElementById('privacy-btn')?.addEventListener('click', () => {
      this.showPrivacy();
    });

    document.getElementById('open-logs-btn')?.addEventListener('click', () => {
      this.openLogs();
    });

    document.getElementById('system-info-btn')?.addEventListener('click', () => {
      this.showSystemInfo();
    });
  }

  setupActivatePage() {
    document.getElementById('activate-btn')?.addEventListener('click', () => {
      this.activateLicense();
    });

    // Check trial status on load
    this.checkTrialStatus();
  }

  async checkTrialStatus() {
    try {
      const status = await window.electronAPI.checkTrialStatus();
      this.updateActivationUI(status);
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  }

  updateActivationUI(status) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const trialInfo = document.getElementById('trial-info');
    const trialMessageText = document.getElementById('trial-message-text');
    const countdownValue = document.getElementById('countdown-value');

    if (status.activated) {
      statusIndicator.classList.add('active');
      statusText.textContent = 'Activated';
      statusText.style.color = 'var(--success-color)';
      
      if (trialInfo) {
        trialInfo.style.display = 'none';
      }
    } else if (status.expired) {
      statusIndicator.classList.remove('active');
      statusText.textContent = 'Trial Expired';
      statusText.style.color = 'var(--danger-color)';
      
      if (trialInfo) {
        trialInfo.style.display = 'block';
        if (trialMessageText) {
          trialMessageText.textContent = 'Your trial has expired. Please activate to continue using Eyes Care.';
        }
        if (countdownValue) {
          countdownValue.textContent = '0 days';
          countdownValue.style.color = 'var(--danger-color)';
        }
      }
    } else if (status.is_trial) {
      statusIndicator.classList.remove('active');
      statusText.textContent = `Trial: ${status.days_remaining} days remaining`;
      statusText.style.color = 'var(--accent-color)';
      
      if (trialInfo) {
        trialInfo.style.display = 'block';
        if (trialMessageText) {
          trialMessageText.textContent = 'You are using the trial version. Activate to unlock full features.';
        }
        if (countdownValue) {
          countdownValue.textContent = `${status.days_remaining} days`;
          countdownValue.style.color = 'var(--accent-color)';
        }
      }
    }
  }

  async loadSettings() {
    try {
      const generalSettings = await window.electronAPI.getGeneralSettings();
      if (generalSettings) {
        this.settings = generalSettings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  showDocumentation() {
    alert('Eyes Care Documentation\n\nDisplay Module:\n- Adjust color temperature (1000K-10000K)\n- Control brightness (0-100%)\n- Use preset modes for different activities\n- Enable auto day/night scheduling\n\nBreak Module:\n- Configure work/break intervals\n- Choose from predefined profiles\n- Enable enforced breaks\n- Smart pause detection\n\nFocus Module:\n- Focus Read: Highlight reading area\n- Focus Blur: Blur background\n- Spotlight: Spotlight focus mode\n\nMagicX Module:\n- Apply visual effects to windows\n- Dark, Grayscale, Dim effects\n- Configurable toolbar\n\nOptions:\n- General startup behavior\n- Display defaults\n- Break configuration\n- Focus settings\n- Hotkey configuration');
  }

  showPrivacy() {
    alert('Eyes Care Privacy Policy\n\nEyes Care is a 100% offline application that prioritizes your privacy:\n\n• No account required\n• No cloud sync\n• No telemetry or analytics\n• No data collection\n• All settings stored locally on your computer\n• No internet connection required\n\nYour data never leaves your computer. All configuration and settings are stored in a local SQLite database.');
  }

  openLogs() {
    alert('Logs Location:\n\n%LOCALAPPDATA%/EyesCare/logs/\n\nLog files:\n- app.log\n- display.log\n- timer.log\n- native.log\n- error.log\n\nYou can open this folder to view application logs for troubleshooting.');
  }

  showSystemInfo() {
    const info = `
Eyes Care System Information

Version: 1.0.0
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Language: ${navigator.language}
Screen: ${screen.width}x${screen.height}
Color Depth: ${screen.colorDepth} bits

Electron Version: ${process.versions.electron}
Node.js Version: ${process.versions.node}
Chrome Version: ${process.versions.chrome}

Database: SQLite (Local)
Display: Native Windows API Integration
    `.trim();
    alert(info);
  }

  async activateLicense() {
    const licenseKey = document.getElementById('license-key').value.trim();
    
    if (!licenseKey) {
      alert('Please enter a license key.');
      return;
    }

    try {
      const result = await window.electronAPI.activateLicense(licenseKey);
      
      if (result.success) {
        alert('License activated successfully!\n\nThank you for using Eyes Care.');
        this.checkTrialStatus();
      } else {
        alert(result.message || 'Invalid license key. Please try again.');
      }
    } catch (error) {
      console.error('Error activating license:', error);
      alert('Error activating license. Please try again.');
    }
  }

  async exportSettings() {
    try {
      await window.electronAPI.exportSettings();
      alert('Settings exported successfully!');
    } catch (error) {
      console.error('Error exporting settings:', error);
      alert('Error exporting settings.');
    }
  }

  async importSettings() {
    try {
      // In a real implementation, this would open a file dialog
      const settingsJson = prompt('Paste settings JSON:');
      if (settingsJson) {
        await window.electronAPI.importSettings(settingsJson);
        alert('Settings imported successfully!');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      alert('Error importing settings.');
    }
  }
}

// Initialize settings module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('about-page') || document.getElementById('activate-page')) {
    window.settingsModule = new SettingsModule();
  }
});
