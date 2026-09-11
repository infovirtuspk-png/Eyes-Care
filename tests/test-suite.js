const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('\x1b[36m=== EYES CARE AUTOMATED TEST SUITE ===\x1b[0m\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
      passed++;
    } catch (err) {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${name}`);
      console.error(err);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
      passed++;
    } catch (err) {
      console.error(`\x1b[31m✖ FAIL:\x1b[0m ${name}`);
      console.error(err);
      failed++;
    }
  }

  // 1. Test Kelvin to RGB Gamma Conversion
  test('Kelvin to RGB Gamma calculation (Tanner Helland Algorithm)', () => {
    const displayNative = require('../src/native/windows/display-native');

    // Test 6500K (Standard Daylight)
    const daylight = displayNative.kelvinAndBrightnessToRamp(6500, 100);
    assert(daylight.rMult > 0.95, 'Red multiplier at 6500K should be close to 1.0');
    assert(daylight.gMult > 0.95, 'Green multiplier at 6500K should be close to 1.0');
    assert(daylight.bMult > 0.95, 'Blue multiplier at 6500K should be close to 1.0');

    // Test 3500K (Warm Amber - low blue light)
    const warm = displayNative.kelvinAndBrightnessToRamp(3500, 80);
    assert(warm.rMult > warm.gMult, 'Red multiplier should be greater than green at 3500K');
    assert(warm.gMult > warm.bMult, 'Green multiplier should be greater than blue at 3500K');
    assert(warm.bMult < 0.6, 'Blue multiplier should be reduced significantly at 3500K');

    // Test Brightness scaling
    const dim = displayNative.kelvinAndBrightnessToRamp(6500, 50);
    assert(Math.abs(dim.rMult - daylight.rMult * 0.5) < 0.05, 'Brightness scaling should scale multipliers linearly');
  });

  // 2. Test Break Engine Timer Mathematics
  test('Break Engine formatTime and timestamp calculations', () => {
    const breakEngine = require('../src/backend/break-engine');

    assert.strictEqual(breakEngine.formatTime(1200), '20:00', '1200 seconds should format to 20:00');
    assert.strictEqual(breakEngine.formatTime(20), '00:20', '20 seconds should format to 00:20');
    assert.strictEqual(breakEngine.formatTime(0), '00:00', '0 seconds should format to 00:00');
    assert.strictEqual(breakEngine.formatTime(3665), '61:05', '3665 seconds should format to 61:05');
  });

  // 3. Test User Timer Engine
  test('User Timer Engine formatTime', () => {
    const userTimerEngine = require('../src/backend/timer-engine');

    assert.strictEqual(userTimerEngine.formatTime(1500), '25:00', '1500 seconds should format to 25:00');
    assert.strictEqual(userTimerEngine.formatTime(3600), '01:00:00', '3600 seconds should format to 01:00:00');
    assert.strictEqual(userTimerEngine.formatTime(5400), '01:30:00', '5400 seconds should format to 01:30:00');
  });

  // 4. Test Scheduler Time Range Logic
  test('Scheduler Engine isTimeInRange (including midnight crossing)', () => {
    const schedulerEngine = require('../src/backend/scheduler-engine');

    // Standard range
    assert.strictEqual(schedulerEngine.isTimeInRange('10:00', '08:00', '12:00'), true);
    assert.strictEqual(schedulerEngine.isTimeInRange('07:59', '08:00', '12:00'), false);
    assert.strictEqual(schedulerEngine.isTimeInRange('12:01', '08:00', '12:00'), false);

    // Midnight crossing range (e.g. 20:00 to 06:00)
    assert.strictEqual(schedulerEngine.isTimeInRange('22:00', '20:00', '06:00'), true);
    assert.strictEqual(schedulerEngine.isTimeInRange('02:30', '20:00', '06:00'), true);
    assert.strictEqual(schedulerEngine.isTimeInRange('15:00', '20:00', '06:00'), false);
  });

  // 5. Test SQLite Database Schema and Repositories
  await testAsync('SQLite Database Initialization & CRUD Operations', async () => {
    const db = require('../src/database/database-manager');
    await db.initialize();

    // Verify default profiles
    const profiles = await db.getProfiles();
    assert(profiles.length >= 8, 'Should contain at least 8 default profiles (Pause, Health, Game, Movie, Office, Editing, Reading, Custom)');

    const healthProfile = await db.getProfileByName('Health');
    assert.strictEqual(healthProfile.temperature, 4000);
    assert.strictEqual(healthProfile.brightness, 80);

    // Save and retrieve custom profile
    await db.saveProfile({
      name: 'NightCoding',
      temperature: 3200,
      brightness: 65,
      enabled: 1,
      is_default: 0,
      description: 'Ultra warm night coding mode'
    });

    const savedNight = await db.getProfileByName('NightCoding');
    assert.strictEqual(savedNight.temperature, 3200);
    assert.strictEqual(savedNight.brightness, 65);

    // Test Schedules CRUD
    const schedules = await db.getSchedules();
    assert(schedules.length >= 1, 'Should load default schedules');

    // Test Timers CRUD
    const timers = await db.getTimers();
    assert(timers.length >= 1, 'Should load default timers');

    // Test App Rules CRUD
    const rules = await db.getAppRules();
    assert(rules.length >= 1, 'Should load default app rules');
  });

  // 6. Test JSON Backup & Restore Serialization
  await testAsync('Settings JSON Backup Export & Import Schema Validation', async () => {
    const db = require('../src/database/database-manager');
    const jsonStr = await db.exportAllSettings();
    assert(typeof jsonStr === 'string', 'Export must return a string');

    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.appName, 'Eyes Care');
    assert(parsed.data.profiles.length >= 8);
    assert(parsed.data.schedules.length >= 1);

    // Test import
    const importRes = await db.importAllSettings(jsonStr);
    assert.strictEqual(importRes.success, true);
  });

  // 7. Test Offline Activation Key Verification
  await testAsync('Offline License Validation Logic', async () => {
    const db = require('../src/database/database-manager');

    const invalidRes = await db.activateLicense('INVALID-KEY-1234');
    assert.strictEqual(invalidRes.success, false);

    const validRes = await db.activateLicense('@NUTTERTOOLS123');
    assert.strictEqual(validRes.success, true);

    const status = await db.checkTrialStatus();
    assert.strictEqual(status.activated, true);
    assert.strictEqual(status.is_trial, false);
  });

  console.log(`\n\x1b[36mTest Summary: ${passed} Passed, ${failed} Failed\x1b[0m\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test Suite Fatal Error:', e);
  process.exit(1);
});
