const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');
const idleDetector = require('../native/windows/idle-detector');

class BreakEngine {
  constructor() {
    this.enabled = true;
    this.state = 'IDLE'; // IDLE, RUNNING, PAUSED, IN_BREAK
    this.mode = '20-20-20'; // '20-20-20', 'pomodoro', 'standard', 'custom'

    this.workDurationSec = 20 * 60; // 20 min
    this.shortBreakSec = 20; // 20 sec
    this.longBreakSec = 10 * 60; // 10 min
    this.longBreakFrequency = 4;
    this.breakCount = 0;

    this.smartPauseEnabled = true;
    this.inactivityThresholdSec = 60;
    this.enforced = false;
    this.soundEnabled = true;

    this.workRemainingSec = this.workDurationSec;
    this.breakRemainingSec = this.shortBreakSec;
    this.currentBreakTotalSec = this.shortBreakSec;

    this.targetEndTime = null;
    this.timerInterval = null;
    this.idleCheckInterval = null;
    this.isSmartPaused = false;
    this.breakStartTime = null;

    this.windowManagerRef = null;
  }

  setWindowManager(wm) {
    this.windowManagerRef = wm;
  }

  async initialize() {
    await this.loadSettings();
    this.startWorkTimer();
    this.startIdleMonitoring();
    logger.success('BREAK', `BreakEngine initialized in '${this.mode}' mode (${Math.round(this.workDurationSec / 60)}m work / ${this.shortBreakSec}s break)`);
  }

  async loadSettings() {
    try {
      const s = await db.getBreakSettings();
      if (s) {
        this.enabled = s.enabled === 1;
        this.mode = s.profile || '20-20-20';
        this.workDurationSec = (s.work_minutes || 20) * 60;
        this.shortBreakSec = s.short_break_seconds || 20;
        this.longBreakSec = (s.long_break_minutes || 10) * 60;
        this.longBreakFrequency = s.long_break_frequency || 4;
        this.smartPauseEnabled = s.smart_pause === 1;
        this.inactivityThresholdSec = s.pause_after_inactivity || 60;
        this.enforced = s.enforced === 1;
        this.soundEnabled = s.sound_enabled === 1;
        this.workRemainingSec = this.workDurationSec;
      }
    } catch (err) {
      logger.error('BREAK', 'Error loading break settings: ' + err.message);
    }
  }

  startWorkTimer() {
    if (!this.enabled) return;
    this.state = 'RUNNING';
    this.targetEndTime = Date.now() + this.workRemainingSec * 1000;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tick(), 1000);

