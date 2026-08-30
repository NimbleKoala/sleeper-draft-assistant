import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, RotateCcw, Sparkles, UserPlus, Search, Download, Settings, Trash2, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { calculatePickDetails } from '../utils/manualDraftUtils';
import { getTeamStyle, normalizePlayerName } from '../utils/fantasyUtils';

export default function ManualDraftControls({
  draftInfo,
  picks = [],
  rankings = [],
  manualDraftedIds = new Set(),
  onMakePick,
  onUndoLastPick,
  onResetDraft,
  onOpenSettings,
  onOpenExport
}) {
  const [quickSearch, setQuickSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const teamsCount = draftInfo?.settings?.teams || 12;
  const totalRounds = draftInfo?.settings?.rounds || 15;
  const totalPicks = teamsCount * totalRounds;
  const draftType = draftInfo?.type || 'snake';

  const currentPickNo = picks.length + 1;
  const isDraftComplete = picks.length >= totalPicks;

  const currentPickDetails = useMemo(() => {
    if (isDraftComplete) return null;
    return calculatePickDetails(currentPickNo, teamsCount, draftType);
  }, [currentPickNo, teamsCount, draftType, isDraftComplete]);

  // Find team user on the clock
  const teamOnClock = useMemo(() => {
    if (!currentPickDetails || !draftInfo?.users) return null;
    const slot = currentPickDetails.slot;
    const user = draftInfo.users.find(u => draftInfo.draft_order?.[u.user_id] === slot) ||
                 draftInfo.users[slot - 1];
    return {
      slot,
      name: user?.display_name || `Team ${slot}`,
      isMe: slot === draftInfo.myDraftSlot
    };
  }, [currentPickDetails, draftInfo]);

  // Comprehensive lookup map for picks across multiple keys
  const picksMap = useMemo(() => {
    const map = new Map();
    picks.forEach(p => {
      const meta = p.metadata || {};
      const fullName = (meta.player_name || `${meta.first_name || ''} ${meta.last_name || ''}`).trim();
      const norm1 = meta.normalized_name || normalizePlayerName(fullName);
      const norm2 = normalizePlayerName(`${meta.first_name || ''} ${meta.last_name || ''}`);
      const pos = (meta.position || '').toUpperCase();
      const team = (meta.team || '').toUpperCase();

      if (norm1) {
        map.set(norm1, p);
        if (pos) map.set(`${norm1}_${pos}`, p);
      }
      if (norm2) {
        map.set(norm2, p);
        if (pos) map.set(`${norm2}_${pos}`, p);
      }
      if (fullName) {
        map.set(fullName.toLowerCase().trim(), p);
      }
      if (p.player_id) {
        map.set(String(p.player_id), p);
      }
      if (pos === 'DEF' && team) {
        map.set(`DEF_${team}`, p);
        map.set(`${team}_DEF`, p);
      }
    });
    return map;
  }, [picks]);

  // Filter unpicked players for quick search & next best available
  const availablePlayers = useMemo(() => {
    if (!rankings || rankings.length === 0) return [];

    return rankings.filter(p => {
      const norm = p.normalizedName || normalizePlayerName(p.player);
      const pos = (p.position || '').toUpperCase();
      const team = (p.team || '').toUpperCase();
      const rawLower = (p.player || '').toLowerCase().trim();

      const isPicked = Boolean(
        p.isPicked ||
        manualDraftedIds.has(p.rank) ||
        (p.sleeperId && picksMap.has(String(p.sleeperId))) ||
        (pos && picksMap.has(`${norm}_${pos}`)) ||
        picksMap.has(norm) ||
        picksMap.has(rawLower) ||
        (pos === 'DEF' && team && (picksMap.has(`DEF_${team}`) || picksMap.has(`${team}_DEF`)))
      );

      return !isPicked;
    });
  }, [rankings, picksMap, manualDraftedIds]);

  const searchResults = useMemo(() => {
    if (!quickSearch.trim()) return availablePlayers.slice(0, 6);
    const q = quickSearch.toLowerCase().trim();
    return availablePlayers.filter(p => {
      const nameMatch = (p.player || '').toLowerCase().includes(q);
      const teamMatch = (p.team || '').toLowerCase().includes(q);
      const posMatch = (p.position || '').toLowerCase().includes(q);
      return nameMatch || teamMatch || posMatch;
    }).slice(0, 8);
  }, [quickSearch, availablePlayers]);

  const topAvailablePlayer = availablePlayers[0] || null;

  // Handle outside click to close quick search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPlayer = (player) => {
    if (!player || isDraftComplete) return;
    onMakePick(player);
    setQuickSearch('');
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectPlayer(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
  const progressPct = Math.min(100, Math.round((picks.length / totalPicks) * 100));

  return (
    <div className="glass-panel p-4 md:p-5 mb-6 border border-blue-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-blue-950/40 shadow-xl shadow-blue-950/30 rounded-2xl relative overflow-hidden" role="region" aria-label="Manual Draft Cockpit Controls">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Top Row: Clock Banner & Draft Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isDraftComplete
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : teamOnClock?.isMe
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
          }`}>
            <Clock className="w-6 h-6" aria-hidden="true" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Manual Draft Session
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {draftInfo?.metadata?.name || 'Offline Draft'} • <span className="capitalize">{draftType}</span>
              </span>
              {teamOnClock?.isMe && !isDraftComplete && (
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-bounce">
                  🎯 YOUR TURN TO PICK!
                </span>
              )}
            </div>

            {isDraftComplete ? (
              <h2 className="text-lg md:text-xl font-extrabold text-emerald-300 tracking-tight mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Draft Complete! ({totalPicks} of {totalPicks} picks logged)
              </h2>
            ) : (
              <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  ON THE CLOCK:
                </h2>
                <span className="font-extrabold text-blue-400 font-mono text-base md:text-lg">
                  Round {currentPickDetails.round}, Pick {currentPickDetails.pickInRound} (#{currentPickNo})
                </span>
                <span className="text-slate-400 text-sm">→</span>
                <span className="font-bold text-white bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700 text-sm">
                  {teamOnClock?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress & Quick Stats */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2 min-w-[200px]">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">Progress:</span>
            <span className="font-mono font-extrabold text-white">
              {picks.length} / {totalPicks} Picks ({progressPct}%)
            </span>
          </div>
          <div className="w-full sm:w-48 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isDraftComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Quick Pick Search & Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 relative z-20">
        {/* Quick Search & Draft Bar */}
        {!isDraftComplete ? (
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Draft player to ${teamOnClock?.name || 'clock'}...`}
                value={quickSearch}
                onChange={(e) => {
                  setQuickSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleKeyDown}
                aria-label="Quick search and draft player"
                className="input-text w-full pr-10 py-2.5 text-xs bg-slate-950 font-medium placeholder-slate-500 border-blue-500/40 focus:border-blue-400"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search className="w-4 h-4 text-blue-400 absolute left-3 top-3 pointer-events-none" aria-hidden="true" />
              <button
                type="button"
                onClick={() => {
                  if (searchResults.length > 0) handleSelectPlayer(searchResults[0]);
                }}
                className="absolute right-2 top-2 btn btn-primary text-[11px] py-1 px-2.5 font-bold"
                title="Draft top match"
              >
                Draft
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Available Players ({searchResults.length}):</span>
                  <span className="text-slate-500 font-mono text-[9px]">Press Enter to Draft Top Match</span>
                </div>
                {searchResults.map((p, idx) => {
                  const teamStyle = getTeamStyle(p.team);
                  return (
                    <div
                      key={p.rank || p.player}
                      onClick={() => handleSelectPlayer(p)}
                      className={`p-2.5 hover:bg-blue-600/20 border-b border-slate-900/80 cursor-pointer flex items-center justify-between transition group ${
                        idx === 0 ? 'bg-blue-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-blue-400 font-extrabold text-xs shrink-0">
                          #{p.rank}
                        </span>
                        <span className={`badge-pos badge-pos-${p.position} shrink-0 text-[10px]`}>
                          {p.position}
                        </span>
                        <span className="font-bold text-white text-xs truncate group-hover:text-blue-300">
                          {p.player}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {p.team && (
                          <span
                            className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded border"
                            style={{
                              backgroundColor: teamStyle.bg,
                              borderColor: teamStyle.border,
                              color: teamStyle.text
                            }}
                          >
                            {p.team}
                          </span>
                        )}
                        <span className="btn btn-primary text-[10px] py-0.5 px-2 font-bold opacity-80 group-hover:opacity-100">
                          Pick
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>All draft slots filled. Review board or export summary below.</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          {/* Quick Draft Next Best Available */}
          {!isDraftComplete && topAvailablePlayer && (
            <button
              type="button"
              onClick={() => handleSelectPlayer(topAvailablePlayer)}
              className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-blue-300 hover:text-white border-blue-500/30 hover:border-blue-400"
              title={`Draft #${topAvailablePlayer.rank} ${topAvailablePlayer.player} (${topAvailablePlayer.position}) to ${teamOnClock?.name}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>Draft Next Best (#{topAvailablePlayer.rank})</span>
            </button>
          )}

          {/* Undo Last Pick */}
          <button
            type="button"
            onClick={onUndoLastPick}
            disabled={picks.length === 0}
            className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-slate-300 hover:text-amber-300 disabled:opacity-40 disabled:hover:text-slate-300"
            title={lastPick ? `Undo Pick #${lastPick.pick_no} (${lastPick.metadata?.first_name} ${lastPick.metadata?.last_name})` : 'No picks to undo'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Undo Pick</span>
            {lastPick && (
              <span className="font-mono text-[10px] opacity-75 hidden sm:inline">
                (#{lastPick.pick_no})
              </span>
            )}
          </button>

          {/* Export Draft Results */}
          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 border-emerald-500/30"
            title="Export draft picks as CSV or text"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Export</span>
          </button>

          {/* Settings / Edit Teams */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-slate-300 hover:text-white"
            title="Edit draft settings and team names"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Settings</span>
          </button>

          {/* Reset Draft */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-950/80 p-1 rounded-xl border border-rose-500/50">
              <span className="text-[11px] font-bold text-rose-300 px-2">Reset all picks?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDraft();
                  setShowResetConfirm(false);
                }}
                className="btn text-xs py-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn btn-secondary text-xs py-1 px-2 text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              disabled={picks.length === 0}
              className="btn btn-secondary text-xs py-2 px-2.5 text-slate-400 hover:text-rose-400 disabled:opacity-30"
              title="Reset and clear all picks"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
