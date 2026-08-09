import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DEFAULT_CSV_PATH = 'D:/Downloads/Hayden_Winks_2026_PPR_Rankings.csv';

// In-memory cache for Sleeper NFL Players (to avoid re-fetching 5MB file constantly)
let sleeperPlayersCache = null;
let lastPlayersFetchTime = 0;

// Current Active Rankings dataset
let activeRankings = [];
let activeRankingsSource = 'Hayden Winks 2026 PPR (Local File)';

// Normalize player names for resilient matching
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove spaces, dots, apostrophes, hyphens
    .replace(/(jr|sr|iii|ii|iv|v)$/g, ''); // remove common suffixes
}

// Parse CSV text into array of player objects
function parseRankingsCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  const rankIdx = headers.findIndex(h => h.includes('rank'));
  const playerIdx = headers.findIndex(h => h.includes('player') || h.includes('name'));
  const teamIdx = headers.findIndex(h => h.includes('team'));
  const posIdx = headers.findIndex(h => h.includes('pos') || h.includes('position'));

  const parsed = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 2) continue;

    const rank = parseInt(cols[rankIdx >= 0 ? rankIdx : 0], 10) || i;
    const player = cols[playerIdx >= 0 ? playerIdx : 1] || 'Unknown';
    const team = cols[teamIdx >= 0 ? teamIdx : 2] || '';
    const position = cols[posIdx >= 0 ? posIdx : 3] || '';

    parsed.push({
      rank,
      player,
      team,
      position,
      normalizedName: normalizeName(player)
    });
  }

  return parsed.sort((a, b) => a.rank - b.rank);
}

// Load default CSV on server start if available
function loadDefaultRankings() {
  try {
    if (fs.existsSync(DEFAULT_CSV_PATH)) {
      const content = fs.readFileSync(DEFAULT_CSV_PATH, 'utf-8');
      activeRankings = parseRankingsCSV(content);
      activeRankingsSource = `Hayden Winks 2026 PPR Rankings (${activeRankings.length} players loaded)`;
      console.log(`Loaded ${activeRankings.length} players from default CSV: ${DEFAULT_CSV_PATH}`);
    } else {
      console.warn(`Default CSV file not found at ${DEFAULT_CSV_PATH}`);
    }
  } catch (err) {
    console.error('Error reading default CSV:', err.message);
  }
}

loadDefaultRankings();

// Helper to fetch Sleeper NFL players dictionary
async function getSleeperPlayers() {
  const NOW = Date.now();
  // Cache for 12 hours
  if (sleeperPlayersCache && (NOW - lastPlayersFetchTime < 12 * 60 * 60 * 1000)) {
    return sleeperPlayersCache;
  }

  console.log('Fetching NFL Players dictionary from Sleeper API...');
  const response = await fetch('https://api.sleeper.app/v1/players/nfl');
  if (!response.ok) {
    throw new Error(`Failed to fetch Sleeper players: ${response.statusText}`);
  }
  
  const rawPlayers = await response.json();
  const index = {
    byId: rawPlayers,
    byNormalizedName: {},
    byNormalizedNameAndPos: {}
  };

  // Build fast lookup indexes
  for (const [id, p] of Object.entries(rawPlayers)) {
    const fullName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (!fullName) continue;

    const norm = normalizeName(fullName);
    const pos = (p.position || '').toUpperCase();

    if (!index.byNormalizedName[norm]) {
      index.byNormalizedName[norm] = p;
    }

    if (pos) {
      index.byNormalizedNameAndPos[`${norm}_${pos}`] = p;
    }
  }

  sleeperPlayersCache = index;
  lastPlayersFetchTime = NOW;
  console.log(`Sleeper players indexed (${Object.keys(rawPlayers).length} players).`);
  return index;
}

// REST ENDPOINTS

// 1. Get current rankings
app.get('/api/rankings', (req, res) => {
  res.json({
    source: activeRankingsSource,
    count: activeRankings.length,
    rankings: activeRankings
  });
});

