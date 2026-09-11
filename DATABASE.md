# Eyes Care - SQLite Database Schema & Storage

## Database Location
- **Path**: `%LOCALAPPDATA%\Eyes Care\eyescare.db`
- **Engine**: SQLite (via `sql.js` offline WebAssembly runtime)
- **Zero Cloud**: 100% stored locally.

---

## Table Schemas

### 1. `app_settings`
Stores key-value global configurations.
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT)
- `updated_at` (DATETIME)

### 2. `display_settings`
Per-monitor calibration state.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `monitor_id` (TEXT UNIQUE)
- `brightness` (INTEGER DEFAULT 100)
- `temperature` (INTEGER DEFAULT 6500)
- `enabled` (INTEGER DEFAULT 1)
- `sync_enabled` (INTEGER DEFAULT 1)
- `auto_day_night` (INTEGER DEFAULT 0)

### 3. `profiles`
Display calibration presets.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT UNIQUE NOT NULL)
- `temperature` (INTEGER DEFAULT 6500)
- `brightness` (INTEGER DEFAULT 100)
- `enabled` (INTEGER DEFAULT 1)
- `is_default` (INTEGER DEFAULT 0)
- `description` (TEXT)

### 4. `break_settings`
Break management timers and policies.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `enabled` (INTEGER DEFAULT 1)
- `work_minutes` (INTEGER DEFAULT 20)
- `short_break_seconds` (INTEGER DEFAULT 20)
- `long_break_minutes` (INTEGER DEFAULT 10)
- `long_break_frequency` (INTEGER DEFAULT 4)
- `smart_pause` (INTEGER DEFAULT 1)
- `pause_after_inactivity` (INTEGER DEFAULT 60)
- `enforced` (INTEGER DEFAULT 0)
- `profile` (TEXT DEFAULT '20-20-20')

### 5. `break_history`
Audit history of breaks taken or skipped.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `start_time` (DATETIME)
- `end_time` (DATETIME)
- `duration` (INTEGER)
- `type` (TEXT)
- `skipped` (INTEGER DEFAULT 0)

### 6. `schedules`
User-configured recurring time rules.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `start_time` (TEXT NOT NULL)
- `end_time` (TEXT NOT NULL)
- `days` (TEXT)
- `profile_name` (TEXT)
- `brightness` (INTEGER)
- `temperature` (INTEGER)
- `priority` (INTEGER DEFAULT 3)

### 7. `app_rules`
Application-triggered profiles.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `app_name` (TEXT NOT NULL)
- `executable_name` (TEXT NOT NULL)
- `action` (TEXT)
- `profile_name` (TEXT)
- `priority` (INTEGER DEFAULT 2)

### 8. `hotkeys`
Global keyboard accelerators.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `action` (TEXT UNIQUE NOT NULL)
- `accelerator` (TEXT)
- `enabled` (INTEGER DEFAULT 1)
