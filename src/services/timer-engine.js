// Timer Engine - Handles break timing and smart pause detection
class TimerEngine {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.timerInterval = null;
    this.isRunning = false;
    this.isPaused = false;
    this.remainingTime = 0;
    this.workDuration = 20 * 60; // 20 minutes
    this.breakDuration = 20; // 20 seconds
    this.lastActivityTime = Date.now();
    this.inactivityThreshold = 60 * 1000; // 60 seconds
    this.smartPauseEnabled = true;
  }

  async initialize() {
    await this.loadSettings();
    this.setupActivityTracking();
  }

  async loadSettings() {
    try {
      const breakSettings = await this.databaseManager.getBreakSettings();
      if (breakSettings) {
        this.workDuration = breakSettings.work_minutes * 60;
        this.breakDuration = breakSettings.short_break_seconds;
        this.smartPauseEnabled = breakSettings.smart_pause === 1;
        this.inactivityThreshold = breakSettings.pause_after_inactivity * 1000;
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    }
  }

  setupActivityTracking() {
    // Track user activity for smart pause
    if (typeof document !== 'undefined') {
      document.addEventListener('mousemove', () => this.recordActivity());
      document.addEventListener('keydown', () => this.recordActivity());
      document.addEventListener('mousedown', () => this.recordActivity());
    }
  }

  recordActivity() {
    this.lastActivityTime = Date.now();
  }

  checkInactivity() {
    if (!this.smartPauseEnabled || !this.isRunning || this.isPaused) {
      return;
    }

    const inactiveTime = Date.now() - this.lastActivityTime;
    if (inactiveTime > this.inactivityThreshold) {
      this.pause();
      console.log('Timer paused due to inactivity');
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.remainingTime = this.workDuration;
    this.lastActivityTime = Date.now();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    // Check inactivity every 5 seconds
    this.inactivityInterval = setInterval(() => {
      this.checkInactivity();
    }, 5000);
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    clearInterval(this.timerInterval);
    clearInterval(this.inactivityInterval);
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.lastActivityTime = Date.now();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    this.inactivityInterval = setInterval(() => {
      this.checkInactivity();
    }, 5000);
  }

  stop() {
    clearInterval(this.timerInterval);
    clearInterval(this.inactivityInterval);
    this.isRunning = false;
    this.isPaused = false;
    this.remainingTime = 0;
  }

  tick() {
    if (this.remainingTime > 0) {
      this.remainingTime--;
      this.emit('tick', this.remainingTime);
    } else {
      this.timerComplete();
    }
  }

  timerComplete() {
    this.stop();
    this.emit('complete');
  }

  getTimeRemaining() {
    return this.remainingTime;
  }

  getFormattedTime() {
    const hours = Math.floor(this.remainingTime / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = this.remainingTime % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  isTimerRunning() {
    return this.isRunning && !this.isPaused;
  }

  // Simple event emitter
  on(event, callback) {
    if (!this.events) this.events = {};
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (!this.events || !this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

module.exports = TimerEngine;
