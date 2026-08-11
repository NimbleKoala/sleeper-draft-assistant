# ADR-003: Server-Side Multi-Rankings Comparison & CSV Converter Skill

## Status
Accepted

## Date
2026-08-10

## Context
The Sleeper Draft Assistant previously supported only a single active ranking dataset at a time (Hayden Winks PPR Consensus). Fantasy football managers drafting on Sleeper require comparing multiple expert/consensus and custom ranking lists simultaneously (e.g. Hayden Winks PPR vs. ADP Consensus vs. Custom User Lists) to identify draft value opportunities and sort available players dynamically. Key constraints:
- Custom ranking files must persist across application restarts.
- The UI must support viewing up to 3 active ranking datasets side-by-side without overflowing desktop or mobile screens.
- Raw ranking inputs (copied web tables, TSV files, non-standard team codes) need automated formatting and normalization into the standard `Rank,Player,Team,Position` schema.

## Decision
1. **Server-Side File Persistence & Manifest**:
   - Store ranking CSV files on disk in `data/rankings/` with a `manifest.json` metadata index (`server.js`).
   - Provide REST API endpoints to list (`GET /api/rankings`), retrieve (`GET /api/rankings/dataset/:id`), upload (`POST /api/rankings/upload`), and delete (`DELETE /api/rankings/:id`) custom datasets.
2. **Multi-Dataset Pick Evaluation**:
   - Update `/api/sleeper/draft/:draftId/picks?ids=id1,id2,id3` to evaluate draft pick status against all selected datasets in a single server-side batch.
3. **Frontend Multi-Column View & Interactive Sorting**:
   - Update `App.jsx` and `BestAvailable.jsx` to select up to 3 active datasets (`selectedRankingIds`).
   - Render side-by-side rank columns for each selected dataset in the player table.
   - Support 1-click header sorting (`activeSortKey`) to sort the player stream by any active dataset.
4. **Workspace Converter Skill**:
   - Add `.agents/skills/rankings-csv-converter/` with an executable Node.js parser (`scripts/convert_rankings.js`) to parse raw text/TSV files, convert `Last, First` names, and normalize NFL team codes (`JAC` ➔ `JAX`, `LA` ➔ `LAR`).

## Alternatives Considered

### Client-Side Browser `localStorage` Only
- **Pros**: Zero backend API changes required.
- **Cons**: Large CSV files bloat browser storage; rankings are device-bound and cleared if browser cache is cleared.
- **Rejected**: Server disk storage in `data/rankings/` provides multi-session persistence and cleaner API separation.

### Automated Weighted Math Consensus Formula
- **Pros**: Blends 3 rankings into a single calculated average rank score.
- **Cons**: Obscures individual expert rank differences and prevents users from sorting by specific expert sources during drafts.
- **Rejected**: Side-by-side columns with 1-click header sorting give drafters clear, un-biased visibility into each expert's exact rank.

## Consequences
- Drafters can store and compare up to 3 custom/consensus ranking sets simultaneously.
- 1-click column header sorting makes finding value targets instant.
- `rankings-csv-converter` skill enables converting any raw TSV/web table export into standard CSV schema.
- Production build verified (`npm run build` succeeds in 36.33s).
