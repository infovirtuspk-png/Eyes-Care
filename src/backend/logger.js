const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');
const eventBus = require('./event-bus');

class Logger {
  constructor() {
    this.logsDir = null;
    this.logFiles = {
      app: 'app.log',
      backend: 'backend.log',
      display: 'display.log',
      timer: 'timer.log',
      automation: 'automation.log',
      native: 'native.log',
      error: 'error.log'
    };
    this.memoryLogs = [];
    this.maxMemoryLogs = 2000;
    this.maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB per file
  }

  initialize() {
    try {
      const baseDir = app ? app.getPath('userData') : path.join(os.homedir(), 'AppData', 'Local', 'Eyes Care');
      this.logsDir = path.join(baseDir, 'logs');
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to init logs directory:', err);
    }
  }

  getTimestamp() {
    const d = new Date();
    return d.toTimeString().split(' ')[0]; // HH:MM:SS
  }

  getFullTimestamp() {
    return new Date().toISOString();
  }

  log(level, category, message, data = null) {
    const time = this.getTimestamp();
    const fullTime = this.getFullTimestamp();
    const logObj = {
      timestamp: time,
      fullTimestamp: fullTime,
      level: level.toUpperCase(),
      category: category.toUpperCase(),
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      data: data ? (typeof data === 'object' ? JSON.stringify(data) : String(data)) : null
    };

    // Keep in memory buffer for real-time terminal & queries
    this.memoryLogs.push(logObj);
    if (this.memoryLogs.length > this.maxMemoryLogs) {
      this.memoryLogs.shift();
    }

    // Write to disk asynchronously
    this.writeToFile(category.toLowerCase(), logObj);
    if (logObj.level === 'ERROR') {
      this.writeToFile('error', logObj);
    }

    // Console output for dev debugging
    const colorCode = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      DEBUG: '\x1b[90m'
    }[logObj.level] || '\x1b[0m';
    console.log(`[${time}] ${colorCode}${logObj.level}\x1b[0m [${logObj.category}] ${logObj.message}`);

    // Broadcast to real-time event bus
    eventBus.emit('LOG_ENTRY', logObj);
  }

  info(category, message, data) { this.log('INFO', category, message, data); }
  success(category, message, data) { this.log('SUCCESS', category, message, data); }
  warn(category, message, data) { this.log('WARN', category, message, data); }
  error(category, message, data) { this.log('ERROR', category, message, data); }
  debug(category, message, data) { this.log('DEBUG', category, message, data); }

  writeToFile(category, logObj) {
    if (!this.logsDir) return;
    const filename = this.logFiles[category] || this.logFiles.app;
    const filePath = path.join(this.logsDir, filename);
    const line = `[${logObj.fullTimestamp}] [${logObj.level}] [${logObj.category}] ${logObj.message} ${logObj.data ? ' | ' + logObj.data : ''}\n`;

    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxFileSizeBytes) {
          // Rotate
          const oldPath = filePath + '.old';
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          fs.renameSync(filePath, oldPath);
        }
      }
      fs.appendFileSync(filePath, line, 'utf8');
    } catch (err) {
      console.error('File log write error:', err);
    }
  }

  getRecentLogs(limit = 200, filterLevel = null) {
    let list = this.memoryLogs;
    if (filterLevel && filterLevel !== 'ALL') {
      list = list.filter(l => l.level === filterLevel);
    }
    return list.slice(-limit);
  }

  clearMemoryLogs() {
    this.memoryLogs = [];
    return true;
  }

  getLogsDirectory() {
    return this.logsDir;
  }
}

module.exports = new Logger();