// 2. Custom CSV Upload / Paste
app.post('/api/rankings/upload', (req, res) => {
  try {
    const { csvContent, sourceName } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }

    const parsed = parseRankingsCSV(csvContent);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'Failed to parse any players from CSV' });
    }

    activeRankings = parsed;
    activeRankingsSource = sourceName || `Custom Upload (${parsed.length} players)`;
    res.json({
      message: 'Rankings updated successfully',
      source: activeRankingsSource,
      count: parsed.length,
      rankings: parsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Reload default CSV
app.post('/api/rankings/reload-default', (req, res) => {
  loadDefaultRankings();
  res.json({
    source: activeRankingsSource,
    count: activeRankings.length,
    rankings: activeRankings
  });
});

// 4. Sleeper User Lookup
app.get('/api/sleeper/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/user/${encodeURIComponent(username)}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'User not found on Sleeper' });
    }
    const data = await response.json();
    if (!data || !data.user_id) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Sleeper User Drafts (Combines Direct User Drafts + League Drafts)
app.get('/api/sleeper/user/:userId/drafts/:season', async (req, res) => {
  try {
    const { userId, season } = req.params;

    // 1. Fetch direct user drafts
    const draftsRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/drafts/nfl/${season}`);
    let drafts = draftsRes.ok ? await draftsRes.json() : [];
    const existingDraftIds = new Set(drafts.map(d => d.draft_id));

    // 2. Fetch user leagues for season and merge any league.draft_id not yet included
    const leaguesRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`);
    if (leaguesRes.ok) {
      const leagues = await leaguesRes.json();
      for (const league of leagues) {
        if (league.draft_id && !existingDraftIds.has(league.draft_id)) {
          try {
            const dRes = await fetch(`https://api.sleeper.app/v1/draft/${league.draft_id}`);
            if (dRes.ok) {
              const dData = await dRes.json();
              drafts.push({
                ...dData,
                metadata: {
                  ...(dData.metadata || {}),
                  name: dData.metadata?.name || league.name
                }
              });
              existingDraftIds.add(league.draft_id);
            }
          } catch (e) {}
        }
      }
    }

    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Sleeper Draft Metadata (includes draft users & league users fallback)
app.get('/api/sleeper/draft/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Draft not found' });
    }
    const draft = await response.json();

    // Fetch draft users or league users if draft users is empty
    let users = [];
    try {
      const usersRes = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/users`);
      if (usersRes.ok) {
        users = await usersRes.json();
      }
      if ((!users || users.length === 0) && draft.league_id) {
        const leagueUsersRes = await fetch(`https://api.sleeper.app/v1/league/${draft.league_id}/users`);
        if (leagueUsersRes.ok) {
          users = await leagueUsersRes.json();
        }
      }
    } catch (e) {
      console.warn('Failed to fetch draft users:', e.message);
    }

    res.json({ ...draft, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Sleeper Draft Picks & Available Players calculation
app.get('/api/sleeper/draft/:draftId/picks', async (req, res) => {
  try {
    const { draftId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch draft picks' });
    }
    const picks = await response.json();

    // Ensure player index is loaded
    const playerIndex = await getSleeperPlayers();

    // Map picked sleeper player IDs to normalized player names/IDs
    const pickedSleeperIds = new Set();
    const pickedPlayerMap = {}; // sleeper_id -> pick object

    for (const pick of picks) {
      if (pick.player_id) {
        pickedSleeperIds.add(pick.player_id);
        pickedPlayerMap[pick.player_id] = pick;
      }
    }

    // Match ranking entries with Sleeper player records
    const processedRankings = activeRankings.map(item => {
      const normName = item.normalizedName;
      const pos = item.position.toUpperCase();

      // Find match in Sleeper index
      const sleeperMatch = playerIndex.byNormalizedNameAndPos[`${normName}_${pos}`] ||
                           playerIndex.byNormalizedName[normName];

      const sleeperId = sleeperMatch ? sleeperMatch.player_id : null;
      let isPicked = false;
      let pickInfo = null;

      if (sleeperId && pickedSleeperIds.has(sleeperId)) {
        isPicked = true;
        pickInfo = pickedPlayerMap[sleeperId];
      }

      return {
        ...item,
        sleeperId,
        sleeperDetails: sleeperMatch ? {
          fullName: sleeperMatch.full_name || item.player,
          team: sleeperMatch.team || item.team,
          position: sleeperMatch.position || item.position,
          age: sleeperMatch.age,
          yearsExp: sleeperMatch.years_exp,
          status: sleeperMatch.status,
          injuryStatus: sleeperMatch.injury_status
        } : null,
        isPicked,
        pickInfo
      };
    });

    res.json({
      draftId,
      totalPicksCount: picks.length,
      picks,
      rankingsWithDraftStatus: processedRankings
    });
  } catch (err) {
    console.error('Error fetching picks:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Sleeper Draft Assistant Server running on http://localhost:${PORT}`);
});
