// Team branding colors for authentic NFL feel
export const TEAM_COLORS = {
  ARI: { bg: 'rgba(151, 35, 63, 0.25)', border: 'rgba(151, 35, 63, 0.6)', text: '#f87171' },
  ATL: { bg: 'rgba(167, 25, 48, 0.25)', border: 'rgba(167, 25, 48, 0.6)', text: '#f87171' },
  BAL: { bg: 'rgba(36, 23, 115, 0.35)', border: 'rgba(129, 140, 248, 0.6)', text: '#a5b4fc' },
  BUF: { bg: 'rgba(0, 51, 141, 0.35)', border: 'rgba(59, 130, 246, 0.6)', text: '#60a5fa' },
  CAR: { bg: 'rgba(0, 133, 202, 0.25)', border: 'rgba(6, 182, 212, 0.6)', text: '#38bdf8' },
  CHI: { bg: 'rgba(11, 22, 42, 0.5)', border: 'rgba(251, 146, 60, 0.6)', text: '#fb923c' },
  CIN: { bg: 'rgba(251, 79, 20, 0.25)', border: 'rgba(251, 146, 60, 0.6)', text: '#fb923c' },
  CLE: { bg: 'rgba(255, 60, 0, 0.25)', border: 'rgba(249, 115, 22, 0.6)', text: '#fdba74' },
  DAL: { bg: 'rgba(0, 53, 148, 0.3)', border: 'rgba(148, 163, 184, 0.6)', text: '#cbd5e1' },
  DEN: { bg: 'rgba(251, 79, 20, 0.25)', border: 'rgba(59, 130, 246, 0.6)', text: '#60a5fa' },
  DET: { bg: 'rgba(0, 118, 182, 0.3)', border: 'rgba(56, 189, 248, 0.6)', text: '#38bdf8' },
  GB:  { bg: 'rgba(32, 55, 49, 0.4)', border: 'rgba(234, 179, 8, 0.6)', text: '#facc15' },
  HOU: { bg: 'rgba(3, 32, 47, 0.4)', border: 'rgba(239, 68, 68, 0.6)', text: '#f87171' },
  IND: { bg: 'rgba(0, 44, 95, 0.35)', border: 'rgba(96, 165, 250, 0.6)', text: '#93c5fd' },
  JAX: { bg: 'rgba(0, 103, 120, 0.3)', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047' },
  KC:  { bg: 'rgba(227, 24, 55, 0.3)', border: 'rgba(250, 204, 21, 0.6)', text: '#fef08a' },
  LV:  { bg: 'rgba(30, 41, 59, 0.6)', border: 'rgba(148, 163, 184, 0.6)', text: '#e2e8f0' },
  LAC: { bg: 'rgba(0, 128, 198, 0.3)', border: 'rgba(250, 204, 21, 0.6)', text: '#fde047' },
  LAR: { bg: 'rgba(0, 53, 148, 0.35)', border: 'rgba(250, 204, 21, 0.6)', text: '#fde047' },
  MIA: { bg: 'rgba(0, 142, 151, 0.3)', border: 'rgba(251, 146, 60, 0.6)', text: '#fb923c' },
  MIN: { bg: 'rgba(79, 38, 131, 0.35)', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047' },
  NE:  { bg: 'rgba(0, 34, 68, 0.4)', border: 'rgba(248, 113, 113, 0.6)', text: '#fca5a5' },
  NO:  { bg: 'rgba(211, 188, 141, 0.25)', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047' },
  NYG: { bg: 'rgba(11, 34, 101, 0.35)', border: 'rgba(239, 68, 68, 0.6)', text: '#fca5a5' },
  NYJ: { bg: 'rgba(18, 87, 64, 0.35)', border: 'rgba(74, 222, 128, 0.6)', text: '#4ade80' },
  PHI: { bg: 'rgba(0, 76, 84, 0.35)', border: 'rgba(45, 212, 191, 0.6)', text: '#2dd4bf' },
  PIT: { bg: 'rgba(255, 182, 18, 0.25)', border: 'rgba(250, 204, 21, 0.6)', text: '#fde047' },
  SF:  { bg: 'rgba(170, 0, 0, 0.3)', border: 'rgba(234, 179, 8, 0.6)', text: '#fde047' },
  SEA: { bg: 'rgba(0, 34, 68, 0.4)', border: 'rgba(132, 204, 22, 0.6)', text: '#a3e635' },
  TB:  { bg: 'rgba(213, 10, 10, 0.3)', border: 'rgba(249, 115, 22, 0.6)', text: '#fdba74' },
  TEN: { bg: 'rgba(12, 35, 64, 0.4)', border: 'rgba(56, 189, 248, 0.6)', text: '#38bdf8' },
  WAS: { bg: 'rgba(90, 20, 20, 0.35)', border: 'rgba(250, 204, 21, 0.6)', text: '#fde047' }
};

export function getTeamStyle(teamCode) {
  const code = (teamCode || '').toUpperCase();
  return TEAM_COLORS[code] || { bg: 'rgba(30, 41, 59, 0.5)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' };
}

export function calculateTier(rank) {
  if (rank <= 12) return { tier: 1, label: 'Tier 1 • Elite Anchors (Round 1)', color: 'from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/30' };
  if (rank <= 24) return { tier: 2, label: 'Tier 2 • Foundation Stars (Round 2)', color: 'from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/30' };
  if (rank <= 36) return { tier: 3, label: 'Tier 3 • Cornerstone Starters (Round 3)', color: 'from-purple-500/20 to-indigo-500/10 text-purple-300 border-purple-500/30' };
  if (rank <= 48) return { tier: 4, label: 'Tier 4 • Solid High-Floor Starters (Round 4)', color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30' };
  if (rank <= 72) return { tier: 5, label: 'Tier 5 • Core Starter Pool (Rounds 5-6)', color: 'from-sky-500/20 to-blue-500/10 text-sky-300 border-sky-500/30' };
  if (rank <= 96) return { tier: 6, label: 'Tier 6 • Upside Flex & Mid-Round Value (Rounds 7-8)', color: 'from-pink-500/20 to-rose-500/10 text-pink-300 border-pink-500/30' };
  if (rank <= 144) return { tier: 7, label: 'Tier 7 • Bench Depth & Sleepers (Rounds 9-12)', color: 'from-orange-500/20 to-amber-500/10 text-orange-300 border-orange-500/30' };
  return { tier: 8, label: 'Tier 8 • Late Round Fliers & Handcuffs (145+)', color: 'from-slate-700/20 to-slate-800/10 text-slate-400 border-slate-700/30' };
}

/**
 * Normalizes player names across all sources, stripping punctuation and suffixes.
 */
export function normalizePlayerName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove spaces, dots, apostrophes, hyphens, commas
    .replace(/(jr|sr|iii|ii|iv|v)$/g, ''); // remove common name suffixes
}
