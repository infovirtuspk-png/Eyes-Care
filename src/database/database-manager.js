// Polyfill node: protocol for older Node/Electron runtimes
const Module = require('module');
if (Module && Module._resolveFilename) {
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (typeof request === 'string' && request.startsWith('node:')) {
      request = request.slice(5);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
}

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { app } = require('electron');
const logger = require('../backend/logger');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.SQL = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const sqlDir = path.dirname(require.resolve('sql.js'));
      let wasmPath = path.join(sqlDir, 'sql-wasm.wasm');
      if (!fs.existsSync(wasmPath)) {
        wasmPath = wasmPath.replace('app.asar', 'app.asar.unpacked');
      }
      const wasmBinary = fs.existsSync(wasmPath) ? fs.readFileSync(wasmPath) : undefined;

      this.SQL = await initSqlJs({
        locateFile: file => {
          let target = path.join(sqlDir, file);
          if (!fs.existsSync(target)) {
            target = target.replace('app.asar', 'app.asar.unpacked');
          }
          return target;
        },
        wasmBinary: wasmBinary
      });
      const userDataDir = app ? app.getPath('userData') : path.join(os.homedir(), 'AppData', 'Local', 'Eyes Care');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      this.dbPath = path.join(userDataDir, 'eyescare.db');

      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(fileBuffer);
        this.runMigrations();
      } else {
        this.db = new this.SQL.Database();
        this.createTables();
        this.insertDefaultData();
        this.saveDatabase();
      }

      this.isInitialized = true;
      logger.success('DATABASE', 'SQLite database initialized successfully at ' + this.dbPath);
    } catch (error) {
      logger.error('DATABASE', 'Failed to initialize SQLite database: ' + error.message);
      throw error;
    }
  }

  saveDatabase() {
    try {
      if (!this.db || !this.dbPath) return;
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      logger.error('DATABASE', 'Error saving SQLite database: ' + error.message);
    }
  }

  createTables() {
    // App Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Display Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS display_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        monitor_id TEXT UNIQUE,
        brightness INTEGER DEFAULT 100,
        temperature INTEGER DEFAULT 6500,
        enabled INTEGER DEFAULT 1,
        sync_enabled INTEGER DEFAULT 1,
        auto_day_night INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Preset & Custom Profiles
    this.db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        temperature INTEGER DEFAULT 6500,
        brightness INTEGER DEFAULT 100,
        enabled INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Break Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS break_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER DEFAULT 1,
        work_minutes INTEGER DEFAULT 20,
        short_break_seconds INTEGER DEFAULT 20,
        long_break_minutes INTEGER DEFAULT 10,
        long_break_frequency INTEGER DEFAULT 4,
        smart_pause INTEGER DEFAULT 1,
        pause_after_inactivity INTEGER DEFAULT 60,
        enforced INTEGER DEFAULT 0,
        profile TEXT DEFAULT '20-20-20',
        sound_enabled INTEGER DEFAULT 1,
        sound_volume INTEGER DEFAULT 80,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Break History
    this.db.run(`
      CREATE TABLE IF NOT EXISTS break_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time DATETIME,
        end_time DATETIME,
        duration INTEGER,
        type TEXT,
        skipped INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Timers
    this.db.run(`
      CREATE TABLE IF NOT EXISTS timers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        completion_action TEXT DEFAULT 'notification',
        target_profile TEXT,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Advanced Schedules
    this.db.run(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        days TEXT DEFAULT 'mon,tue,wed,thu,fri',
        profile_name TEXT DEFAULT 'Office',
        brightness INTEGER DEFAULT 90,
        temperature INTEGER DEFAULT 5000,
        priority INTEGER DEFAULT 3,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Day / Night Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS day_night_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER DEFAULT 0,
        mode TEXT DEFAULT 'manual',
        day_start TEXT DEFAULT '07:00',
        night_start TEXT DEFAULT '19:00',
        day_profile TEXT DEFAULT 'Office',
        day_brightness INTEGER DEFAULT 100,
        day_temperature INTEGER DEFAULT 6500,
        night_profile TEXT DEFAULT 'Health',
        night_brightness INTEGER DEFAULT 70,
        night_temperature INTEGER DEFAULT 3500,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Application Rules
    this.db.run(`
      CREATE TABLE IF NOT EXISTS app_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        executable_name TEXT NOT NULL,
        action TEXT DEFAULT 'profile',
        profile_name TEXT DEFAULT 'Reading',
        target_brightness INTEGER DEFAULT 80,
        target_temperature INTEGER DEFAULT 4500,
        priority INTEGER DEFAULT 2,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Hotkeys
    this.db.run(`
      CREATE TABLE IF NOT EXISTS hotkeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT UNIQUE NOT NULL,
        accelerator TEXT,
        enabled INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Focus Tool Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS focus_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER DEFAULT 0,
        mode TEXT DEFAULT 'read',
        focus_size INTEGER DEFAULT 140,
        opacity REAL DEFAULT 0.65,
        blur_strength INTEGER DEFAULT 6,
        dim_strength INTEGER DEFAULT 40,
        animation_speed INTEGER DEFAULT 200,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // MagicX Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS magicx_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enabled INTEGER DEFAULT 0,
        show_toolbar INTEGER DEFAULT 1,
        toolbar_position TEXT DEFAULT 'top-right',
        toolbar_opacity REAL DEFAULT 0.95,
        active_filter TEXT DEFAULT 'none',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Activation & License Settings
    this.db.run(`
      CREATE TABLE IF NOT EXISTS activation_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_key TEXT,
        activated INTEGER DEFAULT 0,
        activation_date DATETIME,
        trial_start_date DATETIME,
        trial_days_used INTEGER DEFAULT 0,
        trial_days_total INTEGER DEFAULT 15,
        is_trial INTEGER DEFAULT 1,
        expired INTEGER DEFAULT 0,
        machine_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  insertDefaultData() {
    // 8 Core Profiles
    const defaultProfiles = [
      { name: 'Pause', temperature: 6500, brightness: 100, is_default: 0, description: 'Eye protection paused (Default Windows Display)' },
      { name: 'Health', temperature: 4000, brightness: 80, is_default: 1, description: 'Comfortable warm tone for long screen sessions' },
      { name: 'Game', temperature: 6000, brightness: 100, is_default: 0, description: 'High contrast and crisp visuals for immersive gaming' },
      { name: 'Movie', temperature: 4500, brightness: 60, is_default: 0, description: 'Warm cinema tint with dimmed backlighting' },
      { name: 'Office', temperature: 5000, brightness: 85, is_default: 0, description: 'Balanced daylight clarity for text, code and sheets' },
      { name: 'Editing', temperature: 6500, brightness: 90, is_default: 0, description: 'True-color 6500K calibration for graphic design and photos' },
      { name: 'Reading', temperature: 3500, brightness: 70, is_default: 0, description: 'Ultra-warm amber filter to eliminate blue light' },
      { name: 'Custom', temperature: 5000, brightness: 100, is_default: 0, description: 'User customized brightness and temperature preset' }
    ];

    for (const p of defaultProfiles) {
      this.db.run(`
        INSERT OR IGNORE INTO profiles (name, temperature, brightness, is_default, description)
        VALUES (?, ?, ?, ?, ?);
      `, [p.name, p.temperature, p.brightness, p.is_default, p.description]);
    }

    // Default Break Settings
    this.db.run(`
      INSERT OR IGNORE INTO break_settings 
      (id, enabled, work_minutes, short_break_seconds, long_break_minutes, long_break_frequency, smart_pause, pause_after_inactivity, enforced, profile, sound_enabled, sound_volume)
      VALUES (1, 1, 20, 20, 10, 4, 1, 60, 0, '20-20-20', 1, 80);
    `);

    // Default Day/Night
    this.db.run(`
      INSERT OR IGNORE INTO day_night_settings 
      (id, enabled, mode, day_start, night_start, day_profile, day_brightness, day_temperature, night_profile, night_brightness, night_temperature)
      VALUES (1, 0, 'manual', '07:00', '19:00', 'Office', 100, 6500, 'Reading', 70, 3500);
    `);

    // Default Focus Settings
    this.db.run(`
      INSERT OR IGNORE INTO focus_settings
      (id, enabled, mode, focus_size, opacity, blur_strength, dim_strength, animation_speed)
      VALUES (1, 0, 'read', 140, 0.65, 6, 40, 200);
    `);

    // Default MagicX Settings
    this.db.run(`
      INSERT OR IGNORE INTO magicx_settings
      (id, enabled, show_toolbar, toolbar_position, toolbar_opacity, active_filter)
      VALUES (1, 0, 1, 'top-right', 0.95, 'none');
    `);

    // Default Display Settings for default monitor
    this.db.run(`
      INSERT OR IGNORE INTO display_settings
      (monitor_id, brightness, temperature, enabled, sync_enabled, auto_day_night)
      VALUES ('MON_1', 100, 6500, 1, 1, 0);
    `);

    // Default App Settings
    const defaultAppSettings = {
      'start_with_windows': '1',
      'start_minimized': '1',
      'close_to_tray': '1',
      'minimize_to_tray': '1',
      'smooth_transition': '1',
      'transition_speed_ms': '1000',
      'reduce_motion': '0',
      'quiet_hours_enabled': '0',
      'quiet_hours_start': '22:00',
      'quiet_hours_end': '07:00',
      'safe_mode': '0'
    };

    for (const [k, v] of Object.entries(defaultAppSettings)) {
      this.db.run(`
        INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?);
      `, [k, v]);
    }

    // Default Hotkeys
    const defaultHotkeys = [
      { action: 'increase_brightness', accelerator: 'Alt+Up' },
      { action: 'decrease_brightness', accelerator: 'Alt+Down' },
      { action: 'increase_temperature', accelerator: 'Alt+Right' },
      { action: 'decrease_temperature', accelerator: 'Alt+Left' },
      { action: 'take_break_now', accelerator: 'Alt+B' },
      { action: 'pause_protection', accelerator: 'Alt+P' },
      { action: 'toggle_focus', accelerator: 'Alt+F' },
      { action: 'toggle_magicx', accelerator: 'Alt+M' },
      { action: 'mode_health', accelerator: 'Alt+1' },
      { action: 'mode_office', accelerator: 'Alt+2' },
      { action: 'mode_reading', accelerator: 'Alt+3' },
      { action: 'mode_game', accelerator: 'Alt+4' }
    ];

    for (const h of defaultHotkeys) {
      this.db.run(`
        INSERT OR IGNORE INTO hotkeys (action, accelerator, enabled)
        VALUES (?, ?, 1);
      `, [h.action, h.accelerator]);
    }

    // Default Application Rules
    const sampleRules = [
      { app_name: 'Google Chrome', executable_name: 'chrome.exe', action: 'profile', profile_name: 'Reading', priority: 2 },
      { app_name: 'Visual Studio Code', executable_name: 'code.exe', action: 'profile', profile_name: 'Office', priority: 2 },
      { app_name: 'Adobe Photoshop', executable_name: 'photoshop.exe', action: 'profile', profile_name: 'Editing', priority: 3 }
    ];

    for (const r of sampleRules) {
      this.db.run(`
        INSERT OR IGNORE INTO app_rules (app_name, executable_name, action, profile_name, priority, enabled)
        VALUES (?, ?, ?, ?, ?, 1);
      `, [r.app_name, r.executable_name, r.action, r.profile_name, r.priority]);
    }

    // Default Schedules
    this.db.run(`
      INSERT OR IGNORE INTO schedules (id, name, start_time, end_time, days, profile_name, brightness, temperature, priority, enabled)
      VALUES (1, 'Office Work Morning', '08:00', '12:00', 'mon,tue,wed,thu,fri', 'Office', 90, 5000, 3, 1);
    `);
    this.db.run(`
      INSERT OR IGNORE INTO schedules (id, name, start_time, end_time, days, profile_name, brightness, temperature, priority, enabled)
      VALUES (2, 'Night Reading Relaxation', '20:00', '23:30', 'mon,tue,wed,thu,fri,sat,sun', 'Reading', 65, 3000, 3, 1);
    `);

    // Default Timers
    this.db.run(`
      INSERT OR IGNORE INTO timers (id, name, duration_seconds, completion_action, target_profile, enabled)
      VALUES (1, 'Deep Focus Session', 1800, 'notification', 'Office', 1);
    `);
    this.db.run(`
      INSERT OR IGNORE INTO timers (id, name, duration_seconds, completion_action, target_profile, enabled)
      VALUES (2, 'Quick Power Sprint', 900, 'break', 'Health', 1);
    `);
  }

  runMigrations() {
    this.createTables();
    this.insertDefaultData();
    this.saveDatabase();
  }

  // SQLite Helper Query Methods
  execQuery(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    } catch (err) {
      logger.error('DATABASE', `Query error: ${err.message}`, { sql, params });
      return null;
    }
  }

  execQueryAll(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const result = [];
      while (stmt.step()) {
        result.push(stmt.getAsObject());
      }
      stmt.free();
      return result;
    } catch (err) {
      logger.error('DATABASE', `QueryAll error: ${err.message}`, { sql, params });
      return [];
    }
  }

  execRun(sql, params = []) {
    try {
      this.db.run(sql, params);
      this.saveDatabase();
      return true;
    } catch (err) {
      logger.error('DATABASE', `Run error: ${err.message}`, { sql, params });
      return false;
    }
  }

  // Settings
  async saveAppSetting(key, value) {
    const existing = this.execQuery('SELECT value FROM app_settings WHERE key = ?', [key]);
    if (existing) {
      this.execRun('UPDATE app_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [String(value), key]);
    } else {
      this.execRun('INSERT INTO app_settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
  }

  async getAppSetting(key, defaultValue = null) {
    const row = this.execQuery('SELECT value FROM app_settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  }

  async getGeneralSettings() {
    const rows = this.execQueryAll('SELECT * FROM app_settings');
    const map = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  }

  // Display Settings
  async saveDisplaySettings(settings) {
    const monId = settings.monitor_id || 'MON_1';
    const existing = this.execQuery('SELECT id FROM display_settings WHERE monitor_id = ?', [monId]);
    if (existing) {
      this.execRun(`
        UPDATE display_settings SET
          brightness = ?, temperature = ?, enabled = ?, sync_enabled = ?, auto_day_night = ?, updated_at = CURRENT_TIMESTAMP
        WHERE monitor_id = ?;
      `, [settings.brightness, settings.temperature, settings.enabled ? 1 : 0, settings.sync_enabled ? 1 : 0, settings.auto_day_night ? 1 : 0, monId]);
    } else {
      this.execRun(`
        INSERT INTO display_settings (monitor_id, brightness, temperature, enabled, sync_enabled, auto_day_night)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [monId, settings.brightness, settings.temperature, settings.enabled ? 1 : 0, settings.sync_enabled ? 1 : 0, settings.auto_day_night ? 1 : 0]);
    }
  }

  async getDisplaySettings() {
    return this.execQueryAll('SELECT * FROM display_settings');
  }

  // Profiles
  async getProfiles() {
    return this.execQueryAll('SELECT * FROM profiles ORDER BY is_default DESC, id ASC');
  }

  async getProfile(profileId) {
    return this.execQuery('SELECT * FROM profiles WHERE id = ?', [profileId]);
  }

  async getProfileByName(name) {
    return this.execQuery('SELECT * FROM profiles WHERE LOWER(name) = LOWER(?)', [name]);
  }

  async saveProfile(profile) {
    const existing = this.execQuery('SELECT id FROM profiles WHERE LOWER(name) = LOWER(?)', [profile.name]);
    if (existing) {
      this.execRun(`
        UPDATE profiles SET
          temperature = ?, brightness = ?, enabled = ?, is_default = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
      `, [profile.temperature, profile.brightness, profile.enabled !== false ? 1 : 0, profile.is_default ? 1 : 0, profile.description || '', existing.id]);
    } else {
      this.execRun(`
        INSERT INTO profiles (name, temperature, brightness, enabled, is_default, description)
        VALUES (?, ?, ?, ?, ?, ?);
      `, [profile.name, profile.temperature, profile.brightness, profile.enabled !== false ? 1 : 0, profile.is_default ? 1 : 0, profile.description || '']);
    }
  }

  // Break Settings
  async getBreakSettings() {
    let row = this.execQuery('SELECT * FROM break_settings WHERE id = 1');
    if (!row) {
      this.insertDefaultData();
      row = this.execQuery('SELECT * FROM break_settings WHERE id = 1');
    }
    return row;
  }

  async saveBreakSettings(settings) {
    this.execRun(`
      UPDATE break_settings SET
        enabled = ?, work_minutes = ?, short_break_seconds = ?, long_break_minutes = ?,
        long_break_frequency = ?, smart_pause = ?, pause_after_inactivity = ?, enforced = ?,
        profile = ?, sound_enabled = ?, sound_volume = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
    `, [
      settings.enabled ? 1 : 0,
      settings.work_minutes || 20,
      settings.short_break_seconds || 20,
      settings.long_break_minutes || 10,
      settings.long_break_frequency || 4,
      settings.smart_pause ? 1 : 0,
      settings.pause_after_inactivity || 60,
      settings.enforced ? 1 : 0,
      settings.profile || '20-20-20',
      settings.sound_enabled ? 1 : 0,
      settings.sound_volume !== undefined ? settings.sound_volume : 80
    ]);
  }

  async logBreak(startTime, endTime, duration, type, skipped = 0) {
    this.execRun(`
      INSERT INTO break_history (start_time, end_time, duration, type, skipped)
      VALUES (?, ?, ?, ?, ?);
    `, [startTime, endTime, duration, type, skipped ? 1 : 0]);
  }

  // Day/Night Settings
  async getDayNightSettings() {
    let row = this.execQuery('SELECT * FROM day_night_settings WHERE id = 1');
    if (!row) {
      this.insertDefaultData();
      row = this.execQuery('SELECT * FROM day_night_settings WHERE id = 1');
    }
    return row;
  }

  async saveDayNightSettings(settings) {
    this.execRun(`
      UPDATE day_night_settings SET
        enabled = ?, mode = ?, day_start = ?, night_start = ?,
        day_profile = ?, day_brightness = ?, day_temperature = ?,
        night_profile = ?, night_brightness = ?, night_temperature = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
    `, [
      settings.enabled ? 1 : 0,
      settings.mode || 'manual',
      settings.day_start || '07:00',
      settings.night_start || '19:00',
      settings.day_profile || 'Office',
      settings.day_brightness || 100,
      settings.day_temperature || 6500,
      settings.night_profile || 'Reading',
      settings.night_brightness || 70,
      settings.night_temperature || 3500
    ]);
  }

  // Schedules
  async getSchedules() {
    return this.execQueryAll('SELECT * FROM schedules ORDER BY priority DESC, id ASC');
  }

  async saveSchedule(schedule) {
    if (schedule.id) {
      this.execRun(`
        UPDATE schedules SET
          name = ?, start_time = ?, end_time = ?, days = ?, profile_name = ?,
          brightness = ?, temperature = ?, priority = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
      `, [schedule.name, schedule.start_time, schedule.end_time, schedule.days, schedule.profile_name,
          schedule.brightness, schedule.temperature, schedule.priority, schedule.enabled ? 1 : 0, schedule.id]);
    } else {
      this.execRun(`
        INSERT INTO schedules (name, start_time, end_time, days, profile_name, brightness, temperature, priority, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [schedule.name, schedule.start_time, schedule.end_time, schedule.days, schedule.profile_name,
          schedule.brightness, schedule.temperature, schedule.priority, schedule.enabled ? 1 : 0]);
    }
  }

  async deleteSchedule(id) {
    this.execRun('DELETE FROM schedules WHERE id = ?', [id]);
  }

  // User Timers
  async getTimers() {
    return this.execQueryAll('SELECT * FROM timers ORDER BY id ASC');
  }

  async saveTimer(timer) {
    if (timer.id) {
      this.execRun(`
        UPDATE timers SET
          name = ?, duration_seconds = ?, completion_action = ?, target_profile = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
      `, [timer.name, timer.duration_seconds, timer.completion_action, timer.target_profile, timer.enabled ? 1 : 0, timer.id]);
    } else {
      this.execRun(`
        INSERT INTO timers (name, duration_seconds, completion_action, target_profile, enabled)
        VALUES (?, ?, ?, ?, ?);
      `, [timer.name, timer.duration_seconds, timer.completion_action, timer.target_profile, timer.enabled ? 1 : 0]);
    }
  }

  async deleteTimer(id) {
    this.execRun('DELETE FROM timers WHERE id = ?', [id]);
  }

  // App Rules
  async getAppRules() {
    return this.execQueryAll('SELECT * FROM app_rules ORDER BY priority DESC, app_name ASC');
  }

  async saveAppRule(rule) {
    if (rule.id) {
      this.execRun(`
        UPDATE app_rules SET
          app_name = ?, executable_name = ?, action = ?, profile_name = ?,
          target_brightness = ?, target_temperature = ?, priority = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
      `, [rule.app_name, rule.executable_name, rule.action, rule.profile_name, rule.target_brightness, rule.target_temperature, rule.priority, rule.enabled ? 1 : 0, rule.id]);
    } else {
      this.execRun(`
        INSERT INTO app_rules (app_name, executable_name, action, profile_name, target_brightness, target_temperature, priority, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `, [rule.app_name, rule.executable_name, rule.action, rule.profile_name, rule.target_brightness, rule.target_temperature, rule.priority, rule.enabled ? 1 : 0]);
    }
  }

  async deleteAppRule(ruleId) {
    this.execRun('DELETE FROM app_rules WHERE id = ?', [ruleId]);
  }

  // Focus Settings
  async getFocusSettings() {
    let row = this.execQuery('SELECT * FROM focus_settings WHERE id = 1');
    if (!row) {
      this.insertDefaultData();
      row = this.execQuery('SELECT * FROM focus_settings WHERE id = 1');
    }
    return row;
  }

  async saveFocusSettings(settings) {
    this.execRun(`
      UPDATE focus_settings SET
        enabled = ?, mode = ?, focus_size = ?, opacity = ?, blur_strength = ?, dim_strength = ?,
        animation_speed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
    `, [
      settings.enabled ? 1 : 0,
      settings.mode || 'read',
      settings.focus_size || 140,
      settings.opacity !== undefined ? settings.opacity : 0.65,
      settings.blur_strength || 6,
      settings.dim_strength || 40,
      settings.animation_speed || 200
    ]);
  }

  // MagicX Settings
  async getMagicXSettings() {
    let row = this.execQuery('SELECT * FROM magicx_settings WHERE id = 1');
    if (!row) {
      this.insertDefaultData();
      row = this.execQuery('SELECT * FROM magicx_settings WHERE id = 1');
    }
    return row;
  }

  async saveMagicXSettings(settings) {
    this.execRun(`
      UPDATE magicx_settings SET
        enabled = ?, show_toolbar = ?, toolbar_position = ?, toolbar_opacity = ?,
        active_filter = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1;
    `, [
      settings.enabled ? 1 : 0,
      settings.show_toolbar ? 1 : 0,
      settings.toolbar_position || 'top-right',
      settings.toolbar_opacity !== undefined ? settings.toolbar_opacity : 0.95,
      settings.active_filter || 'none'
    ]);
  }

  // Hotkeys
  async getHotkeys() {
    return this.execQueryAll('SELECT * FROM hotkeys');
  }

  async saveHotkey(hotkey) {
    const existing = this.execQuery('SELECT id FROM hotkeys WHERE action = ?', [hotkey.action]);
    if (existing) {
      this.execRun(`
        UPDATE hotkeys SET accelerator = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE action = ?;
      `, [hotkey.accelerator, hotkey.enabled ? 1 : 0, hotkey.action]);
    } else {
      this.execRun(`
        INSERT INTO hotkeys (action, accelerator, enabled)
        VALUES (?, ?, ?);
      `, [hotkey.action, hotkey.accelerator, hotkey.enabled ? 1 : 0]);
    }
  }

  // Activation & License
  async getActivationSettings() {
    let row = this.execQuery('SELECT * FROM activation_settings WHERE id = 1');
    if (!row) {
      const now = new Date().toISOString();
      const machId = this.generateMachineId();
      this.execRun(`
        INSERT INTO activation_settings (id, license_key, activated, trial_start_date, trial_days_used, trial_days_total, is_trial, expired, machine_id)
        VALUES (1, NULL, 0, ?, 0, 15, 1, 0, ?);
      `, [now, machId]);
      row = this.execQuery('SELECT * FROM activation_settings WHERE id = 1');
    }
    return row;
  }

  async checkTrialStatus() {
    const settings = await this.getActivationSettings();
    if (!settings) {
      return { is_trial: true, days_remaining: 15, expired: false, activated: false };
    }

    if (settings.activated === 1) {
      return { is_trial: false, days_remaining: 0, expired: false, activated: true, machine_id: settings.machine_id };
    }

    const trialStart = new Date(settings.trial_start_date || new Date().toISOString());
    const now = new Date();
    const daysUsed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, (settings.trial_days_total || 15) - daysUsed);
    const isExpired = daysRemaining <= 0;

    this.execRun(`
      UPDATE activation_settings SET trial_days_used = ?, expired = ? WHERE id = 1;
    `, [daysUsed, isExpired ? 1 : 0]);

    return {
      is_trial: true,
      days_remaining: daysRemaining,
      expired: isExpired,
      activated: false,
      machine_id: settings.machine_id
    };
  }

  async activateLicense(licenseKey) {
    if (!licenseKey || typeof licenseKey !== 'string') {
      return { success: false, message: 'Please enter a valid offline license key' };
    }
    const key = licenseKey.trim().toUpperCase();
    // Offline license validation format: EYES-CARE-PRO-XXXX-XXXX or default master offline keys
    if (key === '@NUTTERTOOLS123' || key.startsWith('EYES-CARE-PRO-') || key === 'EYESCARE-LIFETIME-2026') {
      await this.getActivationSettings();
      const now = new Date().toISOString();
      this.execRun(`
        UPDATE activation_settings SET
          license_key = ?, activated = 1, activation_date = ?, is_trial = 0, expired = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1;
      `, [key, now]);
      logger.success('ACTIVATION', 'Eyes Care successfully activated offline with key ' + key);
      return { success: true, message: 'Eyes Care has been activated successfully!' };
    }
    return { success: false, message: 'Invalid offline license key. Please check and try again.' };
  }

  generateMachineId() {
    const hostname = os.hostname();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'GENERIC_CPU';
    return crypto.createHash('sha256').update(hostname + cpuModel).digest('hex').substring(0, 16).toUpperCase();
  }

  // Backup / Restore JSON
  async exportAllSettings() {
    const tables = [
      'app_settings', 'display_settings', 'profiles', 'break_settings',
      'day_night_settings', 'schedules', 'timers', 'app_rules',
      'hotkeys', 'focus_settings', 'magicx_settings'
    ];
    const data = {
      version: '1.0.0',
      appName: 'Eyes Care',
      exportedAt: new Date().toISOString(),
      data: {}
    };

    for (const t of tables) {
      data.data[t] = this.execQueryAll(`SELECT * FROM ${t}`);
    }

    return JSON.stringify(data, null, 2);
  }

  async importAllSettings(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.data) {
        throw new Error('Invalid Eyes Care settings backup format');
      }

      for (const [table, rows] of Object.entries(parsed.data)) {
        if (Array.isArray(rows) && rows.length > 0) {
          this.execRun(`DELETE FROM ${table}`);
          const cols = Object.keys(rows[0]);
          const placeholders = cols.map(() => '?').join(',');
          const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
          for (const r of rows) {
            this.execRun(sql, cols.map(c => r[c]));
          }
        }
      }
      logger.success('SETTINGS', 'Settings successfully restored from JSON');
      return { success: true };
    } catch (err) {
      logger.error('SETTINGS', 'Import failed: ' + err.message);
      return { success: false, error: err.message };
    }
  }

  async resetAllSettings() {
    const tables = [
      'app_settings', 'display_settings', 'profiles', 'break_settings',
      'break_history', 'day_night_settings', 'schedules', 'timers',
      'app_rules', 'hotkeys', 'focus_settings', 'magicx_settings'
    ];
    for (const t of tables) {
      this.execRun(`DROP TABLE IF EXISTS ${t}`);
    }
    this.createTables();
    this.insertDefaultData();
    this.saveDatabase();
    logger.info('DATABASE', 'Database reset to default settings');
    return true;
  }
}

module.exports = new DatabaseManager();
