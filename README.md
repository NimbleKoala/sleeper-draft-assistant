# 🏈 Sleeper Draft Assistant

> **Real-Time Live Player Value Engine & Tier Assistant for Sleeper Fantasy Football Drafts**

Sleeper Draft Assistant is a modern, high-performance fantasy draft assistant application built with React, Vite, Tailwind CSS v3, and an Express backend proxy server. It matches Sleeper live draft picks in real-time against expert rankings (Hayden Winks PPR Consensus), displaying tier dividers, target wishlists, live draft board matrix grids, and AI-powered value target recommendations.

---

## ⚡ Quick Start

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/NimbleKoala/sleeper-draft-assistant.git
cd sleeper-draft-assistant
npm install
```

### 2. Run Development Server
Start both the Express proxy server (port 3001) and Vite dev server (port 5173):
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 🛠 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Express server + Vite frontend concurrently |
| `npm run server` | Start Express backend proxy server (`server.js`) |
| `npm run build` | Compile production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

---

## 🚀 Key Features

- **Live Sleeper Sync**: Connect any Sleeper draft via Username or Draft ID with 1-click reconnect history.
- **Auto User Slot Detection**: Automatically detects your username (**`NimbleKoala`**) and jumps to your draft slot.
- **Hayden Winks PPR Rankings**: Pre-loaded 300-player consensus rankings with Tier 1–8 dividers.
- **AI Value Target Engine**: Highlights top recommended available targets tailored to your roster needs.
- **Interactive Draft Board Matrix**: Round-by-round snake draft board grid with live "On The Clock" banner.
- **Target Wishlist Starring**: Star key targets to highlight them across views.
- **Mobile Touch Optimized**: Responsive layout with automatic 1-tap card view on mobile screens.

---

## 🏗 Architecture Overview

```
sleeper-draft-assistant/
├── server.js                        # Express backend proxy & 12k Sleeper player indexer
├── src/
│   ├── config/appConfig.js          # Centralized username & app settings template
│   ├── utils/fantasyUtils.js        # NFL team color tokens & Tier calculation logic
│   ├── components/
│   │   ├── Header.jsx               # Navigation, live draft status badge & controls
│   │   ├── BestAvailable.jsx        # Best available player stream, search & tiers
│   │   ├── MyRosterTracker.jsx      # Positional progress bars & AI recommendations
│   │   ├── DraftBoard.jsx           # Round-by-round draft grid & live pick stream
│   │   ├── DraftConnectModal.jsx    # Sleeper connect modal with recent drafts history
│   │   └── RankingsManagerModal.jsx # Custom CSV uploader & default rankings reload
│   ├── App.jsx                      # Main app dashboard & notification state
│   └── index.css                    # Tailwind CSS v3 directives & glassmorphism styles
└── docs/decisions/                  # Architecture Decision Records (ADRs)
```

For detailed design decisions, refer to:
- [ADR-001: Sleeper API Integration & In-Memory Player Indexing](docs/decisions/0001-sleeper-api-and-player-indexing.md)
- [ADR-002: Tailwind CSS v3 Design System & Responsive Roster Tracking](docs/decisions/0002-react-ui-design-and-roster-tracking.md)

---

## 📄 License
MIT License. Created for fantasy football enthusiasts.
