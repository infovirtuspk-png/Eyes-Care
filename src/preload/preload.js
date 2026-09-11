const { contextBridge, ipcRenderer } = require('electron');

/**
 * Secure Preload Bridge for Eyes Care
 * Exposes strictly typed and allowlisted APIs to renderer context
 */
contextBridge.exposeInMainWorld('eyesCare', {
  // Window
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    openTerminal: () => ipcRenderer.invoke('window:openTerminal')
  },

  // Display Module
  display: {
    getMonitors: () => ipcRenderer.invoke('display:getMonitors'),
    getCapabilities: () => ipcRenderer.invoke('display:getCapabilities'),
    getSettings: () => ipcRenderer.invoke('display:getSettings'),
    setBrightness: (val) => ipcRenderer.invoke('display:setBrightness', val),
    setTemperature: (val) => ipcRenderer.invoke('display:setTemperature', val),
    applyProfile: (name) => ipcRenderer.invoke('display:applyProfile', name),
    reset: () => ipcRenderer.invoke('display:reset'),
    getProfiles: () => ipcRenderer.invoke('display:getProfiles'),
    saveProfile: (p) => ipcRenderer.invoke('display:saveProfile', p),
    onChanged: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('event:display-changed', handler);
      return () => ipcRenderer.removeListener('event:display-changed', handler);
    }
  },

  // Auto Day/Night
  dayNight: {
    getSettings: () => ipcRenderer.invoke('dayNight:getSettings'),
    saveSettings: (s) => ipcRenderer.invoke('dayNight:saveSettings', s)
  },

  // Schedules
  schedules: {
    get: () => ipcRenderer.invoke('schedules:get'),
    save: (s) => ipcRenderer.invoke('schedules:save', s),
    delete: (id) => ipcRenderer.invoke('schedules:delete', id)
  },

  // Break Engine
  break: {
    getStatus: () => ipcRenderer.invoke('break:getStatus'),
    getSettings: () => ipcRenderer.invoke('break:getSettings'),
    saveSettings: (s) => ipcRenderer.invoke('break:saveSettings', s),
    start: () => ipcRenderer.invoke('break:start'),
    pause: () => ipcRenderer.invoke('break:pause'),
    resume: () => ipcRenderer.invoke('break:resume'),
    takeNow: () => ipcRenderer.invoke('break:takeNow'),
    skip: () => ipcRenderer.invoke('break:skip'),
    reset: () => ipcRenderer.invoke('break:reset'),
    onTick: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('event:break-tick', handler);
      return () => ipcRenderer.removeListener('event:break-tick', handler);
    }
  },

  // User Timers
  timer: {
    getStatus: () => ipcRenderer.invoke('timer:getStatus'),
    getTimers: () => ipcRenderer.invoke('timer:getTimers'),
    saveTimer: (t) => ipcRenderer.invoke('timer:saveTimer', t),
    deleteTimer: (id) => ipcRenderer.invoke('timer:deleteTimer', id),
    start: (cfg) => ipcRenderer.invoke('timer:start', cfg),
    pause: () => ipcRenderer.invoke('timer:pause'),
    resume: () => ipcRenderer.invoke('timer:resume'),
    stop: () => ipcRenderer.invoke('timer:stop'),
    onTick: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('event:timer-tick', handler);
      return () => ipcRenderer.removeListener('event:timer-tick', handler);
    }
  },

  // Application Rules
  rules: {
    get: () => ipcRenderer.invoke('rules:get'),
    save: (r) => ipcRenderer.invoke('rules:save', r),
    delete: (id) => ipcRenderer.invoke('rules:delete', id)
  },

  // Focus Tools
  focus: {
    getSettings: () => ipcRenderer.invoke('focus:getSettings'),
    enable: () => ipcRenderer.invoke('focus:enable'),
    disable: () => ipcRenderer.invoke('focus:disable'),
    toggle: () => ipcRenderer.invoke('focus:toggle'),
    setMode: (m) => ipcRenderer.invoke('focus:setMode', m),
    updateParams: (p) => ipcRenderer.invoke('focus:updateParams', p),
    onUpdate: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('focus-update', handler);
      return () => ipcRenderer.removeListener('focus-update', handler);
    }
  },

  // MagicX Tools
  magicx: {
    getSettings: () => ipcRenderer.invoke('magicx:getSettings'),
    toggle: () => ipcRenderer.invoke('magicx:toggle'),
    setFilter: (f) => ipcRenderer.invoke('magicx:setFilter', f),
    onInit: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('magicx-init', handler);
      return () => ipcRenderer.removeListener('magicx-init', handler);
    },
    onFilter: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('magicx-filter', handler);
      return () => ipcRenderer.removeListener('magicx-filter', handler);
    }
  },

  // Global Hotkeys
  hotkeys: {
    get: () => ipcRenderer.invoke('hotkeys:get'),
    save: (h) => ipcRenderer.invoke('hotkeys:save', h)
  },

  // General Settings & Backup/Restore
  settings: {
    getGeneral: () => ipcRenderer.invoke('settings:getGeneral'),
    saveGeneral: (s) => ipcRenderer.invoke('settings:saveGeneral', s),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (json) => ipcRenderer.invoke('settings:import', json),
    reset: () => ipcRenderer.invoke('settings:reset')
  },

  // Backend Diagnostic & Terminal
  backend: {
    getStatus: () => ipcRenderer.invoke('backend:getStatus'),
    getLogs: (opts) => ipcRenderer.invoke('backend:getLogs', opts || {}),
    clearLogs: () => ipcRenderer.invoke('backend:clearLogs'),
    openLogsDir: () => ipcRenderer.invoke('backend:openLogsDir'),
    onLog: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('terminal:log', handler);
      return () => ipcRenderer.removeListener('terminal:log', handler);
    }
  },

  // Offline Activation
  activation: {
    getStatus: () => ipcRenderer.invoke('activation:getStatus'),
    activate: (key) => ipcRenderer.invoke('activation:activate', key)
  },

  // Lock Screen Window hooks
  lockScreen: {
    onInit: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('lock-screen-init', handler);
      return () => ipcRenderer.removeListener('lock-screen-init', handler);
    },
    onTick: (cb) => {
      const handler = (event, data) => cb(data);
      ipcRenderer.on('lock-screen-tick', handler);
      return () => ipcRenderer.removeListener('lock-screen-tick', handler);
    },
    skip: () => ipcRenderer.invoke('break:skip')
  }
});
