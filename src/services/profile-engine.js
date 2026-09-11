// Profile Engine - Manages display profiles and application rules
class ProfileEngine {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.currentProfile = null;
    this.appRules = [];
  }

  async initialize() {
    await this.loadProfiles();
    await this.loadAppRules();
  }

  async loadProfiles() {
    try {
      this.profiles = await this.databaseManager.getProfiles();
      console.log('Profiles loaded:', this.profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      this.profiles = [];
    }
  }

  async loadAppRules() {
    try {
      this.appRules = await this.databaseManager.getAppRules();
      console.log('App rules loaded:', this.appRules);
    } catch (error) {
      console.error('Error loading app rules:', error);
      this.appRules = [];
    }
  }

  async getProfile(profileId) {
    try {
      return await this.databaseManager.getProfile(profileId);
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  async getProfileByName(name) {
    try {
      return await this.databaseManager.getProfileByName(name);
    } catch (error) {
      console.error('Error getting profile by name:', error);
      return null;
    }
  }

  async applyProfile(profileName) {
    const profile = await this.getProfileByName(profileName);
    if (profile) {
      this.currentProfile = profile;
      return profile;
    }
    return null;
  }

  async createProfile(profileData) {
    try {
      await this.databaseManager.saveProfile(profileData);
      await this.loadProfiles();
      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      return false;
    }
  }

  async updateProfile(profileData) {
    try {
      await this.databaseManager.saveProfile(profileData);
      await this.loadProfiles();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  async deleteProfile(profileId) {
    try {
      // This would need to be implemented in the database manager
      console.log('Delete profile:', profileId);
      await this.loadProfiles();
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  async getAppRuleForApp(executablePath) {
    const matchingRule = this.appRules.find(rule => 
      rule.enabled === 1 && 
      rule.executable_path === executablePath
    );
    return matchingRule || null;
  }

  async addAppRule(ruleData) {
    try {
      await this.databaseManager.saveAppRule(ruleData);
      await this.loadAppRules();
      return true;
    } catch (error) {
      console.error('Error adding app rule:', error);
      return false;
    }
  }

  async updateAppRule(ruleData) {
    try {
      await this.databaseManager.saveAppRule(ruleData);
      await this.loadAppRules();
      return true;
    } catch (error) {
      console.error('Error updating app rule:', error);
      return false;
    }
  }

  async deleteAppRule(ruleId) {
    try {
      await this.databaseManager.deleteAppRule(ruleId);
      await this.loadAppRules();
      return true;
    } catch (error) {
      console.error('Error deleting app rule:', error);
      return false;
    }
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  getAllProfiles() {
    return this.profiles;
  }

  getAllAppRules() {
    return this.appRules;
  }
}

module.exports = ProfileEngine;
