const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');

class UserTimerEngine {
  constructor() {
    this.activeTimer = null;
    this.state = 'IDLE'; // IDLE, RUNNING, PAUSED, COMPLETED
    this.remainingSeconds = 0;
    this.totalSeconds = 0;
    this.targetEndTime = null;
    this.timerInterval = null;
    this.displayEngineRef = null;
    this.breakEngineRef = null;
    this.notificationEngineRef = null;
  }

  setReferences(displayEng, breakEng, notifEng) {
    this.displayEngineRef = displayEng;
    this.breakEngineRef = breakEng;
    this.notificationEngineRef = notifEng;
  }

  async initialize() {
    logger.success('TIMER', 'UserTimerEngine initialized (supports unlimited custom timers & presets)');
  }

  startTimer(timerConfig) {
    // timerConfig: { name, durationSeconds, completionAction, targetProfile }
    this.stopTimer();

    this.activeTimer = {
      name: timerConfig.name || 'Custom Timer',
      durationSeconds: timerConfig.durationSeconds || 1800,
      completionAction: timerConfig.completionAction || 'notification',
      targetProfile: timerConfig.targetProfile || null
    };

    this.totalSeconds = this.activeTimer.durationSeconds;
    this.remainingSeconds = this.totalSeconds;
    this.targetEndTime = Date.now() + this.remainingSeconds * 1000;
    this.state = 'RUNNING';

    logger.info('TIMER', `Started User Timer: '${this.activeTimer.name}' (${this.formatTime(this.totalSeconds)})`);

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tick(), 1000);

    eventBus.emit(eventBus.constructor.EVENTS.USER_TIMER_STARTED, {
      name: this.activeTimer.name,
      total: this.totalSeconds,
      remaining: this.remainingSeconds,
      state: this.state
    });
  }

  tick() {
    if (this.state !== 'RUNNING') return;

    const now = Date.now();
    const diffMs = this.targetEndTime - now;
    this.remainingSeconds = Math.max(0, Math.round(diffMs / 1000));

    eventBus.emit(eventBus.constructor.EVENTS.USER_TIMER_TICK, {
      name: this.activeTimer?.name || 'Timer',
      remaining: this.remainingSeconds,
      total: this.totalSeconds,
      formattedTime: this.formatTime(this.remainingSeconds),
      state: this.state
    });

    if (this.remainingSeconds <= 0) {
      this.completeTimer();
    }
  }

  pause() {
    if (this.state !== 'RUNNING') return;
    this.state = 'PAUSED';
    clearInterval(this.timerInterval);
    logger.info('TIMER', `Paused User Timer: '${this.activeTimer?.name}' at ${this.formatTime(this.remainingSeconds)}`);
    eventBus.emit(eventBus.constructor.EVENTS.USER_TIMER_PAUSED, {
      remaining: this.remainingSeconds,
      state: this.state
    });
  }

  resume() {
    if (this.state !== 'PAUSED') return;
    this.state = 'RUNNING';
    this.targetEndTime = Date.now() + this.remainingSeconds * 1000;
    this.timerInterval = setInterval(() => this.tick(), 1000);
    logger.info('TIMER', `Resumed User Timer: '${this.activeTimer?.name}'`);
    eventBus.emit(eventBus.constructor.EVENTS.USER_TIMER_RESUMED, {
      remaining: this.remainingSeconds,
      state: this.state
    });
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.state = 'IDLE';
    this.remainingSeconds = 0;
    this.totalSeconds = 0;
    this.activeTimer = null;
  }

  async completeTimer() {
    const timer = this.activeTimer;
    this.stopTimer();
    this.state = 'COMPLETED';

    logger.success('TIMER', `User Timer Completed: '${timer?.name}'`);

    // Execute Completion Action
    if (timer) {
      if (timer.completionAction === 'notification' && this.notificationEngineRef) {
        this.notificationEngineRef.show(
          'Timer Completed',
          `Your '${timer.name}' timer has finished!`
        );
      } else if (timer.completionAction === 'profile' && timer.targetProfile && this.displayEngineRef) {
        await this.displayEngineRef.applyProfile(timer.targetProfile);
      } else if (timer.completionAction === 'break' && this.breakEngineRef) {
        this.breakEngineRef.takeBreakNow();
      }
    }

    eventBus.emit(eventBus.constructor.EVENTS.USER_TIMER_COMPLETED, {
      name: timer?.name || 'Timer'
    });
  }

  formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getStatus() {
    return {
      activeTimer: this.activeTimer,
      state: this.state,
      remaining: this.remainingSeconds,
      total: this.totalSeconds,
      formattedTime: this.formatTime(this.remainingSeconds)
    };
  }
}

module.exports = new UserTimerEngine();
