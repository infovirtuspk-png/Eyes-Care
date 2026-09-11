# Eyes Care - System Architecture

## Overview
**Eyes Care** is an offline-first Windows 10 & 11 utility engineered for eye protection, screen calibration, break enforcement, focus assistance, and automation.

---

## 1. Process & Runtime Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          EYES CARE Electron Main             │
                    └──────────────────────┬───────────────────────┘
                                           │
        ┌──────────────────┬───────────────┴──────────────┬──────────────────┐
        ▼                  ▼                              ▼                  ▼
 Main UI (730x500)    System Tray              Backend Terminal     Overlays (Break Lock,
 Compact Dashboard    Context Menu             Diagnostic Console   Focus Strip, MagicX)
        │                  │                              ▲                  ▲
        └─────────────┬────┴──────────────────────────────┴──────────────────┘
                      │ Secure IPC (window.eyesCare.*)
                      ▼
      ┌──────────────────────────────────────────────────────────────┐
      │                 Eyes Care Backend Manager                    │
      │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
      │  │ DisplayEngine│ │ BreakEngine  │ │ TimerEngine (Custom) │  │
      │  ├──────────────┤ ├──────────────┤ ├──────────────────────┤  │
      │  │SchedulerEng. │ │ RuleEngine   │ │ Focus & MagicX Eng.  │  │
      │  ├──────────────┤ ├──────────────┤ ├──────────────────────┤  │
      │  │ AutomationEng│ │ HotkeyEngine │ │ NotificationEngine   │  │
      │  ├──────────────┴─┴──────────────┴─┴──────────────────────┤  │
      │  │ Watchdog Engine  │  Central EventBus  │  File Logger   │  │
      │  └────────────────────────────────────────────────────────┘  │
      └──────────────────────────────┬───────────────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
           SQLite Database (sql.js)      Windows Native Integration Layer
           Local persistent config,      - GDI SetDeviceGammaRamp (Color Temp)
           profiles, schedules, logs     - WmiSetBrightness / DDC-CI (Brightness)
                                         - GetLastInputInfo (Smart Pause)
                                         - Process Polling (App Rules)
```

---

## 2. Core Subsystems

### A. Display Engine & Native Calibration Layer
- **Color Temperature (1000K–10000K)**: Converts Kelvin values using the Tanner Helland algorithm into RGB scaling curves, then applies a 256-entry 16-bit gamma ramp via Windows GDI `SetDeviceGammaRamp`.
- **Brightness (0%–100%)**: Multi-layer approach using WMI `WmiMonitorBrightnessMethods.WmiSetBrightness` when hardware-supported, combined with gamma scale multipliers.
- **Profiles**: 8 default presets (Pause, Health, Office, Reading, Game, Movie, Editing, Custom) with smooth easing transitions.

### B. Break Management Engine
- **Timestamp-Based Math**: Calculates remaining time via `targetTimestamp - currentTimestamp` to guarantee accuracy across system sleep, clock adjustments, and window minimize.
- **Smart Pause**: Queries `user32.dll` `GetLastInputInfo` to measure user inactivity across Windows without intercepting keyboard or mouse content.
- **Full-Screen Lock**: Multi-monitor non-intrusive full-screen overlay showing remaining rest time and ophthalmology-backed eye relaxation prompts.

### C. Advanced Schedulers & Priority Engine
- **Conflict Resolution**:
  1. Manual / Emergency Override
  2. Application-Specific Rule
  3. User Schedule
  4. Auto Day/Night Transition
  5. Default Profile

### D. Background Watchdog & Diagnostics Terminal
- Dedicated 900×550 diagnostic console with real-time log streaming (INFO, SUCCESS, WARN, ERROR, DEBUG), log rotation in `%LOCALAPPDATA%\Eyes Care\logs\`, and component health indicators.
