/**
 * Sleeper Draft Assistant - Application Configuration Template
 * 
 * You can customize your default Sleeper username and preference settings below.
 */

export const APP_CONFIG = {
  // Default Sleeper Username for auto-connect and user-slot detection
  DEFAULT_SLEEPER_USERNAME: 'NimbleKoala',

  // Default Draft Season (e.g., '2026', '2025', '2024')
  DEFAULT_SEASON: '2026',

  // Default Roster Format Strategy ('PPR', 'HALF_PPR', 'STANDARD')
  DEFAULT_SCORING_FORMAT: 'PPR',

  // Maximum recent drafts kept in browser history
  MAX_RECENT_DRAFTS_HISTORY: 5,

  // Default Positional Targets for Roster Tracker
  ROSTER_TARGETS: {
    QB: 1,
    RB: 4,
    WR: 5,
    TE: 1,
    K: 1,
    DEF: 1
  }
};

export default APP_CONFIG;
