const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');

class SchedulerEngine {
  constructor() {
    this.displayEngineRef = null;
    this.checkInterval = null;
    this.currentActiveSchedule = null;
    this.isNightModeActive = false;
  }

  setReferences(displayEng) {
    this.displayEngineRef = displayEng;
  }

  async initialize() {
    this.startEvaluationLoop();
    logger.success('SCHEDULER', 'SchedulerEngine initialized (Auto Day/Night & Multi-schedule monitor)');
  }

  startEvaluationLoop() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    // Evaluate every 20 seconds
    this.checkInterval = setInterval(() => this.evaluateSchedules(), 20000);
    // Initial evaluation
    this.evaluateSchedules();
  }

  async evaluateSchedules() {
    if (!this.displayEngineRef) return;

    try {
      const dayNight = await db.getDayNightSettings();
      const schedules = await db.getSchedules();

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const currentDay = dayNames[now.getDay()];

      // 1. Check user custom schedules first (sorted by priority DESC)
      const activeUserSchedule = schedules.find(s => {
        if (!s.enabled) return false;
        const days = (s.days || '').toLowerCase().split(',').map(d => d.trim());
        if (!days.includes(currentDay)) return false;

        return this.isTimeInRange(currentTimeStr, s.start_time, s.end_time);
      });

      if (activeUserSchedule) {
        if (!this.currentActiveSchedule || this.currentActiveSchedule.id !== activeUserSchedule.id) {
          this.currentActiveSchedule = activeUserSchedule;
          logger.info('SCHEDULER', `Schedule '${activeUserSchedule.name}' triggered -> ${activeUserSchedule.profile_name} (${activeUserSchedule.temperature}K, ${activeUserSchedule.brightness}%)`);
          await this.displayEngineRef.applyProfile(activeUserSchedule.profile_name);
          eventBus.emit(eventBus.constructor.EVENTS.SCHEDULE_STARTED, { schedule: activeUserSchedule });
        }
        return;
      } else {
        this.currentActiveSchedule = null;
      }

      // 2. Check Auto Day / Night
      if (dayNight && dayNight.enabled === 1) {
        const isNight = this.isTimeInRange(currentTimeStr, dayNight.night_start, dayNight.day_start);

        if (isNight && !this.isNightModeActive) {
          this.isNightModeActive = true;
          logger.info('SCHEDULER', `Auto Day/Night: Night Mode activated (${dayNight.night_temperature}K, ${dayNight.night_brightness}%)`);
          await this.displayEngineRef.applyProfile(dayNight.night_profile);
          eventBus.emit(eventBus.constructor.EVENTS.NIGHT_MODE_STARTED, { mode: 'night' });
        } else if (!isNight && this.isNightModeActive) {
          this.isNightModeActive = false;
          logger.info('SCHEDULER', `Auto Day/Night: Day Mode activated (${dayNight.day_temperature}K, ${dayNight.day_brightness}%)`);
          await this.displayEngineRef.applyProfile(dayNight.day_profile);
          eventBus.emit(eventBus.constructor.EVENTS.DAY_MODE_STARTED, { mode: 'day' });
        }
      }
    } catch (err) {
      logger.error('SCHEDULER', 'Error evaluating schedules: ' + err.message);
    }
  }

  isTimeInRange(current, start, end) {
    if (!start || !end) return false;
    // Handle wrap-around midnight (e.g. 20:00 to 07:00)
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  }
}

module.exports = new SchedulerEngine();
