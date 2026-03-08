# Modran Air Conditioner

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Smart air conditioner control interface for "Modran" brand
- Dashboard showing current room temperature and target temperature
- Power on/off toggle
- Mode selector: Cool, Heat, Fan, Dry, Auto
- Fan speed control: Low, Medium, High, Turbo
- Temperature adjustment controls (up/down, range 16–30°C)
- Timer scheduling: set on/off timers (hours)
- Sleep mode toggle
- Multiple room/unit management (add, rename, delete units)
- Unit status display: online/offline, current settings
- Backend stores per-unit state: power, mode, fan speed, temperature, timer, sleep mode

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: AC unit data model (id, name, power, mode, fanSpeed, temperature, timerOn, timerOff, sleepMode, isOnline)
2. Backend: CRUD operations for units (add, remove, rename, update settings)
3. Backend: Query all units and individual unit state
4. Frontend: Dashboard with unit cards showing status
5. Frontend: Detailed control panel per unit (temp, mode, fan, timer, sleep)
6. Frontend: Add/rename/delete unit flows
7. Frontend: Responsive layout, modern AC controller UI