    eventBus.emit(eventBus.constructor.EVENTS.BREAK_STARTED, {
      remaining: this.workRemainingSec,
      total: this.workDurationSec,
      state: this.state
    });
  }

  tick() {
    if (this.state === 'RUNNING') {
      const now = Date.now();
      const remainingMs = this.targetEndTime - now;
      this.workRemainingSec = Math.max(0, Math.round(remainingMs / 1000));

      eventBus.emit(eventBus.constructor.EVENTS.BREAK_TICK, {
        state: this.state,
        workRemaining: this.workRemainingSec,
        workTotal: this.workDurationSec,
        formattedTime: this.formatTime(this.workRemainingSec)
      });

      if (this.workRemainingSec <= 0) {
        this.triggerBreak();
      }
    } else if (this.state === 'IN_BREAK') {
      const now = Date.now();
      const remainingMs = this.targetEndTime - now;
      this.breakRemainingSec = Math.max(0, Math.round(remainingMs / 1000));

      eventBus.emit(eventBus.constructor.EVENTS.BREAK_TICK, {
        state: this.state,
        breakRemaining: this.breakRemainingSec,
        breakTotal: this.currentBreakTotalSec,
        formattedTime: this.formatTime(this.breakRemainingSec)
      });

      if (this.breakRemainingSec <= 0) {
        this.completeBreak();
      }
    }
  }

  startIdleMonitoring() {
    if (this.idleCheckInterval) clearInterval(this.idleCheckInterval);
    this.idleCheckInterval = setInterval(async () => {
      if (!this.smartPauseEnabled || this.state !== 'RUNNING') return;

      const idleSec = await idleDetector.getSystemIdleSeconds();
      if (idleSec >= this.inactivityThresholdSec && !this.isSmartPaused) {
        this.isSmartPaused = true;
        this.pause();
        logger.info('BREAK', `Smart Pause: User inactive for ${idleSec}s. Break timer paused.`);
      } else if (idleSec < 5 && this.isSmartPaused) {
        this.isSmartPaused = false;
        this.resume();
        logger.info('BREAK', 'Smart Pause: User activity detected. Break timer resumed.');
      }
    }, 4000);
  }

  pause() {
    if (this.state !== 'RUNNING') return;
    this.state = 'PAUSED';
    eventBus.emit(eventBus.constructor.EVENTS.BREAK_PAUSED, { remaining: this.workRemainingSec });
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'RUNNING';
    this.targetEndTime = Date.now() + this.workRemainingSec * 1000;
    eventBus.emit(eventBus.constructor.EVENTS.BREAK_RESUMED, { remaining: this.workRemainingSec });
  }

  takeBreakNow() {
    this.triggerBreak();
  }

  triggerBreak() {
    this.breakCount++;
    const isLong = this.breakCount % this.longBreakFrequency === 0;
    const durationSec = isLong ? this.longBreakSec : this.shortBreakSec;

    this.state = 'IN_BREAK';
    this.currentBreakTotalSec = durationSec;
    this.breakRemainingSec = durationSec;
    this.targetEndTime = Date.now() + durationSec * 1000;
    this.breakStartTime = new Date().toISOString();

    logger.info('BREAK', `Break started: ${isLong ? 'Long' : 'Short'} break for ${durationSec}s`);

    // Show Break Lock Screen Window
    if (this.windowManagerRef) {
      this.windowManagerRef.showLockScreen({
        duration: durationSec,
        isLongBreak: isLong,
        enforced: this.enforced,
        soundEnabled: this.soundEnabled
      });
    }

    eventBus.emit(eventBus.constructor.EVENTS.BREAK_STARTED, {
      duration: durationSec,
      isLong: isLong,
      enforced: this.enforced
    });
  }

  completeBreak() {
    const endTime = new Date().toISOString();
    db.logBreak(this.breakStartTime || endTime, endTime, this.currentBreakTotalSec, this.currentBreakTotalSec > 60 ? 'long' : 'short', 0);

    if (this.windowManagerRef) {
      this.windowManagerRef.closeLockScreen();
    }

    logger.success('BREAK', 'Break completed. Resetting work timer.');
    eventBus.emit(eventBus.constructor.EVENTS.BREAK_COMPLETED, {});

    // Reset work timer
    this.workRemainingSec = this.workDurationSec;
    this.startWorkTimer();
  }

  skipBreak() {
    if (this.state !== 'IN_BREAK') return;
    const endTime = new Date().toISOString();
    db.logBreak(this.breakStartTime || endTime, endTime, this.currentBreakTotalSec - this.breakRemainingSec, 'skipped', 1);

    if (this.windowManagerRef) {
      this.windowManagerRef.closeLockScreen();
    }

    logger.info('BREAK', 'Break skipped by user.');
    eventBus.emit(eventBus.constructor.EVENTS.BREAK_SKIPPED, {});

    this.workRemainingSec = this.workDurationSec;
    this.startWorkTimer();
  }

  resetTimer() {
    this.workRemainingSec = this.workDurationSec;
    this.targetEndTime = Date.now() + this.workRemainingSec * 1000;
    this.state = 'RUNNING';
    eventBus.emit(eventBus.constructor.EVENTS.BREAK_TICK, {
      state: this.state,
      workRemaining: this.workRemainingSec,
      workTotal: this.workDurationSec,
      formattedTime: this.formatTime(this.workRemainingSec)
    });
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getStatus() {
    return {
      enabled: this.enabled,
      state: this.state,
      mode: this.mode,
      workRemaining: this.workRemainingSec,
      workTotal: this.workDurationSec,
      breakRemaining: this.breakRemainingSec,
      breakTotal: this.currentBreakTotalSec,
      formattedTime: this.formatTime(this.state === 'IN_BREAK' ? this.breakRemainingSec : this.workRemainingSec),
      enforced: this.enforced,
      breakCount: this.breakCount
    };
  }
}

module.exports = new BreakEngine();
