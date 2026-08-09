# ADR-002: Tailwind CSS v3 Design System & Responsive Roster Tracking

## Status
Accepted

## Date
2026-08-09

## Context
The application needs to provide a modern, high-contrast, production-grade interface for fantasy draft assistant users across both desktop monitors and mobile touchscreens.

## Decision
1. Adopt Tailwind CSS v3 with PostCSS and custom dark glassmorphism design tokens in `src/index.css`.
2. Implement strict draft slot matching (`Slot 1`, `Slot 2`, ... `Slot 12`) in `MyRosterTracker.jsx` to prevent cross-team pick bleeding.
3. Automatically detect user draft slot via username matching (`NimbleKoala` / `APP_CONFIG.DEFAULT_SLEEPER_USERNAME`).
4. Implement mobile auto-switching to 1-tap player cards on viewports < 640px.

## Consequences
- Clean 60 FPS UI performance with memoized React components.
- Zero horizontal scrolling required on mobile touch screens.
- Reliable team roster progress tracking aligned with Sleeper draft slot order.
