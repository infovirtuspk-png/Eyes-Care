const db = require('../database/database-manager');
const eventBus = require('./event-bus');
const logger = require('./logger');
const processMonitor = require('../native/windows/process-monitor');

class RuleEngine {
  constructor() {
    this.displayEngineRef = null;
    this.checkInterval = null;
    this.currentMatchedRule = null;
    this.lastForegroundProcess = '';
  }

  setReferences(displayEng) {
    this.displayEngineRef = displayEng;
  }

  async initialize() {
    this.startProcessMonitoring();
    logger.success('RULES', 'Application RuleEngine initialized (monitors active Windows apps)');
  }

  startProcessMonitoring() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    // Check foreground process every 3 seconds
    this.checkInterval = setInterval(() => this.checkActiveProcess(), 3000);
  }

  async checkActiveProcess() {
    if (!this.displayEngineRef) return;

    try {
      const activeProcess = await processMonitor.getForegroundProcess();
      if (!activeProcess || activeProcess === this.lastForegroundProcess) return;
      this.lastForegroundProcess = activeProcess;

      const rules = await db.getAppRules();
      const matched = rules.find(r => {
        if (!r.enabled) return false;
        const targetExe = (r.executable_name || '').toLowerCase().trim();
        return targetExe && activeProcess.includes(targetExe);
      });

      if (matched) {
        if (!this.currentMatchedRule || this.currentMatchedRule.id !== matched.id) {
          this.currentMatchedRule = matched;
          logger.info('RULES', `Application Rule Matched: '${matched.app_name}' (${activeProcess}) -> Profile '${matched.profile_name}'`);
          await this.displayEngineRef.applyProfile(matched.profile_name);
          eventBus.emit(eventBus.constructor.EVENTS.APPLICATION_RULE_TRIGGERED, {
            rule: matched,
            process: activeProcess
          });
        }
      } else {
        if (this.currentMatchedRule) {
          logger.info('RULES', `Application '${this.currentMatchedRule.app_name}' exited foreground. Releasing rule override.`);
          this.currentMatchedRule = null;
        }
      }
    } catch (err) {
      logger.error('RULES', 'Error checking active process: ' + err.message);
    }
  }
}

module.exports = new RuleEngine();
