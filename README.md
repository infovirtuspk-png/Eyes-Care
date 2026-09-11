<div align="center">

# 👁️ EYES CARE

**Professional Offline Eye-Care, Screen-Protection, Break-Management, and Background Productivity Utility for Windows 10 & 11**

![Eyes Care Banner](src/renderer/assets/icons/icon.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D4?style=flat&logo=windows)](https://www.microsoft.com/windows)
[![Framework: Electron](https://img.shields.io/badge/Framework-Electron-47848F?style=flat&logo=electron)](https://www.electronjs.org/)
[![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-success?style=flat)](https://github.com/infovirtuspk-png/Eyes-Care)
[![Downloads](https://img.shields.io/badge/Downloads-1000+-blue?style=flat)](https://github.com/infovirtuspk-png/Eyes-Care/releases)
[![Stars](https://img.shields.io/github/stars/infovirtuspk-png/Eyes-Care?style=social)](https://github.com/infovirtuspk-png/Eyes-Care)

[![Download Eyes Care](https://img.shields.io/badge/Download-Setup.exe-28a745?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/infovirtuspk-png/Eyes-Care/releases/download/1.0.0/Eyes.Care-Setup-1.0.0-x64.exe)
[![Get it from Microsoft Store](https://img.shields.io/badge/Microsoft_Store-Get_It-0089D6?style=for-the-badge&logo=microsoft)](https://www.microsoft.com/store)

**🚀 Protect your eyes • ⚡ Boost productivity • 🔒 100% Offline • 🎯 Zero tracking**

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🎬 Screenshots](#-screenshots)
- [💻 System Requirements](#-system-requirements)
- [📥 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [⌨️ Global Hotkeys](️-global-hotkeys)
- [⚙️ Configuration](#️-configuration)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Development](#️-development)
- [🔨 Building](#-building)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License & Privacy](#-license--privacy)
- [🆘 Support](#-support)
- [🗺️ Roadmap](#️-roadmap)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌟 Overview

**Eyes Care** is a comprehensive desktop application designed to protect your eyes and enhance productivity during long computer sessions. It combines advanced display control, automated break management, and focus tools into a single, **100% offline** application that respects your privacy.

### 🎯 Why Eyes Care?

- **👁️ Eye Health**: Reduces digital eye strain with scientifically-based display adjustments
- **⏰ Smart Breaks**: Enforces the 20-20-20 rule and other proven break methodologies
- **🎨 Display Control**: Real-time brightness and color temperature calibration
- **🧠 Focus Enhancement**: Tools to maintain concentration and reduce distractions
- **🔒 Privacy First**: Zero telemetry, no cloud dependencies, completely offline
- **⚡ Performance**: Lightweight, fast, and efficient with minimal system impact

### 🎯 Perfect For

- 👨‍💻 **Developers** - Long coding sessions with screen time management
- 📝 **Writers** - Focus tools for extended writing periods
- 🎨 **Designers** - Color-accurate display calibration
- 🎓 **Students** - Study sessions with scheduled breaks
- 🏢 **Office Workers** - Productivity enhancement and eye health
- 🎮 **Gamers** - Display optimization for different gaming scenarios

---

## ✨ Key Features

### 🖥️ Real Windows Display Control

- **🌡️ Color Temperature Calibration**: Precise control from **1000K to 10000K** using GDI `SetDeviceGammaRamp` RGB curve transformations
- **💡 Brightness Control**: Smooth hardware (WMI) and software gamma brightness adjustments (0% to 100%)
- **🎛️ 8 Built-in Presets**: 
  - ⏸️ **Pause** - Reset all display modifications
  - 🏥 **Health** - Eye-friendly 4000K / 80% brightness
  - 🎮 **Game** - Optimal 6000K / 100% brightness
  - 🎬 **Movie** - Cinematic 5500K / 90% brightness
  - 🏢 **Office** - Productive 5000K / 85% brightness
  - ✏️ **Editing** - Color-accurate 6500K / 95% brightness
  - 📖 **Reading** - Comfortable 3500K / 70% brightness
  - ⚙️ **Custom** - Your personalized settings

### 🌅 Automated Day / Night Transitions

- **🔄 Smooth Circadian Rhythms**: Automatic day-to-night transitions (Day: 6500K / 100% → Night: 3500K / 70%)
- **📅 Multi-Schedule Manager**: Support for custom schedules with weekday/weekend filtering
- **⏰ Priority System**: Intelligent schedule management with conflict resolution
- **📍 Location-Based**: Optional GPS-based sunrise/sunset integration

### ⏸️ Break Management Engine

- **👁️ 20-20-20 Rule**: Every 20 minutes, look at something 20 feet away for 20 seconds
- **🍅 Pomodoro Technique**: 25-minute work sessions with 5-minute breaks
- **📊 Standard Intervals**: 50-minute work sessions with 10-minute breaks
- **⚙️ Custom Schedules**: Fully customizable work/break intervals
- **🖥️ Multi-Monitor Support**: Full-screen break lock screen across all displays
- **⏱️ Countdown Timer**: Visual countdown with remaining time display
- **🧘 Eye Relaxation Instructions**: Built-in eye exercises during breaks
- **💤 Smart Inactivity Pause**: Native Win32 `GetLastInputInfo` idle detection
- **🔔 Customizable Notifications**: Desktop notifications before and during breaks

### 🎯 Focus & Reading Tools

- **📏 Reading Ruler**: Horizontal band following cursor for line-by-line reading
- **🔦 Spotlight**: Circular clear region with dimmed surroundings for focused reading
- **🌫️ Focus Blur**: Peripheral blur to reduce visual distractions
- **🎨 Customizable Appearance**: Adjustable size, opacity, and colors

### 🪟 MagicX Window Enhancement

- **🌙 Dark Invert**: Instant dark mode for any application
- **🔘 Grayscale**: Remove colors for reduced visual stimulation
- **🌃 Night Dim**: Screen dimming for late-night work
- **🔄 Restore**: One-click return to original display settings
- **🎯 Floating Toolbar**: Quick access toolbar with instant transformations

### 🎯 Application-Specific Rule Engine

- **🔍 Process Matching**: Automatically detects foreground Windows processes
- **⚡ Auto-Switching**: Applies corresponding profiles based on active application
- **📋 Pre-configured Rules**: Built-in profiles for popular apps (Chrome, Photoshop, VS Code, etc.)
- **⚙️ Custom Rules**: Create your own application-specific settings
- **🎯 Priority System**: Conflict resolution for overlapping rules

### 🖥️ Developer & Diagnostic Backend Terminal

- **📺 900×550 Console**: Dedicated diagnostic interface
- **📊 Real-Time Log Streaming**: Live logs with color-coded levels (INFO, SUCCESS, WARN, ERROR, DEBUG)
- **🔍 Log Filtering**: Filter logs by level, component, or text search
- **📤 Export Functionality**: Export logs for debugging and analysis
- **🏥 Subsystem Health**: Real-time health indicators for all system components
- **🔧 Performance Metrics**: CPU, memory, and resource usage monitoring

### 🔒 100% Offline-First Architecture

- **🚫 Zero External Dependencies**: No servers, cloud databases, or remote tracking
- **💾 Local Persistence**: SQLite (`sql.js`) database stored locally
- **📁 Storage Location**: `%LOCALAPPDATA%\Eyes Care\eyescare.db`
- **📤 JSON Export/Import**: Settings backup with schema validation
- **🔐 No Telemetry**: Absolutely no data collection or analytics

### 🎛️ System Tray & Windows Startup

- **🔔 Background Execution**: Runs silently in system tray
- **📋 Interactive Context Menu**: Full control from system tray icon
- **🚀 Boot Auto-Launch**: Windows startup integration for continuous protection
- **🔕 Silent Startup**: Background launch without disturbing your workflow
- **🎨 Custom Tray Icons**: Status-indicating tray icons

---

## 🎬 Screenshots

### 🖥️ Main Interface
*Professional dashboard with real-time controls for brightness, temperature, and scheduling*

### ⏸️ Break Lock Screen
*Full-screen break overlay with countdown timer and eye-relaxation exercises*

### 🪟 MagicX Toolbar
*Floating desktop toolbar with instant access to color transformations*

### 🖥️ Developer Console
*Built-in diagnostic terminal with real-time system monitoring*

---

## 💻 System Requirements

### ⚠️ Minimum Requirements
- **💻 OS**: Windows 10 (Version 1809 or later) / Windows 11
- **🧠 RAM**: 4 GB
- **💾 Storage**: 100 MB free space
- **🖥️ Display**: Compatible with standard Windows display drivers
- **⚙️ Other**: .NET Framework 4.7.2 or later

### ✅ Recommended Requirements
- **💻 OS**: Windows 11 (latest version)
- **🧠 RAM**: 8 GB
- **💾 Storage**: 200 MB free space
- **🖥️ Display**: Multi-monitor setup supported
- **🎨 Graphics**: DirectX 11 compatible GPU

### 🚫 Known Limitations
- Currently supports Windows only (macOS and Linux support planned)
- Some display drivers may have limited gamma control
- Virtual machines may have restricted display control capabilities

---

## 📥 Installation

### 🎯 Method 1: Download Installer (Recommended)

1. **📥 Download** the latest installer from the [Releases](https://github.com/infovirtuspk-png/Eyes-Care/releases) page
2. **🚀 Run** `Eyes.Care-Setup-1.0.0-x64.exe`
3. **📋 Follow** the installation wizard
4. **🎯 Launch** from Start Menu or Desktop shortcut

### 🎯 Method 2: Portable Version

1. **📥 Download** `Eyes.Care-Portable-1.0.0.exe` from [Releases](https://github.com/infovirtuspk-png/Eyes-Care/releases)
2. **🚀 Run** directly without installation (no admin rights required)
3. **📁 Place** in any folder or USB drive
4. **✨ Enjoy** full functionality without installation

### 🎯 Method 3: Build from Source

See [Development](#️-development) section below for detailed instructions.

### 🔧 Post-Installation Setup

1. **🎯 Choose Your Preset** - Select from Health, Office, Reading, Game, or Custom modes
2. **⏰ Enable Automation** - Set up day/night schedules and break reminders
3. **⌨️ Configure Hotkeys** - Customize global shortcuts for quick adjustments
4. **🚀 Enable Startup** - Configure Windows boot auto-launch for continuous protection
5. **🎨 Customize Profile** - Fine-tune brightness and temperature to your preference

---

## 🚀 Quick Start

### 🎯 5-Minute Setup Guide

1. **🚀 Launch the Application**
   - Double-click the Eyes Care icon or run from Start Menu
   - The application will appear in your system tray

2. **🎛️ Choose a Preset**
   - Click the tray icon and select a preset mode
   - **Health** for everyday use, **Office** for work, **Reading** for documents

3. **⏰ Enable Automation**
   - Open Settings → Schedules
   - Enable day/night transitions with your preferred times
   - Set up break reminders (recommended: 20-20-20 rule)

4. **⌨️ Customize Hotkeys**
   - Go to Settings → Hotkeys
   - Configure your preferred shortcuts
   - Default: `Alt+Up/Down` for brightness, `Alt+Left/Right` for temperature

5. **🚀 Enable Startup**
   - In Settings → General, enable "Start with Windows"
   - Choose between normal or silent startup mode

### 🎯 First Day Tips

- **👁️ Start with Health Mode** - Get used to the warmer color temperature gradually
- **⏰ Enable Break Reminders** - Your eyes will thank you for the 20-20-20 rule
- **🎯 Try Focus Tools** - Use the Reading Ruler for documents and Spotlight for code
- **🪟 Explore MagicX** - Try Dark Invert for late-night work sessions
- **📊 Monitor Your Usage** - Check the Developer Console to see your eye-care habits

---

## ⌨️ Global Hotkeys

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt+Up` | 📈 Increase Brightness | Increase brightness by 5% |
| `Alt+Down` | 📉 Decrease Brightness | Decrease brightness by 5% |
| `Alt+Right` | 🔥 Increase Temperature | Increase color temperature by 500K |
| `Alt+Left` | ❄️ Decrease Temperature | Decrease color temperature by 500K |
| `Alt+B` | ⏸️ Take Break Now | Immediately start a break |
| `Alt+P` | ⏸️ Pause Protection | Reset all display modifications |
| `Alt+F` | 🎯 Toggle Focus Overlay | Enable/disable focus tools |
| `Alt+M` | 🪟 Toggle MagicX Toolbar | Show/hide MagicX floating toolbar |
| `Alt+1` | 🏥 Health Mode | Switch to Health preset (4000K / 80%) |
| `Alt+2` | 🏢 Office Mode | Switch to Office preset (5000K / 85%) |
| `Alt+3` | 📖 Reading Mode | Switch to Reading preset (3500K / 70%) |
| `Alt+4` | 🎮 Game Mode | Switch to Game preset (6000K / 100%) |

### 🎯 Custom Hotkeys

All hotkeys can be customized in Settings → Hotkeys. You can:
- **🔄 Modify existing shortcuts** - Change default combinations
- **➕ Add new shortcuts** - Create custom actions
- **🚫 Disable hotkeys** - Turn off specific shortcuts
- **🎯 Application-specific** - Different hotkeys for different apps

---

## ⚙️ Configuration

### 📁 Settings Location

All settings are stored locally in:
```
%LOCALAPPDATA%\Eyes Care\eyescare.db
```

### 📤 Export/Import Settings

**Export Your Configuration:**
1. Go to Settings → Backup & Restore
2. Click "Export Settings"
3. Choose a location to save the JSON file
4. Your configuration is now portable

**Import Settings:**
1. Go to Settings → Backup & Restore
2. Click "Import Settings"
3. Select your previously exported JSON file
4. All settings will be applied immediately

### 🎨 Profile Customization

**Create Custom Profiles:**
1. Open Settings → Profiles
2. Click "Create New Profile"
3. Set your preferred brightness (0-100%)
4. Set your preferred temperature (1000K-10000K)
5. Name your profile and save

**Application-Specific Rules:**
1. Go to Settings → Application Rules
2. Click "Add New Rule"
3. Select the application executable (e.g., `chrome.exe`)
4. Choose the profile to apply
5. Set priority if multiple rules apply

### ⏰ Schedule Configuration

**Day/Night Transitions:**
1. Settings → Schedules → Day/Night
2. Set start times for day and night modes
3. Configure transition duration (smooth vs instant)
4. Enable location-based automatic times (optional)

**Break Schedules:**
1. Settings → Schedules → Breaks
2. Choose break methodology (20-20-20, Pomodoro, Custom)
3. Set work and break durations
4. Configure inactivity detection sensitivity
5. Enable/disable weekend schedules

---

## 🏗️ Architecture

### 📂 Project Structure

```
Eyes Care/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js             # Application entry point
│   │   ├── window-manager.js   # Window management
│   │   ├── tray-manager.js     # System tray integration
│   │   ├── startup-manager.js  # Windows startup handling
│   │   ├── ipc-manager.js      # IPC communication
│   │   └── native/             # Native Windows modules
│   │       ├── display-manager.js    # Display control
│   │       ├── color-temperature.js  # Gamma ramp manipulation
│   │       ├── brightness.js         # Brightness control
│   │       └── monitor-manager.js    # Multi-monitor support
│   ├── backend/                 # Business logic engines
│   │   ├── backend-manager.js  # Main backend coordinator
│   │   ├── display-engine.js   # Display control logic
│   │   ├── break-engine.js     # Break management
│   │   ├── focus-engine.js     # Focus tools
│   │   ├── magicx-engine.js    # MagicX toolbar
│   │   ├── scheduler-engine.js # Time-based automation
│   │   ├── rule-engine.js      # Application rules
│   │   ├── hotkey-engine.js    # Global hotkeys
│   │   ├── automation-engine.js # Automation workflows
│   │   ├── timer-engine.js    # Timer management
│   │   ├── notification-engine.js # Desktop notifications
│   │   ├── event-bus.js        # Internal event system
│   │   ├── logger.js           # Logging system
│   │   └── watchdog.js         # System monitoring
│   ├── database/               # Data persistence
│   │   └── database-manager.js # SQLite operations
│   ├── native/                 # Native bindings
│   │   └── windows/
│   │       ├── display-native.js    # Windows display API
│   │       ├── idle-detector.js     # User activity detection
│   │       └── process-monitor.js   # Process monitoring
│   ├── services/               # Shared services
│   │   ├── profile-engine.js  # Profile management
│   │   ├── rule-engine.js     # Rule processing
│   │   ├── timer-engine.js    # Timer implementation
│   │   ├── hotkey-engine.js   # Hotkey registration
│   │   └── notification-engine.js # Notification handling
│   ├── preload/                # Preload scripts
│   │   └── preload.js         # IPC bridge
│   └── renderer/               # UI rendering
│       ├── index.html         # Main interface
│       ├── lock-screen.html   # Break lock screen
│       ├── magicx-toolbar.html # MagicX toolbar
│       ├── focus-overlay.html # Focus overlay
│       ├── terminal.html      # Developer console
│       ├── css/               # Stylesheets
│       │   ├── main.css       # Main styles
│       │   ├── display.css    # Display controls
│       │   ├── break.css      # Break screen
│       │   ├── focus.css      # Focus tools
│       │   ├── magicx.css     # MagicX toolbar
│       │   ├── terminal.css   # Console styles
│       │   ├── options.css    # Settings panel
│       │   ├── sidebar.css    # Navigation
│       │   └── about.css      # About page
│       ├── js/                # Frontend logic
│       │   ├── app.js         # Main application
│       │   ├── display.js     # Display controls
│       │   ├── break.js       # Break management
│       │   ├── focus.js       # Focus tools
│       │   ├── magicx.js      # MagicX toolbar
│       │   ├── settings.js    # Settings management
│       │   ├── options.js     # Options panel
│       │   ├── terminal.js    # Console interface
│       │   ├── lock-screen.js # Break screen logic
│       │   ├── focus-overlay.js # Focus overlay
│       │   └── magicx-toolbar.js # Toolbar logic
│       └── assets/            # Static resources
│           └── icons/         # Application icons
├── tests/                      # Test suite
│   └── test-suite.js         # Automated tests
├── scripts/                    # Build and utility scripts
│   ├── build-icons.py        # Icon generation
│   └── make-tray-icon.py     # Tray icon creation
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md       # Technical architecture
│   ├── DATABASE.md           # Database schema
│   ├── TROUBLESHOOTING.md    # Troubleshooting guide
│   └── WINDOWS-DISPLAY.md    # Display control docs
├── package.json               # Project configuration
├── electron-builder.yml       # Build configuration
└── README.md                  # This file
```

### 🎯 Key Components

- **🖥️ Display Controller**: GDI gamma ramp manipulation for real-time display control
- **⏰ Schedule Engine**: Time-based profile switching with conflict resolution
- **⏸️ Break Manager**: 20-20-20 rule enforcement with smart inactivity detection
- **🔍 Process Monitor**: Application-specific profile matching using Win32 APIs
- **🎯 Focus Overlay**: Visual concentration tools with customizable appearance
- **🪟 MagicX Engine**: Floating toolbar with shader-based display transformations
- **🔔 Notification System**: Desktop notifications with customizable timing
- **📊 Logger**: Multi-level logging system with filtering and export capabilities
- **🏥 Watchdog**: System health monitoring and automatic recovery

### 🔒 Security Features

- **🔐 Context Isolation**: Enabled to prevent code injection attacks
- **🚫 Node Integration**: Disabled for renderer processes
- **🛡️ IPC Bridge**: Strict allowlist for secure communication
- **🌐 No External Requests**: Zero network connectivity for core functionality
- **💾 Local Storage Only**: All data stored locally, no cloud transmission
- **🔒 ASAR Packaging**: Code obfuscation and integrity verification
- **📝 Code Signing**: Digital signature support for executable verification

---

## 🛠️ Development

### 📋 Prerequisites

- **🟢 Node.js** 14.x or higher
- **📦 npm** 6.x or higher
- **🔧 Git** for version control
- **🪟 Windows 10/11** for development and testing

### 🚀 Setup Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/infovirtuspk-png/Eyes-Care.git
cd Eyes-Care

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Run automated tests
node tests/test-suite.js
```

### 🧪 Running Tests

```bash
# Run full test suite
node tests/test-suite.js

# Run specific test category
node tests/test-suite.js --category display

# Run with verbose output
node tests/test-suite.js --verbose
```

### 📜 Project Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch application in production mode |
| `npm run dev` | Launch with development tools and hot reload |
| `npm run build` | Build for current platform |
| `npm run build:win` | Build Windows installer (NSIS) |
| `npm run build:portable` | Build portable executable |
| `npm run lint` | Run code linting |
| `npm run test` | Run automated test suite |

### 🏗️ Development Guidelines

**Code Style:**
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting (Prettier recommended)

**Testing:**
- Write unit tests for new features
- Test on multiple Windows versions
- Verify multi-monitor scenarios
- Check for memory leaks

**Commit Messages:**
- Use clear, descriptive commit messages
- Reference related issues when applicable
- Keep commits focused and atomic

---

## 🔨 Building

### 🏗️ Build Process

```bash
# Build Windows installer (NSIS)
npm run build:win

# Build portable executable
npm run build:portable

# Build for specific architecture
npm run build:win -- --x64
npm run build:win -- --ia32

# Output location
dist/Eyes.Care-Setup-1.0.0-x64.exe
dist/Eyes.Care-Portable-1.0.0.exe
```

### ⚙️ Build Configuration

Build settings are configured in `electron-builder.yml`:

**Installer Features:**
- Custom directory selection
- Desktop and Start Menu shortcuts
- Uninstaller with complete cleanup
- Digital signature support (configure your certificate)
- ASAR packaging for security and performance

**Portable Features:**
- Single executable with no installation required
- Settings stored in application directory
- No registry modifications
- Perfect for USB drives and temporary use

### 🔐 Code Signing

To sign your builds with a digital certificate:

1. **Obtain a Code Signing Certificate** from a trusted CA
2. **Configure electron-builder.yml**:
   ```yaml
   win:
     certificateFile: "path/to/certificate.pfx"
     certificatePassword: "your-password"
   ```
3. **Build with signing**:
   ```bash
   npm run build:win
   ```

---

## 🐛 Troubleshooting

### ⚠️ Common Issues

#### 🚫 Application won't start

**Possible Causes:**
- Windows version compatibility
- Antivirus blocking
- Missing dependencies

**Solutions:**
- Ensure Windows 10/11 is updated to latest version
- Check antivirus settings and add exception for Eyes Care
- Run as administrator if permission issues persist
- Verify .NET Framework 4.7.2+ is installed
- Check Windows Event Viewer for crash logs

#### 🖥️ Display changes not applying

**Possible Causes:**
- Outdated graphics drivers
- Conflicting overlay software
- Display driver limitations

**Solutions:**
- Update graphics drivers to latest version
- Disable other overlay software (f.lux, Twilight, etc.)
- Try different preset profiles
- Check if display supports gamma control
- Test on different monitors if available

#### ⏰ Break reminders not working

**Possible Causes:**
- Inactivity detection disabled
- System power settings interfering
- Notification permissions blocked

**Solutions:**
- Ensure inactivity detection is enabled in settings
- Check system power settings (disable sleep mode)
- Verify Windows notification permissions
- Check if focus assist is blocking notifications
- Test with manual break trigger (`Alt+B`)

#### ⌨️ Hotkeys not responding

**Possible Causes:**
- Conflicting applications
- Eyes Care not running in background
- Global hotkey registration failed

**Solutions:**
- Check for conflicting applications (other hotkey utilities)
- Ensure Eyes Care is running in system tray
- Try different key combinations
- Restart Eyes Care
- Check Windows accessibility settings

#### 🎨 Colors appear incorrect

**Possible Causes:**
- ICC profile conflicts
- Display calibration interference
- GPU driver issues

**Solutions:**
- Reset display calibration in Windows settings
- Disable ICC profiles temporarily
- Update GPU drivers
- Try different color temperature values
- Reset to default preset

### 🆘 Getting Help

**Documentation:**
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [WINDOWS-DISPLAY.md](WINDOWS-DISPLAY.md) - Display control technical details
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture documentation

**Built-in Diagnostics:**
- Open the Developer Console (tray icon → Developer Console)
- Check system health indicators
- Review error logs and warnings
- Export logs for analysis

**Community Support:**
- GitHub Issues: Report bugs and request features
- Discussions: Share tips and ask questions
- Wiki: Community-maintained guides

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Reporting Issues

1. **Search existing issues** - Check if your issue has already been reported
2. **Gather diagnostic info** - Use the Developer Console to collect logs
3. **Create detailed report** - Include:
   - Windows version and build number
   - Eyes Care version
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Console logs (sanitized of personal info)
   - Screenshots if applicable

### 🚀 Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following code style guidelines
4. **Test thoroughly** (`npm run test`)
5. **Commit with clear messages** (conventional commits preferred)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request** with detailed description

### 📝 Code Style Guidelines

- **JavaScript**: Use ES6+ features, maintain consistent formatting
- **Comments**: Document complex logic and public APIs
- **Naming**: Use descriptive names for variables and functions
- **Structure**: Follow existing project structure
- **Testing**: Add tests for new functionality
- **Documentation**: Update relevant documentation files

### 🎯 Areas for Contribution

- **🐛 Bug fixes** - Help squash existing issues
- **✨ New features** - Implement requested functionality
- **📝 Documentation** - Improve guides and documentation
- **🌐 Localization** - Add translations for different languages
- **🧪 Testing** - Improve test coverage
- **🎨 UI/UX** - Enhance user interface and experience
- **⚡ Performance** - Optimize performance and resource usage

---

## 📄 License & Privacy

### 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Eyes Care

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 🔒 Privacy Commitment

Eyes Care operates **100% offline** with the following privacy guarantees:

**🚫 No Data Collection:**
- No network requests or telemetry data collection
- No cloud storage or remote synchronization
- No user tracking or analytics
- No third-party services

**💾 Local Storage Only:**
- All settings stored locally on your machine
- Database file: `%LOCALAPPDATA%\Eyes Care\eyescare.db`
- Logs stored locally with configurable retention
- No personal data transmitted externally

**🔐 Open Source Transparency:**
- Fully open source code
- No hidden functionality
- No backdoors or data exfiltration
- Community auditable

**📤 User Control:**
- Complete control over your data
- Export/import functionality for portability
- Clear data deletion options
- No forced updates or data migration

---

## 🆘 Support

### 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical architecture and system design
- **[DATABASE.md](DATABASE.md)** - Database schema and data structures
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[WINDOWS-DISPLAY.md](WINDOWS-DISPLAY.md)** - Display control technical documentation

### 👥 Community

- **🐛 GitHub Issues**: Report bugs and request features
- **💬 Discussions**: Share tips, ask questions, and connect with other users
- **📖 Wiki**: Community-maintained guides and tutorials
- **⭐ Star the repo**: Show your support and help others discover Eyes Care

### 🏢 Professional Support

For enterprise support, custom development, or commercial licensing:
- Contact the development team through GitHub Issues
- Discuss your requirements in the Discussions section
- Explore partnership opportunities for integration

### 📧 Reporting Security Issues

For security vulnerabilities or sensitive issues:
- Do not report publicly in GitHub Issues
- Send details to the maintainers privately
- Include steps to reproduce and potential impact
- Allow time for investigation and fix before disclosure

---

## 🗺️ Roadmap

### 🚀 Planned Features

**🎯 Short-term (Next 3 months):**
- [ ] 🍎 macOS support (Apple Silicon and Intel)
- [ ] 🐧 Linux support (Ubuntu, Fedora, Debian)
- [ ] 🌐 Multi-language support (Spanish, French, German, Chinese)
- [ ] 📊 Usage statistics dashboard
- [ ] 🎨 Theme customization for UI
- [ ] 🔔 Advanced notification options

**🎯 Medium-term (6-12 months):**
- [ ] ☁️ Optional cloud sync for settings
- [ ] 📱 Mobile companion app (iOS/Android)
- [ ] 🤖 AI-powered break suggestions
- [ ] 🔌 Plugin system for extensions
- [ ] 📊 Advanced analytics and reporting
- [ ] 🎯 Eye exercises and training programs

**🎯 Long-term (12+ months):**
- [ ] 🌐 Web-based configuration interface
- [ ] 🏢 Enterprise management console
- [ ] 🔗 Integration with health apps
- [ ] 📚 Educational content and tips
- [ ] 🎮 Gamification elements
- [ ] 🌍 Global community features

### 📊 Version History

**v1.0.0** - Initial Release (Current)
- ✅ Display control and presets
- ✅ Break management engine
- ✅ Focus tools and MagicX toolbar
- ✅ Application-specific rules
- ✅ Developer console
- ✅ System tray integration
- ✅ Windows startup support
- ✅ 100% offline architecture

---

## 🙏 Acknowledgments

### 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[sql.js](https://sql.js.org/)** - SQLite database for JavaScript
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Windows API](https://docs.microsoft.com/en-us/windows/win32/api/)** - Native Windows integration

### 🎨 Design Resources

- Icons and design resources from the open-source community
- Color palettes inspired by modern eye-care research
- UI/UX principles from accessibility guidelines

### 👥 Community Thanks

- All contributors and beta testers
- Users who provided feedback and suggestions
- The open-source community for valuable tools and libraries
- Eye care professionals for health recommendations

### 📚 References

- American Optometric Association - 20-20-20 Rule
- Harvard Health - Digital Eye Strain
- Vision Council - Screen Time Recommendations

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=infovirtuspk-png/Eyes-Care&type=Date)](https://star-history.com/#infovirtuspk-png/Eyes-Care&Date)

---

<div align="center">

**Made with ❤️ for your eyes and productivity**

[⬆ Back to Top](#-eyes-care)

**👁️ Protect Your Eyes • ⚡ Boost Productivity • 🔒 Stay Private**

</div>