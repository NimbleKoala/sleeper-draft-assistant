import React, { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, CheckCircle2, XCircle, Sparkles, Star, Layers, X } from 'lucide-react';
import { getTeamStyle, calculateTier } from '../utils/fantasyUtils';

export default function BestAvailable({
  rankings,
  manualDraftedIds,
  onToggleManualDrafted,
  starredIds = new Set(),
  onToggleStar
}) {
  const [selectedPos, setSelectedPos] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'table'));
  const [hidePicked, setHidePicked] = useState(true);
  const [groupByTiers, setGroupByTiers] = useState(true);
  const [starredOnly, setStarredOnly] = useState(false);

  // Responsive switch on resize if user hasn't manually toggled
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'table' && !searchQuery) {
        setViewMode('cards');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, searchQuery]);

  // Position options with counts calculation
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

  // Count available players by position
  const posCounts = useMemo(() => {
    const counts = { ALL: 0, QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, K: 0, DEF: 0 };
    rankings.forEach(p => {
      const isManual = manualDraftedIds.has(p.rank);
      const isPicked = p.isPicked || isManual;
      if (hidePicked && isPicked) return;

      const pos = (p.position || '').toUpperCase();
      counts.ALL++;
      if (counts[pos] !== undefined) counts[pos]++;
      if (['RB', 'WR', 'TE'].includes(pos)) counts.FLEX++;
    });
    return counts;
  }, [rankings, hidePicked, manualDraftedIds]);

  // Filter rankings
  const filteredPlayers = useMemo(() => {
    return rankings.filter((player) => {
      // 1. Picked Check
      const isManualDrafted = manualDraftedIds.has(player.rank);
      const isDrafted = player.isPicked || isManualDrafted;
      if (hidePicked && isDrafted) return false;

      // 2. Starred Check
      if (starredOnly && !starredIds.has(player.rank)) return false;

      // 3. Position Filter
      const pos = (player.position || '').toUpperCase();
      if (selectedPos !== 'ALL') {
        if (selectedPos === 'FLEX') {
          if (!['RB', 'WR', 'TE'].includes(pos)) return false;
        } else if (pos !== selectedPos) {
          return false;
        }
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = player.player.toLowerCase().includes(query);
        const teamMatch = (player.team || '').toLowerCase().includes(query);
        const posMatch = (player.position || '').toLowerCase().includes(query);
        if (!nameMatch && !teamMatch && !posMatch) return false;
      }

      return true;
    });
  }, [rankings, selectedPos, searchQuery, hidePicked, manualDraftedIds, starredOnly, starredIds]);

  return (
    <section className="glass-panel p-4 sm:p-5 mb-6 glass-panel-accent" aria-labelledby="best-available-heading">
      {/* Top Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="best-available-heading" className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                Best Available
              </h2>
              <span className="font-mono text-[11px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                <span>{filteredPlayers.length}</span>
                <span>Available</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Hayden Winks PPR Consensus • Sleeper API Matched
            </p>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search player, team, pos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search players by name, position, or team"
              className="input-text w-full pr-8 py-2 text-xs"
              style={{ paddingLeft: '2.6rem' }}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggles Group */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            {/* Starred Only Toggle */}
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`btn text-xs py-1.5 px-2.5 border ${
                starredOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Show target wishlist only"
              aria-label="Toggle target wishlist only filter"
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden xs:inline">Targets</span>
            </button>

            {/* Group By Tiers Toggle */}
            <button
              onClick={() => setGroupByTiers(!groupByTiers)}
              className={`btn text-xs py-1.5 px-2.5 border ${
                groupByTiers
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Toggle Tier Headers"
              aria-label="Toggle tier header grouping"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xs:inline">Tiers</span>
            </button>

            {/* Hide Picked Toggle */}
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer select-none glass-panel px-2.5 py-1.5 bg-slate-950/80 border-slate-800">
              <input
                type="checkbox"
                checked={hidePicked}
                onChange={(e) => setHidePicked(e.target.checked)}
                className="custom-checkbox"
              />
              <span className="text-[11px] sm:text-xs">Hide Drafted</span>
            </label>

            {/* View Switcher */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800" role="group" aria-label="Player view mode toggle">
              <button
                onClick={() => setViewMode('table')}
                aria-label="Switch to Table View"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                aria-label="Switch to Cards View"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Filter Tabs - Touch-Friendly Swipe Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin touch-pan-x" role="group" aria-label="Filter players by position">
        {positions.map((pos) => {
          const count = posCounts[pos] || 0;
          const isActive = selectedPos === pos;

          return (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wide flex items-center gap-1.5 shrink-0 whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50'
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

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr>
                <th className="text-center w-10">Target</th>
                <th className="text-center w-12">Rank</th>
                <th>Player</th>
                <th>Pos</th>
                <th>Team</th>
                <th className="hidden sm:table-cell">Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium text-xs">
                    No available players match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                (() => {
                  let currentTierNum = 0;
                  const rows = [];

                  filteredPlayers.forEach((p) => {
                    const isManual = manualDraftedIds.has(p.rank);
                    const isPicked = p.isPicked || isManual;
                    const isStarred = starredIds.has(p.rank);
                    const tierInfo = calculateTier(p.rank);

                    // Insert non-sticky Tier Header row if tier changes and group-by-tiers is enabled
                    if (groupByTiers && tierInfo.tier !== currentTierNum) {
                      currentTierNum = tierInfo.tier;
                      rows.push(
                        <tr key={`tier-${tierInfo.tier}`}>
                          <td colSpan={7} className={`py-2 px-3 bg-gradient-to-r ${tierInfo.color} border-y text-xs font-extrabold uppercase tracking-wider`}>
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5" />
                              <span>{tierInfo.label}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    let rankClass = "rank-badge";
                    if (p.rank === 1) rankClass = "rank-badge rank-badge-top1";
                    if (p.rank === 2) rankClass = "rank-badge rank-badge-top2";
                    if (p.rank === 3) rankClass = "rank-badge rank-badge-top3";

                    const teamStyle = getTeamStyle(p.team);

                    rows.push(
                      <tr
                        key={p.rank}
                        className={`hover-row transition ${
                          isPicked ? 'opacity-40 bg-slate-950/70 line-through' : ''
                        }`}
                      >
                        {/* Star Wishlist */}
                        <td className="text-center">
                          <button
                            onClick={() => onToggleStar && onToggleStar(p.rank)}
                            className="p-1 rounded hover:bg-slate-800 transition"
                            title={isStarred ? 'Unstar target' : 'Star target'}
                            aria-label={`${isStarred ? 'Remove' : 'Add'} ${p.player} ${isStarred ? 'from' : 'to'} target wishlist`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isStarred
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Rank */}
                        <td className="text-center">
                          <span className={rankClass}>#{p.rank}</span>
                        </td>

                        {/* Player Name & Info */}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm">{p.player}</span>
                            {p.sleeperDetails?.injuryStatus && (
                              <span className="text-[9px] px-1.5 py-0.2 font-extrabold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase shrink-0">
                                {p.sleeperDetails.injuryStatus}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Position Badge */}
                        <td>
                          <span className={`badge-pos badge-pos-${p.position}`}>
                            {p.position}
                          </span>
                        </td>

                        {/* Team Badge with authentic colors */}
                        <td>
                          <span
                            className="text-[10px] sm:text-[11px] font-mono font-extrabold px-1.5 sm:px-2 py-0.5 rounded border inline-block"
                            style={{
                              backgroundColor: teamStyle.bg,
                              borderColor: teamStyle.border,
                              color: teamStyle.text
                            }}
                          >
                            {p.team || 'FA'}
                          </span>
                        </td>

                        {/* Status (Hidden on mobile) */}
                        <td className="hidden sm:table-cell">
                          {isPicked ? (
                            <span className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              {p.pickInfo ? `Picked #${p.pickInfo.pick_no}` : 'Drafted'}
                            </span>
                          ) : (
                            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Available
                            </span>
                          )}
                        </td>

                        {/* Action Toggle */}
                        <td className="text-right">
                          <button
                            onClick={() => onToggleManualDrafted(p.rank)}
                            className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:py-1.5 rounded-lg border transition ${
                              isManual
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {isManual ? 'Unmark' : 'Drafted'}
                          </button>
                        </td>
                      </tr>
                    );
                  });

                  return rows;
                })()
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View (Perfect for Mobile Touch Screens) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto pr-1">
          {filteredPlayers.map((p) => {
            const isManual = manualDraftedIds.has(p.rank);
            const isPicked = p.isPicked || isManual;
            const isStarred = starredIds.has(p.rank);
            const teamStyle = getTeamStyle(p.team);

            return (
              <div
                key={p.rank}
                className={`glass-panel p-3.5 flex flex-col justify-between transition relative ${
                  isPicked ? 'opacity-40 bg-slate-950/80' : 'glass-panel-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                        #{p.rank}
                      </span>
                      <span className={`badge-pos badge-pos-${p.position}`}>
                        {p.position}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleStar && onToggleStar(p.rank)}
                      className="p-1 rounded hover:bg-slate-800 transition"
                      aria-label={`${isStarred ? 'Remove' : 'Add'} ${p.player} ${isStarred ? 'from' : 'to'} target wishlist`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-white text-base truncate">{p.player}</h3>

                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: teamStyle.bg,
                        borderColor: teamStyle.border,
                        color: teamStyle.text
                      }}
                    >
                      {p.team || 'FA'}
                    </span>

                    {p.sleeperDetails?.injuryStatus && (
                      <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                        {p.sleeperDetails.injuryStatus}
                      </span>
                    )}

                    {p.sleeperDetails?.age && (
                      <span className="text-xs text-slate-400">
                        Age {p.sleeperDetails.age}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1 ${isPicked ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isPicked ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Drafted
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => onToggleManualDrafted(p.rank)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition"
                  >
                    {isManual ? 'Unmark' : 'Mark Drafted'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
