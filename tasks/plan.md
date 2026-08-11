# Technical Implementation Plan: Multi-Rankings Support

## Overview
Implement server-side persistence for multiple player ranking CSV files in `server.js` and frontend React UI support in `App.jsx`, `BestAvailable.jsx`, and `RankingsManagerModal.jsx` for selecting up to 3 rankings simultaneously, displaying them side-by-side, and sorting by any selected ranking column.

## Architecture Decisions & Data Model
1. **Server Storage**: Store ranking CSV files in `data/rankings/` directory on disk.
2. **Server Endpoints**:
   - `GET /api/rankings` - List all available saved rankings with metadata.
   - `GET /api/rankings/active?ids=id1,id2,id3` - Fetch parsed rankings datasets for multiple IDs concurrently.
   - `POST /api/rankings/upload` - Upload and parse a new CSV file, saving to `data/rankings/`.
   - `DELETE /api/rankings/:id` - Remove custom ranking file.
3. **Frontend State (`App.jsx`)**:
   - `selectedRankingIds`: Array of up to 3 ranking IDs (default: `['default']`).
   - `activeRankingsMap`: Object mapping ranking ID -> parsed ranking dataset.
   - `sortConfig`: `{ rankingId: 'default', direction: 'asc' }`.

## Implementation Sequence
1. **Phase 1: Backend Storage & API (`server.js`)**
   - Create `data/rankings/` directory if missing and populate default `rankings.csv`.
   - Implement `GET /api/rankings`, `GET /api/rankings/dataset/:id`, `POST /api/rankings/upload`, `DELETE /api/rankings/:id`.
2. **Phase 2: Rankings Manager Modal Update (`RankingsManagerModal.jsx`)**
   - Fetch available rankings list from `/api/rankings`.
   - Allow checkbox selection for up to 3 rankings.
   - Provide file uploader and delete custom dataset controls.
3. **Phase 3: Multi-Column Table & Interactive Sorting (`BestAvailable.jsx` & `App.jsx`)**
   - Merge active player lists by player name/ID to compute rank for each selected ranking.
   - Display side-by-side rank headers for each of the selected rankings.
   - Implement 1-click sorting when clicking any rank column header.
4. **Phase 4: Responsive Verification & Build Validation**
   - Ensure clean mobile card display and run production build verification (`npm run build`).
