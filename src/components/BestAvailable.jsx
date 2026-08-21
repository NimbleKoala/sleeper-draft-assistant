import React, { useState, useEffect, useMemo } from 'react';
import { Layers, SearchX } from 'lucide-react';
import { calculateTier } from '../utils/fantasyUtils';
import BestAvailableFilters from './BestAvailable/BestAvailableFilters';
import BestAvailableTableHeader from './BestAvailable/BestAvailableTableHeader';
import BestAvailableTableRow from './BestAvailable/BestAvailableTableRow';
import BestAvailableCard from './BestAvailable/BestAvailableCard';
import { BestAvailableSkeleton } from './common/Skeleton';
import EmptyState from './common/EmptyState';

export default function BestAvailable({
  rankings = [],
  activeDatasetsMap = {},
  selectedRankingIds = ['default'],
  savedRankings = [],
  activeSortKey = { rankingId: 'default', direction: 'asc' },
  onSortChange,
  manualDraftedIds = new Set(),
  onToggleManualDrafted,
  starredIds = new Set(),
  onToggleStar,
  isLoading = false
}) {
  const [selectedPos, setSelectedPos] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'cards' : 'table'));
  const [hidePicked, setHidePicked] = useState(true);
  const [groupByTiers, setGroupByTiers] = useState(true);
  const [starredOnly, setStarredOnly] = useState(false);

  // Responsive switch on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && viewMode === 'table' && !searchQuery) {
        setViewMode('cards');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, searchQuery]);

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

    rankings.forEach(p => {
      const key = p.normalizedName || p.player.toLowerCase();
      playerMap.set(key, {
        ...p,
        ranks: { [selectedRankingIds[0] || 'default']: p.rank }
      });
    });

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
    return combinedPlayerList.filter(p => {
      const primaryRank = p.ranks[selectedRankingIds[0]] || p.rank || 999;
      const isManual = manualDraftedIds.has(primaryRank);
      const isPicked = p.isPicked || isManual;
      const isStarred = starredIds.has(primaryRank);

      if (hidePicked && isPicked) return false;
      if (starredOnly && !isStarred) return false;

      const pos = (p.position || '').toUpperCase();
      if (selectedPos !== 'ALL') {
        if (selectedPos === 'FLEX') {
          if (!['RB', 'WR', 'TE'].includes(pos)) return false;
        } else if (pos !== selectedPos) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (p.player || '').toLowerCase().includes(q);
        const teamMatch = (p.team || '').toLowerCase().includes(q);
        const posMatch = (p.position || '').toLowerCase().includes(q);
        if (!nameMatch && !teamMatch && !posMatch) return false;
      }

      return true;
    });
  }, [combinedPlayerList, hidePicked, starredOnly, selectedPos, searchQuery, manualDraftedIds, starredIds, selectedRankingIds]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPos('ALL');
    setStarredOnly(false);
    setHidePicked(false);
  };

  return (
    <section className="glass-panel p-4 sm:p-5 mb-6 glass-panel-accent" aria-labelledby="best-available-heading">
      {/* Filter & Toolbar Controls */}
      <BestAvailableFilters
        totalAvailableCount={filteredPlayers.length}
        selectedRankingIds={selectedRankingIds}
        activeSortId={activeSortId}
        sortDatasetName={datasetMetaMap[activeSortId]?.name}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        starredOnly={starredOnly}
        setStarredOnly={setStarredOnly}
        groupByTiers={groupByTiers}
        setGroupByTiers={setGroupByTiers}
        hidePicked={hidePicked}
        setHidePicked={setHidePicked}
        viewMode={viewMode}
        setViewMode={setViewMode}
        positions={positions}
        selectedPos={selectedPos}
        setSelectedPos={setSelectedPos}
        posCounts={posCounts}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <BestAvailableSkeleton viewMode={viewMode} />
      ) : filteredPlayers.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={SearchX}
          title="No players match criteria"
          description={
            searchQuery
              ? `No players match your search for "${searchQuery}".`
              : starredOnly
              ? 'No target players found in your starred wishlist for this position.'
              : 'All players matching this position filter have already been drafted.'
          }
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <BestAvailableTableHeader
              selectedRankingIds={selectedRankingIds}
              datasetMetaMap={datasetMetaMap}
              activeSortId={activeSortId}
              activeSortKey={activeSortKey}
              onSortChange={onSortChange}
            />
            <tbody>
              {(() => {
                const seenTiers = new Set();
                const rows = [];
                const isAsc = activeSortKey.direction !== 'desc';

                filteredPlayers.forEach((p) => {
                  const activeRank = p.ranks[activeSortId] ?? p.rank ?? 999;
                  const primaryRank = p.ranks[selectedRankingIds[0]] ?? p.rank ?? 999;

                  const isManual = manualDraftedIds.has(primaryRank);
                  const isPicked = p.isPicked || isManual;
                  const isStarred = starredIds.has(primaryRank);
                  
                  const tierInfo = calculateTier(activeRank);

                  if (groupByTiers && isAsc && !seenTiers.has(tierInfo.tier)) {
                    seenTiers.add(tierInfo.tier);
                    rows.push(
                      <tr key={`tier-${tierInfo.tier}`}>
                        <td colSpan={6 + selectedRankingIds.length} className={`py-2 px-3 bg-gradient-to-r ${tierInfo.color} border-y text-xs font-mono font-extrabold uppercase tracking-wider`}>
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{tierInfo.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  rows.push(
                    <BestAvailableTableRow
                      key={p.normalizedName || p.player}
                      player={p}
                      selectedRankingIds={selectedRankingIds}
                      activeSortId={activeSortId}
                      isPicked={isPicked}
                      isStarred={isStarred}
                      isManual={isManual}
                      primaryRank={primaryRank}
                      onToggleStar={onToggleStar}
                      onToggleManualDrafted={onToggleManualDrafted}
                    />
                  );
                });

                return rows;
              })()}
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

            return (
              <BestAvailableCard
                key={p.normalizedName || p.player}
                player={p}
                selectedRankingIds={selectedRankingIds}
                datasetMetaMap={datasetMetaMap}
                activeSortId={activeSortId}
                isPicked={isPicked}
                isStarred={isStarred}
                isManual={isManual}
                primaryRank={primaryRank}
                onToggleStar={onToggleStar}
                onToggleManualDrafted={onToggleManualDrafted}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
