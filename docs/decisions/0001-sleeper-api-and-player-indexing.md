# ADR-001: Sleeper API Integration & In-Memory NFL Player Indexing

## Status
Accepted

## Date
2026-08-09

## Context
The Sleeper Draft Assistant requires real-time player matching between Hayden Winks PPR rankings and Sleeper API draft picks. Key constraints:
- Sleeper API `/v1/players/nfl` returns a 12,000+ player dictionary (~5MB JSON payload).
- Fetching 5MB on every API request introduces ~1.5s latency per draft sync.
- Users can connect drafts via direct User Drafts API or League Drafts API.

## Decision
1. Implement a lightweight Node/Express backend proxy server (`server.js`).
2. Build an in-memory 12-hour cached player index with normalized string matching maps (`byNormalizedNameAndPos` and `byNormalizedName`).
3. Enhance user draft lookups to combine both direct drafts (`/v1/user/:userId/drafts/nfl/:season`) and league-linked drafts (`/v1/user/:userId/leagues/nfl/:season`).

## Alternatives Considered

### Direct Client-Side Fetching
- **Pros**: No backend proxy server needed.
- **Cons**: 5MB download on client startup; high CPU usage parsing 12k players in browser main thread.
- **Rejected**: Causes UI freezing on initial render.

### External Database (MongoDB / PostgreSQL)
- **Pros**: Persistent player storage.
- **Cons**: Adds operational overhead and setup complexity for a local desktop assistant.
- **Rejected**: In-memory JavaScript Map indexing provides faster (<2ms) lookups without database dependencies.

## Consequences
- Fast player lookup speed (<2ms per draft pick sync).
- Server auto-recovers and re-indexes on restart.
- Complete draft coverage for all Sleeper league formats.
