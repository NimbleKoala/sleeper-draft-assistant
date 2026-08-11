import React, { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, CheckCircle2, XCircle, Sparkles, Star, Layers, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getTeamStyle, calculateTier } from '../utils/fantasyUtils';

export default function BestAvailable({
  rankings = [],
  activeDatasetsMap = {},
  selectedRankingIds = ['default'],
  savedRankings = [],
  activeSortKey = { rankingId: 'default', direction: 'asc' },
  onSortChange,
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

  // Position options
  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

  // Map dataset metadata by ID for easy title lookup
  const datasetMetaMap = useMemo(() => {
    const map = {};
    savedRankings.forEach(meta => {
      map[meta.id] = meta;
    });
    return map;
  }, [savedRankings]);

  // Active sort ID helper
  const activeSortId = useMemo(() => {
    return activeSortKey.rankingId || selectedRankingIds[0] || 'default';
  }, [activeSortKey, selectedRankingIds]);

  // Compute unified multi-ranking player list
  const combinedPlayerList = useMemo(() => {
    if (!rankings || rankings.length === 0) return [];

    const playerMap = new Map();

    // 1. First add primary rankings
    rankings.forEach(p => {
      const key = p.normalizedName || p.player.toLowerCase();
      playerMap.set(key, {
        ...p,
        ranks: { [selectedRankingIds[0] || 'default']: p.rank }
      });
    });

    // 2. Merge secondary/tertiary rankings
    selectedRankingIds.slice(1).forEach(id => {
      const dataset = activeDatasetsMap[id];
      if (!dataset || !dataset.rankingsWithDraftStatus) return;

      dataset.rankingsWithDraftStatus.forEach(p => {
        const key = p.normalizedName || p.player.toLowerCase();
        if (playerMap.has(key)) {
          playerMap.get(key).ranks[id] = p.rank;
        } else {
          playerMap.set(key, {
            ...p,
            ranks: { [id]: p.rank }
          });
        }
      });
    });

    const list = Array.from(playerMap.values());

    // 3. Sort by activeSortId
    const isAsc = activeSortKey.direction !== 'desc';

    list.sort((a, b) => {
      const rankA = a.ranks[activeSortId] ?? 999;
      const rankB = b.ranks[activeSortId] ?? 999;

      if (rankA !== rankB) {
        return isAsc ? rankA - rankB : rankB - rankA;
      }
      return (a.rank || 999) - (b.rank || 999);
    });

    return list;
  }, [rankings, activeDatasetsMap, selectedRankingIds, activeSortId, activeSortKey]);

  // Count available players by position
  const posCounts = useMemo(() => {
    const counts = { ALL: 0, QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, K: 0, DEF: 0 };
    combinedPlayerList.forEach(p => {
      const primaryRank = p.ranks[selectedRankingIds[0]] || p.rank || 999;
      const isManual = manualDraftedIds.has(primaryRank);
      const isPicked = p.isPicked || isManual;
      if (hidePicked && isPicked) return;

      const pos = (p.position || '').toUpperCase();
      counts.ALL++;
      if (counts[pos] !== undefined) counts[pos]++;
      if (['RB', 'WR', 'TE'].includes(pos)) counts.FLEX++;
    });
    return counts;
  }, [combinedPlayerList, hidePicked, manualDraftedIds, selectedRankingIds]);

  // Filter player list
  const filteredPlayers = useMemo(() => {
    return combinedPlayerList.filter((player) => {
      const primaryRank = player.ranks[selectedRankingIds[0]] || player.rank || 999;
      const isManualDrafted = manualDraftedIds.has(primaryRank);
      const isDrafted = player.isPicked || isManualDrafted;
      if (hidePicked && isDrafted) return false;

      if (starredOnly && !starredIds.has(primaryRank)) return false;

      const pos = (player.position || '').toUpperCase();
      if (selectedPos !== 'ALL') {
        if (selectedPos === 'FLEX') {
          if (!['RB', 'WR', 'TE'].includes(pos)) return false;
        } else if (pos !== selectedPos) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = player.player.toLowerCase().includes(query);
        const teamMatch = (player.team || '').toLowerCase().includes(query);
        const posMatch = (player.position || '').toLowerCase().includes(query);
        if (!nameMatch && !teamMatch && !posMatch) return false;
      }

      return true;
    });
  }, [combinedPlayerList, selectedPos, searchQuery, hidePicked, manualDraftedIds, starredOnly, starredIds, selectedRankingIds]);

  return (
    <section className="glass-panel p-4 sm:p-5 mb-6 glass-panel-accent" aria-labelledby="best-available-heading">
      {/* Top Header */}
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
              Comparing <span className="text-blue-300 font-semibold">{selectedRankingIds.length} active rankings</span> • Sorted by <span className="text-amber-300 font-bold">{datasetMetaMap[activeSortId]?.name || activeSortId}</span>
            </p>
          </div>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search player, team, pos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-text w-full pr-8 py-2 text-xs"
              style={{ paddingLeft: '2.6rem' }}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`btn text-xs py-1.5 px-2.5 border ${
                starredOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Show target wishlist only"
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden xs:inline">Targets</span>
            </button>

            <button
              onClick={() => setGroupByTiers(!groupByTiers)}
              className={`btn text-xs py-1.5 px-2.5 border ${
                groupByTiers
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'btn-secondary text-slate-400'
              }`}
              title="Toggle Tier Headers"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xs:inline">Tiers</span>
            </button>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer select-none glass-panel px-2.5 py-1.5 bg-slate-950/80 border-slate-800">
              <input
                type="checkbox"
                checked={hidePicked}
                onChange={(e) => setHidePicked(e.target.checked)}
                className="custom-checkbox"
              />
              <span className="text-[11px] sm:text-xs">Hide Drafted</span>
            </label>

            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800" role="group">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
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

      {/* Position Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin touch-pan-x" role="group">
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
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800">
                <th className="text-center w-10 py-3">Target</th>
                
                {/* Dynamically Render Header for Each Selected Ranking */}
                {selectedRankingIds.map((id, index) => {
                  const meta = datasetMetaMap[id] || { name: id === 'default' ? 'Winks PPR' : `Rank ${index + 1}` };
                  const isCurrentSort = activeSortId === id;

                  return (
                    <th key={id} className="text-center py-3 px-2">
                      <button
                        onClick={() => onSortChange && onSortChange(id)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-extrabold transition ${
                          isCurrentSort
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                        title={`Click to sort by ${meta.name}`}
                      >
                        <span className="truncate max-w-[120px]">{meta.name}</span>
                        {isCurrentSort ? (
                          activeSortKey.direction === 'desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-200" />
                          ) : (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-200" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </th>
                  );
                })}

                <th className="py-3 px-3">Player</th>
                <th className="py-3 px-2">Pos</th>
                <th className="py-3 px-2">Team</th>
                <th className="hidden sm:table-cell py-3 px-3">Status</th>
                <th className="text-right py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6 + selectedRankingIds.length} className="py-12 text-center text-slate-500 font-medium text-xs">
                    No available players match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                (() => {
                  const seenTiers = new Set();
                  const rows = [];
                  const isAsc = activeSortKey.direction !== 'desc';

                  filteredPlayers.forEach((p) => {
                    const activeRank = p.ranks[activeSortId] ?? p.rank ?? 999;
                    const primaryRank = p.ranks[selectedRankingIds[0]] ?? p.rank ?? 999;

                    const isManual = manualDraftedIds.has(primaryRank);
                    const isPicked = p.isPicked || isManual;
                    const isStarred = starredIds.has(primaryRank);
                    
                    // Calculate Tier based on the ACTIVE SORTED RANKING
                    const tierInfo = calculateTier(activeRank);

                    // Render Tier Header once per tier when grouping is enabled and sorting ascending
                    if (groupByTiers && isAsc && !seenTiers.has(tierInfo.tier)) {
                      seenTiers.add(tierInfo.tier);
                      rows.push(
                        <tr key={`tier-${tierInfo.tier}`}>
                          <td colSpan={6 + selectedRankingIds.length} className={`py-2 px-3 bg-gradient-to-r ${tierInfo.color} border-y text-xs font-extrabold uppercase tracking-wider`}>
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5" />
                              <span>{tierInfo.label}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const teamStyle = getTeamStyle(p.team);

                    rows.push(
                      <tr
                        key={p.normalizedName || p.player}
                        className={`hover-row transition ${
                          isPicked ? 'opacity-40 bg-slate-950/70 line-through' : ''
                        }`}
                      >
                        {/* Star Wishlist */}
                        <td className="text-center">
                          <button
                            onClick={() => onToggleStar && onToggleStar(primaryRank)}
                            className="p-1 rounded hover:bg-slate-800 transition"
                            title={isStarred ? 'Unstar target' : 'Star target'}
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

                        {/* Render Rank Badges for Each Selected Ranking */}
                        {selectedRankingIds.map((id) => {
                          const r = p.ranks[id];
                          const isSortActive = activeSortId === id;

                          return (
                            <td key={id} className="text-center py-2 px-2">
                              {r ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-mono font-extrabold text-xs border ${
                                    isSortActive
                                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                                      : 'bg-slate-900 text-slate-300 border-slate-800'
                                  }`}
                                >
                                  #{r}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs font-mono">N/A</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Player Name & Info */}
                        <td className="py-2 px-3">
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
                        <td className="py-2 px-2">
                          <span className={`badge-pos badge-pos-${p.position}`}>
                            {p.position}
                          </span>
                        </td>

                        {/* Team Badge */}
                        <td className="py-2 px-2">
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

                        {/* Status */}
                        <td className="hidden sm:table-cell py-2 px-3">
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
                        <td className="text-right py-2 px-3">
                          <button
                            onClick={() => onToggleManualDrafted(primaryRank)}
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
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[650px] overflow-y-auto pr-1">
          {filteredPlayers.map((p) => {
            const primaryRank = p.ranks[selectedRankingIds[0]] || p.rank || 999;
            const isManual = manualDraftedIds.has(primaryRank);
            const isPicked = p.isPicked || isManual;
            const isStarred = starredIds.has(primaryRank);
            const teamStyle = getTeamStyle(p.team);

            return (
              <div
                key={p.normalizedName || p.player}
                className={`glass-panel p-3.5 flex flex-col justify-between transition relative ${
                  isPicked ? 'opacity-40 bg-slate-950/80' : 'glass-panel-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {/* Multi-Ranking Badges on Mobile Card */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedRankingIds.map((id) => {
                        const r = p.ranks[id];
                        const meta = datasetMetaMap[id];
                        const label = meta ? meta.name.substring(0, 8) : id;
                        const isSortActive = activeSortId === id;

                        return r ? (
                          <span
                            key={id}
                            className={`font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded border ${
                              isSortActive
                                ? 'bg-blue-600 text-white border-blue-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            #{r} <span className="opacity-60 text-[9px]">{label}</span>
                          </span>
                        ) : null;
                      })}
                      <span className={`badge-pos badge-pos-${p.position}`}>
                        {p.position}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleStar && onToggleStar(primaryRank)}
                      className="p-1 rounded hover:bg-slate-800 transition"
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
                    onClick={() => onToggleManualDrafted(primaryRank)}
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
