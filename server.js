import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Server-side Rankings Directory & Manifest Setup
const RANKINGS_DIR = path.join(__dirname, 'data', 'rankings');
const MANIFEST_FILE = path.join(RANKINGS_DIR, 'manifest.json');

if (!fs.existsSync(RANKINGS_DIR)) {
  fs.mkdirSync(RANKINGS_DIR, { recursive: true });
}

// Candidate paths for default Hayden Winks rankings CSV
function getCandidateCSVPaths() {
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  return [
    process.env.RANKINGS_CSV_PATH,
    path.join(__dirname, 'rankings.csv'),
    path.join(__dirname, 'Hayden_Winks_2026_PPR_Rankings.csv'),
    'D:/Downloads/Hayden_Winks_2026_PPR_Rankings.csv',
    path.join(userHome, 'Downloads', 'Hayden_Winks_2026_PPR_Rankings.csv')
  ].filter(Boolean);
}

// In-memory cache for Sleeper NFL Players
let sleeperPlayersCache = null;
let lastPlayersFetchTime = 0;

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

// Manifest management for persistent saved rankings
function readManifest() {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Error reading rankings manifest:', err.message);
  }
  return [];
}

function writeManifest(manifest) {
  try {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing rankings manifest:', err.message);
  }
}

// Ensure default ranking dataset is copied to data/rankings/default.csv and indexed in manifest
function initializeDefaultRankings() {
  const defaultPath = path.join(RANKINGS_DIR, 'default.csv');
  let content = null;
  let sourceFileName = 'rankings.csv';

  if (fs.existsSync(defaultPath)) {
    content = fs.readFileSync(defaultPath, 'utf-8');
  } else {
    const candidatePaths = getCandidateCSVPaths();
    for (const csvPath of candidatePaths) {
      if (fs.existsSync(csvPath)) {
        content = fs.readFileSync(csvPath, 'utf-8');
        fs.writeFileSync(defaultPath, content, 'utf-8');
        sourceFileName = path.basename(csvPath);
        break;
      }
    }
  }

  let manifest = readManifest();
  const hasDefault = manifest.some(item => item.id === 'default');

  if (content && (!hasDefault || manifest.length === 0)) {
    const parsed = parseRankingsCSV(content);
    const defaultMeta = {
      id: 'default',
      filename: 'default.csv',
      name: 'Hayden Winks PPR Consensus',
      isDefault: true,
      count: parsed.length,
      updatedAt: new Date().toISOString()
    };
    manifest = [defaultMeta, ...manifest.filter(m => m.id !== 'default')];
    writeManifest(manifest);
    console.log(`Initialized default rankings dataset (${parsed.length} players).`);
  }
}

initializeDefaultRankings();

// Helper to load parsed dataset by ranking ID
function getDatasetById(id) {
  const manifest = readManifest();
  const meta = manifest.find(m => m.id === id);
  if (!meta) return null;

  const filePath = path.join(RANKINGS_DIR, meta.filename);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');
  const rankings = parseRankingsCSV(content);
  return {
    meta,
    rankings
  };
}

// Helper to fetch Sleeper NFL players dictionary
async function getSleeperPlayers() {
  const NOW = Date.now();
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

// 1. List all available saved rankings on server
app.get('/api/rankings', (req, res) => {
  const manifest = readManifest();
  res.json({
    count: manifest.length,
    rankings: manifest
  });
});

// 2. Fetch specific dataset by ID
app.get('/api/rankings/dataset/:id', (req, res) => {
  const dataset = getDatasetById(req.params.id);
  if (!dataset) {
    return res.status(404).json({ error: 'Rankings dataset not found' });
  }
  res.json(dataset);
});

// 3. Upload & save a new CSV dataset to server
app.post('/api/rankings/upload', (req, res) => {
  try {
    const { csvContent, name } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }

    const parsed = parseRankingsCSV(csvContent);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'Failed to parse any players from CSV' });
    }

    const cleanName = (name || 'Custom Ranking').trim();
    const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const filename = `${id}.csv`;
    const filePath = path.join(RANKINGS_DIR, filename);

    fs.writeFileSync(filePath, csvContent, 'utf-8');

    const meta = {
      id,
      filename,
      name: cleanName,
      isDefault: false,
      count: parsed.length,
      updatedAt: new Date().toISOString()
    };

    const manifest = readManifest();
    manifest.push(meta);
    writeManifest(manifest);

    res.json({
      message: 'Rankings dataset saved successfully',
      meta,
      rankings: parsed,
      allManifest: manifest
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a custom saved dataset from server
app.delete('/api/rankings/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'default') {
      return res.status(400).json({ error: 'Cannot delete default ranking dataset' });
    }

    let manifest = readManifest();
    const meta = manifest.find(m => m.id === id);
    if (!meta) {
      return res.status(404).json({ error: 'Ranking dataset not found' });
    }

    const filePath = path.join(RANKINGS_DIR, meta.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    manifest = manifest.filter(m => m.id !== id);
    writeManifest(manifest);

    res.json({
      message: 'Rankings dataset deleted successfully',
      id,
      allManifest: manifest
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// 7. Sleeper Draft Picks & Available Players calculation (Supports Multi-Rankings)
app.get('/api/sleeper/draft/:draftId/picks', async (req, res) => {
  try {
    const { draftId } = req.params;
    const requestedIds = (req.query.ids || req.query.rankingId || 'default').split(',').map(id => id.trim()).filter(Boolean);

    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch draft picks' });
    }
    const picks = await response.json();

    // Ensure player index is loaded
    const playerIndex = await getSleeperPlayers();

    // Map picked sleeper player IDs
    const pickedSleeperIds = new Set();
    const pickedPlayerMap = {};

    for (const pick of picks) {
      if (pick.player_id) {
        pickedSleeperIds.add(pick.player_id);
        pickedPlayerMap[pick.player_id] = pick;
      }
    }

    const datasetsMap = {};
    let primaryRankings = [];

    for (let index = 0; index < requestedIds.length; index++) {
      const id = requestedIds[index];
      const dataset = getDatasetById(id) || getDatasetById('default');
      if (!dataset) continue;

      const processed = dataset.rankings.map(item => {
        const normName = item.normalizedName;
        const pos = item.position.toUpperCase();

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

      datasetsMap[id] = {
        meta: dataset.meta,
        rankingsWithDraftStatus: processed
      };

      if (index === 0) {
        primaryRankings = processed;
      }
    }

    res.json({
      draftId,
      totalPicksCount: picks.length,
      picks,
      rankingsWithDraftStatus: primaryRankings,
      datasetsMap
    });
  } catch (err) {
    console.error('Error fetching picks:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static Vite production assets if built (Docker / Production mode)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Sleeper Draft Assistant Server running on http://localhost:${PORT}`);
});
