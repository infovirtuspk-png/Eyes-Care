// Rule Engine - Handles application rule detection and execution
class RuleEngine {
  constructor(profileEngine, displayManager) {
    this.profileEngine = profileEngine;
    this.displayManager = displayManager;
    this.activeRules = new Map();
    this.watchedApps = new Set();
  }

  async initialize() {
    await this.startAppMonitoring();
  }

  async startAppMonitoring() {
    // This would monitor running applications and apply rules
    // For now, this is a placeholder for the native implementation
    console.log('Starting application monitoring...');
    
    // In production, this would use Windows APIs to:
    // 1. Detect application launches
    // 2. Match executable paths against rules
    // 3. Apply corresponding profiles
    // 4. Monitor application focus changes
  }

  async detectApplication(executablePath) {
    const rule = await this.profileEngine.getAppRuleForApp(executablePath);
    if (rule && rule.enabled) {
      await this.applyRule(rule);
    }
  }

  async applyRule(rule) {
    try {
      console.log('Applying rule:', rule.app_name, '->', rule.action);
      
      if (rule.profile_id) {
        const profile = await this.profileEngine.getProfile(rule.profile_id);
        if (profile) {
          await this.displayManager.applyProfile('default', {
            brightness: profile.brightness,
            temperature: profile.temperature
          });
        }
      }

      this.activeRules.set(rule.app_name, rule);
    } catch (error) {
      console.error('Error applying rule:', error);
    }
  }

  async removeRule(appName) {
    this.activeRules.delete(appName);
    console.log('Rule removed for:', appName);
  }

  getActiveRules() {
    return Array.from(this.activeRules.values());
  }

  isRuleActive(appName) {
    return this.activeRules.has(appName);
  }
}

module.exports = RuleEngine;
