# EYES CARE

**Professional Offline Eye-Care, Screen-Protection, Break-Management, and Background Productivity Utility for Windows 10 & 11**

![Eyes Care Banner](src/renderer/assets/icons/icon.png)

---

## Key Features

- **Real Windows Display Control**:
  - Color temperature calibration from **1000K to 10000K** using GDI `SetDeviceGammaRamp` RGB curve transformations.
  - Smooth hardware (WMI) and software gamma brightness adjustments (0% to 100%).
  - 8 Built-in Presets: **Pause**, **Health**, **Game**, **Movie**, **Office**, **Editing**, **Reading**, **Custom**.
- **Automated Day / Night Transitions**:
  - Smooth circadian day-to-night transitions (Day: 6500K / 100% $\to$ Night: 3500K / 70%).
  - Multi-schedule manager supporting custom schedules with weekday/weekend filtering and priority.
- **Break Management Engine**:
  - **20-20-20 Rule**, **Pomodoro (25m/5m)**, **Standard (50m/10m)**, and **Custom** intervals.
  - Multi-monitor full-screen Break Lock Screen with countdown and eye-relaxation instructions.
  - Smart Inactivity Pause via native Win32 `GetLastInputInfo` idle detection.
- **Focus & Reading Tools**:
  - **Reading Ruler** horizontal band following cursor.
  - **Spotlight** circular clear region with dimmed surroundings.
  - **Focus Blur** for reducing peripheral glare and visual distraction.
- **MagicX Window Enhancement**:
  - Floating desktop toolbar with **Dark Invert**, **Grayscale**, **Night Dim**, and **Restore** shaders.
- **Application-Specific Rule Engine**:
  - Automatically matches foreground Windows processes (e.g. `chrome.exe`, `photoshop.exe`, `code.exe`) and applies corresponding profiles.
- **Developer & Diagnostic Backend Terminal**:
  - Dedicated 900×550 diagnostic console with real-time log streaming (INFO, SUCCESS, WARN, ERROR, DEBUG), log filtering, search, export, and subsystem health indicators.
- **100% Offline-First Architecture**:
  - Zero external servers, cloud databases, or remote tracking.
  - Local persistence using SQLite (`sql.js`), stored in `%LOCALAPPDATA%\Eyes Care\eyescare.db`.
  - JSON settings export and import with schema validation.
- **System Tray & Windows Startup**:
  - Background execution with full interactive context menu.
  - Windows boot auto-launch with silent background startup.

---

## Tech Stack

- **Framework**: Electron (Node.js)
- **Frontend**: Vanilla HTML5 / CSS3 / JavaScript (Dark Charcoal `#17191B`, Cyan/Teal `#00CED1` accent)
- **Database**: SQLite (`sql.js`) with migrations
- **Display Layer**: Windows GDI (`SetDeviceGammaRamp`), WMI (`WmiMonitorBrightnessMethods`), Win32 `GetLastInputInfo`, `ProcessMonitor`
- **Security**: `contextIsolation: true`, `nodeIntegration: false`, strict allowlisted IPC bridge

---

## Global Hotkeys

| Shortcut | Action |
|---|---|
| `Alt+Up` | Increase Brightness (+5%) |
| `Alt+Down` | Decrease Brightness (-5%) |
| `Alt+Right` | Increase Temperature (+500K) |
| `Alt+Left` | Decrease Temperature (-500K) |
| `Alt+B` | Take Break Now |
| `Alt+P` | Pause Eye Protection (Reset) |
| `Alt+F` | Toggle Focus Overlay |
| `Alt+M` | Toggle MagicX Toolbar |
| `Alt+1` | Health Mode (4000K / 80%) |
| `Alt+2` | Office Mode (5000K / 85%) |
| `Alt+3` | Reading Mode (3500K / 70%) |
| `Alt+4` | Game Mode (6000K / 100%) |

---

## Development & Build

### Running Locally
```bash
# Run automated test suite
node tests/test-suite.js

# Launch application
npm start
```

### Packaging Windows Installer
```bash
npm run build:win
```

---

## License & Privacy
Eyes Care operates **100% offline**. No network requests or telemetry data are collected.
Licensed under the MIT License.
