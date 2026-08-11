# Spec: Multi-Rankings Server Storage & Comparison

## Objective
Enable users to upload, store, and manage multiple player ranking CSV datasets on the Express backend server (`server.js`). Provide a frontend UI in React to select up to 3 active rankings simultaneously, display them side-by-side in the main player table, and interactively sort players by any of the selected rankings.

## Tech Stack
- **Frontend**: React 18, Vite 5, Lucide Icons, Tailwind CSS v3
- **Backend**: Node.js Express server (`server.js`), `multer` or express body-parser for CSV uploads, `fs` for file persistence in `data/rankings/`
- **Data Format**: Standard CSV (Rank, Player Name, Team, Position)

## Commands
- **Dev**: `$env:Path = "C:\Program Files\nodejs;" + $env:Path; npm run dev`
- **Build**: `$env:Path = "C:\Program Files\nodejs;" + $env:Path; npm run build`
- **Backend Server**: `$env:Path = "C:\Program Files\nodejs;" + $env:Path; npm run server`

## Project Structure
```
sleeper-draft-assistant/
├── server.js                          # Express proxy server with rankings REST API
├── data/
│   └── rankings/                      # Server-side persistent directory for saved CSVs
│       └── rankings.csv               # Default Hayden Winks PPR rankings
├── src/
│   ├── components/
│   │   ├── BestAvailable.jsx          # Multi-column ranking view & 1-click header sorting
│   │   ├── RankingsManagerModal.jsx   # Select up to 3 rankings, upload & delete custom CSVs
│   │   ├── MyRosterTracker.jsx        # Roster recommendations using active primary sort
│   │   └── Header.jsx                 # Quick selector badges for active 3 rankings
│   └── App.jsx                        # Central state for selectedRankings (max 3) & activeSortKey
└── docs/specs/
    └── multi-rankings-support.md      # Feature specification document
```

## REST API Endpoints (`server.js`)
1. `GET /api/rankings`
   - Returns a list of all saved rankings metadata on the server: `[{ id, filename, name, isDefault, count, updatedAt }]`.
2. `GET /api/rankings/:id`
   - Returns the parsed player rankings array for a specific dataset ID.
3. `POST /api/rankings/upload`
   - Accepts a JSON payload `{ filename, name, csvContent }` or multipart CSV upload and saves it to `data/rankings/`.
4. `DELETE /api/rankings/:id`
   - Deletes a custom saved ranking file from `data/rankings/` (protecting default `rankings.csv`).

## UI & Interaction Rules
1. **Rankings Manager Modal**:
   - Lists all saved server rankings.
   - User can check/uncheck to select between 1 and 3 active rankings.
   - Provides an upload form to save new CSV rankings directly to the server.
   - Allows deleting custom uploaded CSV files.
2. **Best Available Table**:
   - Renders side-by-side rank columns for each of the selected active rankings (up to 3 columns).
   - Shows rank number, tier indicator, and rank variance (e.g. `+3` or `-2` relative to primary rank).
   - Clicking any ranking column header sets that ranking as the active sorting key (`sortKey` + `sortOrder`).
3. **Responsive Design**:
   - On mobile screens, displays primary rank prominently with a clean toggle pill to view Rank 2 and Rank 3 details without overflowing.

## Boundaries
- **Always**: Validate CSV structure before saving; fallback gracefully if a player is unranked in one of the selected datasets.
- **Ask first**: Major changes to existing Sleeper draft API proxy endpoints.
- **Never**: Allow deleting the default Hayden Winks consensus ranking file.

## Success Criteria
- [ ] Users can upload a custom CSV file to the backend, which persists on the server filesystem in `data/rankings/`.
- [ ] Users can select 1, 2, or 3 active rankings in `RankingsManagerModal.jsx`.
- [ ] The player list displays all 1–3 selected ranking columns in `BestAvailable.jsx`.
- [ ] Clicking any selected ranking column header instantly sorts the player list by that ranking.
- [ ] `npm run build` compiles clean without errors.
