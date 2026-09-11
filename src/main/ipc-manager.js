const { ipcMain, shell } = require('electron');
const db = require('../database/database-manager');
const displayEngine = require('../backend/display-engine');
const breakEngine = require('../backend/break-engine');
const userTimerEngine = require('../backend/timer-engine');
const schedulerEngine = require('../backend/scheduler-engine');
const ruleEngine = require('../backend/rule-engine');
const focusEngine = require('../backend/focus-engine');
const magicXEngine = require('../backend/magicx-engine');
const hotkeyEngine = require('../backend/hotkey-engine');
const backendManager = require('../backend/backend-manager');
const logger = require('../backend/logger');
const startupManager = require('./startup-manager');

class IPCManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
  }

  setupHandlers() {
    // Window management
    ipcMain.handle('window:minimize', () => {
      const win = this.windowManager.getMainWindow();
      if (win) win.minimize();
    });

    ipcMain.handle('window:close', () => {
      const win = this.windowManager.getMainWindow();
      if (win) win.hide();
    });

    ipcMain.handle('window:openTerminal', () => {
      this.windowManager.createTerminalWindow();
    });

    // Display
    ipcMain.handle('display:getMonitors', async () => {
      return displayEngine.getMonitors();
    });

    ipcMain.handle('display:getCapabilities', async () => {
      return displayEngine.getMonitorCapabilities();
    });

    ipcMain.handle('display:getSettings', async () => {
      return {
        brightness: displayEngine.getBrightness(),
        temperature: displayEngine.getTemperature(),
        profile: displayEngine.getCurrentProfile(),
        autoDayNight: displayEngine.autoDayNight
      };
    });

    ipcMain.handle('display:setBrightness', async (event, val) => {
      return await displayEngine.setBrightness(val);
    });

    ipcMain.handle('display:setTemperature', async (event, val) => {
      return await displayEngine.setTemperature(val);
    });

    ipcMain.handle('display:applyProfile', async (event, profileName) => {
      return await displayEngine.applyProfile(profileName);
    });

    ipcMain.handle('display:reset', async () => {
      return await displayEngine.resetDisplay();
    });

    ipcMain.handle('display:getProfiles', async () => {
      return await db.getProfiles();
    });

    ipcMain.handle('display:saveProfile', async (event, profile) => {
      await db.saveProfile(profile);
      return { success: true };
    });

    // Day/Night
    ipcMain.handle('dayNight:getSettings', async () => {
      return await db.getDayNightSettings();
    });

    ipcMain.handle('dayNight:saveSettings', async (event, settings) => {
      await db.saveDayNightSettings(settings);
      displayEngine.autoDayNight = settings.enabled === 1;
      await schedulerEngine.evaluateSchedules();
      return { success: true };
    });

    // Schedules
    ipcMain.handle('schedules:get', async () => {
      return await db.getSchedules();
    });

    ipcMain.handle('schedules:save', async (event, schedule) => {
      await db.saveSchedule(schedule);
      await schedulerEngine.evaluateSchedules();
      return { success: true };
    });

    ipcMain.handle('schedules:delete', async (event, id) => {
      await db.deleteSchedule(id);
      return { success: true };
    });

    // Break
    ipcMain.handle('break:getStatus', async () => {
      return breakEngine.getStatus();
    });

    ipcMain.handle('break:getSettings', async () => {
      return await db.getBreakSettings();
    });

    ipcMain.handle('break:saveSettings', async (event, settings) => {
      await db.saveBreakSettings(settings);
      await breakEngine.loadSettings();
      return { success: true };
    });

    ipcMain.handle('break:start', () => {
      breakEngine.startWorkTimer();
      return { success: true };
    });

    ipcMain.handle('break:pause', () => {
      breakEngine.pause();
      return { success: true };
    });

    ipcMain.handle('break:resume', () => {
      breakEngine.resume();
      return { success: true };
    });

    ipcMain.handle('break:takeNow', () => {
      breakEngine.takeBreakNow();
      return { success: true };
    });

    ipcMain.handle('break:skip', () => {
      breakEngine.skipBreak();
      return { success: true };
    });

    ipcMain.handle('break:reset', () => {
      breakEngine.resetTimer();
      return { success: true };
    });

    // User Timers
    ipcMain.handle('timer:getStatus', async () => {
      return userTimerEngine.getStatus();
    });

    ipcMain.handle('timer:getTimers', async () => {
      return await db.getTimers();
    });

    ipcMain.handle('timer:saveTimer', async (event, timer) => {
      await db.saveTimer(timer);
      return { success: true };
    });

    ipcMain.handle('timer:deleteTimer', async (event, id) => {
      await db.deleteTimer(id);
      return { success: true };
    });

    ipcMain.handle('timer:start', (event, config) => {
      userTimerEngine.startTimer(config);
      return { success: true };
    });

    ipcMain.handle('timer:pause', () => {
      userTimerEngine.pause();
      return { success: true };
    });

    ipcMain.handle('timer:resume', () => {
      userTimerEngine.resume();
      return { success: true };
    });

    ipcMain.handle('timer:stop', () => {
      userTimerEngine.stopTimer();
      return { success: true };
    });

    // App Rules
    ipcMain.handle('rules:get', async () => {
      return await db.getAppRules();
    });

    ipcMain.handle('rules:save', async (event, rule) => {
      await db.saveAppRule(rule);
      return { success: true };
    });

    ipcMain.handle('rules:delete', async (event, id) => {
      await db.deleteAppRule(id);
      return { success: true };
    });

    // Focus Tool
    ipcMain.handle('focus:getSettings', async () => {
      return await db.getFocusSettings();
    });

    ipcMain.handle('focus:enable', () => {
      focusEngine.enableFocus();
      return { success: true };
    });

    ipcMain.handle('focus:disable', () => {
      focusEngine.disableFocus();
      return { success: true };
    });

    ipcMain.handle('focus:toggle', () => {
      focusEngine.toggleFocus();
      return { success: true };
    });

    ipcMain.handle('focus:setMode', (event, mode) => {
      focusEngine.setMode(mode);
      return { success: true };
    });

    ipcMain.handle('focus:updateParams', (event, params) => {
      focusEngine.updateParameters(params);
      return { success: true };
    });

    // MagicX Tool
    ipcMain.handle('magicx:getSettings', async () => {
      return await db.getMagicXSettings();
    });

    ipcMain.handle('magicx:toggle', () => {
      magicXEngine.toggleToolbar();
      return { success: true };
    });

    ipcMain.handle('magicx:setFilter', (event, filter) => {
      magicXEngine.setFilter(filter);
      return { success: true };
    });

    // Hotkeys
    ipcMain.handle('hotkeys:get', async () => {
      return await db.getHotkeys();
    });

    ipcMain.handle('hotkeys:save', async (event, hotkey) => {
      await db.saveHotkey(hotkey);
      await hotkeyEngine.registerAllShortcuts();
      return { success: true };
    });

    // General Settings
    ipcMain.handle('settings:getGeneral', async () => {
      return await db.getGeneralSettings();
    });

    ipcMain.handle('settings:saveGeneral', async (event, settings) => {
      for (const [k, v] of Object.entries(settings)) {
        await db.saveAppSetting(k, v);
      }
      if (settings.start_with_windows !== undefined) {
        startupManager.setStartup(settings.start_with_windows === '1');
      }
      return { success: true };
    });

    ipcMain.handle('settings:export', async () => {
      return await db.exportAllSettings();
    });

    ipcMain.handle('settings:import', async (event, jsonStr) => {
      return await db.importAllSettings(jsonStr);
    });

    ipcMain.handle('settings:reset', async () => {
      await db.resetAllSettings();
      await displayEngine.resetDisplay();
      return { success: true };
    });

    // Backend Diagnostics & Logs
    ipcMain.handle('backend:getStatus', async () => {
      return backendManager.getSystemStatus();
    });

    ipcMain.handle('backend:getLogs', async (event, { limit, level }) => {
      return logger.getRecentLogs(limit, level);
    });

    ipcMain.handle('backend:clearLogs', async () => {
      return logger.clearMemoryLogs();
    });

    ipcMain.handle('backend:openLogsDir', async () => {
      const dir = logger.getLogsDirectory();
      if (dir) shell.openPath(dir);
      return { success: true };
    });

    // Activation
    ipcMain.handle('activation:getStatus', async () => {
      return await db.checkTrialStatus();
    });

    ipcMain.handle('activation:activate', async (event, licenseKey) => {
      return await db.activateLicense(licenseKey);
    });
  }
}

module.exports = IPCManager;
