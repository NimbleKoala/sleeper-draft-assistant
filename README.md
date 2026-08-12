# 🏈 Sleeper Draft Assistant

> **Real-Time Live Player Value Engine, Multi-Rankings Comparison & Tier Assistant for Sleeper Fantasy Football Drafts**

Sleeper Draft Assistant is a modern, high-performance fantasy draft assistant application built with React, Vite, Tailwind CSS v3, and an Express backend proxy server. It matches Sleeper live draft picks in real-time against expert rankings (Hayden Winks PPR Consensus, ADP Consensus, and custom sets), displaying side-by-side multi-ranking columns, 1-click header sorting, tier dividers, target wishlists, live draft board matrix grids, and AI-powered value target recommendations.

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

## 🐳 Docker Setup

You can run Sleeper Draft Assistant using Docker without needing a local Node.js installation.

### Option A: Using Docker Compose (Recommended)

1. **Start the container**:
   ```bash
   docker compose up -d --build
   ```
2. **Access the app**:
   Open **[http://localhost:3001/](http://localhost:3001/)** in your browser.
3. **Stop the container**:
   ```bash
   docker compose down
   ```

> **Note**: `docker-compose.yml` mounts `./rankings.csv` into the container, allowing custom rankings updates without rebuilding the image.

### Option B: Using Docker CLI

1. **Build the image**:
   ```bash
   docker build -t sleeper-draft-assistant .
   ```
2. **Run the container**:
   ```bash
   docker run -d -p 3001:3001 --name sleeper-draft-assistant sleeper-draft-assistant
   ```
3. **Access the app**:
   Open **[http://localhost:3001/](http://localhost:3001/)** in your browser.

---

## 🛠 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Express server + Vite frontend concurrently |
| `npm run server` | Start Express backend proxy server (`server.js`) |
| `npm run build` | Compile production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `node .agents/skills/rankings-csv-converter/scripts/convert_rankings.js <input> [output]` | Convert raw TSV/web table text to standard rankings CSV |

---

## 🚀 Key Features

- **Live Sleeper Sync**: Connect any Sleeper draft via Username or Draft ID with 1-click reconnect history.
- **Multi-Rankings Server Storage**: Save and manage multiple ranking datasets on the backend server.
- **Side-by-Side Comparison (Up to 3 Rankings)**: Select up to 3 rankings concurrently to compare ranks and expert consensus.
- **1-Click Header Sorting**: Click any ranking column header in the player table to instantly re-sort available targets.
- **Rankings CSV Converter Skill**: Automated script to convert raw TSV/copied web text, normalize player names (`Last, First` ➔ `First Last`), and standardize NFL team codes.
- **Hayden Winks PPR Rankings**: Pre-loaded 300-player consensus rankings with Tier 1–8 dividers.
- **AI Value Target Engine**: Highlights top recommended available targets tailored to your roster needs.
- **Interactive Draft Board Matrix**: Round-by-round snake draft board grid with live "On The Clock" banner.
- **Target Wishlist Starring**: Star key targets to highlight them across views.
- **Mobile Touch Optimized**: Responsive layout with automatic 1-tap card view on mobile screens.

---

## 🏗 Architecture Overview

```
sleeper-draft-assistant/
├── server.js                          # Express backend proxy & multi-dataset manager
├── data/
│   └── rankings/                      # Server-side persistent directory for CSV datasets
│       ├── manifest.json              # Saved dataset metadata index
│       └── default.csv                # Hayden Winks 2026 PPR consensus CSV
├── .agents/skills/
│   └── rankings-csv-converter/        # Workspace conversion skill & script
│       ├── SKILL.md                   # Skill instructions & usage runbook
│       └── scripts/convert_rankings.js # Executable Node.js parser & normalizer
├── src/
│   ├── config/appConfig.js            # Centralized username & app settings template
│   ├── utils/fantasyUtils.js          # NFL team color tokens & Tier calculation logic
│   ├── components/
│   │   ├── Header.jsx                 # Navigation, live draft status badge & controls
│   │   ├── BestAvailable.jsx          # Multi-column player table & 1-click header sorting
│   │   ├── MyRosterTracker.jsx        # Positional progress bars & AI recommendations
│   │   ├── DraftBoard.jsx             # Round-by-round draft grid & live pick stream
│   │   ├── DraftConnectModal.jsx      # Sleeper connect modal with recent drafts history
│   │   └── RankingsManagerModal.jsx   # Select up to 3 rankings, upload & delete custom CSVs
│   ├── App.jsx                        # Main app dashboard & multi-ranking state
│   └── index.css                      # Tailwind CSS v3 directives & glassmorphism styles
└── docs/decisions/                    # Architecture Decision Records (ADRs)
```

For detailed design decisions, refer to:
- [ADR-001: Sleeper API Integration & In-Memory Player Indexing](docs/decisions/0001-sleeper-api-and-player-indexing.md)
- [ADR-002: Tailwind CSS v3 Design System & Responsive Roster Tracking](docs/decisions/0002-react-ui-design-and-roster-tracking.md)
- [ADR-003: Server-Side Multi-Rankings Comparison & CSV Converter Skill](docs/decisions/0003-server-side-multi-rankings-and-converter-skill.md)

---

## 📄 License
MIT License. Created for fantasy football enthusiasts.
