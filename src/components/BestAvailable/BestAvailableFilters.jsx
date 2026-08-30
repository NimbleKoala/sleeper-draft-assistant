import React from 'react';
import { Search, Grid, List, Sparkles, Star, Layers, X, Filter } from 'lucide-react';

export default function BestAvailableFilters({
  totalAvailableCount,
  selectedRankingIds,
  activeSortId,
  sortDatasetName,
  searchQuery,
  setSearchQuery,
  starredOnly,
  setStarredOnly,
  groupByTiers,
  setGroupByTiers,
  hidePicked,
  setHidePicked,
  viewMode,
  setViewMode,
  positions,
  selectedPos,
  setSelectedPos,
  posCounts
}) {
  return (
    <div>
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
            <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="best-available-heading" className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                Best Available
              </h2>
              <span className="font-mono text-[11px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                <span>{totalAvailableCount}</span>
                <span>Available</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Comparing <span className="text-blue-300 font-semibold">{selectedRankingIds.length} active rankings</span> • Sorted by <span className="text-amber-300 font-bold">{sortDatasetName || activeSortId}</span>
            </p>
          </div>
        </div>

        {/* Search & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search player, team, pos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search players by name, team, or position"
              className="input-text w-full pr-8 py-2 text-xs"
              style={{ paddingLeft: '2.6rem' }}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" aria-hidden="true" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search input"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded transition"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap sm:flex-nowrap justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setStarredOnly(!starredOnly)}
              aria-pressed={starredOnly}
              aria-label="Toggle target wishlist only filter"
              className={`btn text-xs py-1.5 px-2.5 border transition ${
                starredOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Show target wishlist only"
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} aria-hidden="true" />
              <span className="hidden xs:inline">Targets</span>
            </button>

            <button
              type="button"
              onClick={() => setGroupByTiers(!groupByTiers)}
              aria-pressed={groupByTiers}
              aria-label="Toggle grouping by tier headers"
              className={`btn text-xs py-1.5 px-2.5 border transition ${
                groupByTiers
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Toggle Tier Headers"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span className="hidden xs:inline">Tiers</span>
            </button>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer select-none glass-panel px-2.5 py-1.5 bg-slate-950/80 border-slate-800">
              <input
                type="checkbox"
                checked={hidePicked}
                onChange={(e) => setHidePicked(e.target.checked)}
                className="custom-checkbox"
                aria-label="Hide drafted players"
              />
              <span className="text-[11px] sm:text-xs">Hide Drafted</span>
            </label>

            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800" role="group" aria-label="View mode toggle">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                aria-label="Switch to Table View"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                aria-label="Switch to Cards View"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards View"
              >
                <Grid className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin touch-pan-x" role="tablist" aria-label="Filter by position">
        {positions.map((pos) => {
          const count = posCounts[pos] || 0;
          const isActive = selectedPos === pos;

          return (
            <button
              key={pos}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Filter by ${pos} position (${count} available)`}
              onClick={() => setSelectedPos(pos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide flex items-center gap-1.5 shrink-0 whitespace-nowrap transition ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/50'
                  : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{pos}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
