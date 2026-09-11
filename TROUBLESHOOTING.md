# Eyes Care - Troubleshooting Guide

## 1. Diagnostics & Log Files
Eyes Care stores all system logs locally on your machine:
- **Log Folder**: `%LOCALAPPDATA%\Eyes Care\logs\`
  - `app.log` - Application lifecycle and window events
  - `backend.log` - Background service and engine events
  - `display.log` - Display gamma and brightness transactions
  - `timer.log` - Break and timer countdown events
  - `error.log` - Critical subsystem errors

To inspect logs in real time, launch the **Backend Terminal** from the System Tray or titlebar button.

---

## 2. Common Issues and Resolutions

### A. Color Temperature or Brightness Does Not Change on External Monitor
- **Cause**: Some third-party graphics drivers or HDR settings in Windows 11 may override GDI gamma ramps.
- **Resolution**:
  1. Open Windows Settings $\to$ System $\to$ Display $\to$ Turn OFF **Use HDR** if active.
  2. Click **Reset Display** in Eyes Care.
  3. Verify in Backend Terminal that `GDI SetDeviceGammaRamp` returned `SUCCESS`.

### B. Break Screen Lock Does Not Appear
- **Resolution**:
  1. Open the **Break** tab in Eyes Care.
  2. Verify that **Break Engine** is active (not paused).
  3. Ensure **Smart Inactivity Pause** threshold is set appropriately.

### C. Application Minimizes Instead of Quitting
- **Note**: This is intentional! Eyes Care is designed as a background utility that manages your eye health throughout the workday.
- To fully exit, right-click the Eyes Care icon in your Windows System Tray and select **Exit Eyes Care**.

---

## 3. Safe Mode Recovery
If a crash occurs repeatedly, the Watchdog will automatically boot Eyes Care in **Safe Mode**.
In Safe Mode:
- Native display modifications are temporarily held at neutral 6500K / 100%.
- SQLite database, options, and diagnostic tools remain fully interactive so you can restore or reset configurations.
