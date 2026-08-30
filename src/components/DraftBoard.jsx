import React, { useState, useMemo, memo } from 'react';
import { Activity, Clock, Grid, List, Radio, X } from 'lucide-react';
import { getTeamStyle } from '../utils/fantasyUtils';
import EmptyState from './common/EmptyState';
import { DraftBoardSkeleton } from './common/Skeleton';

const DraftBoard = memo(function DraftBoard({
  picks = [],
  draftInfo,
  isLoading = false,
  onConnectClick,
  onRemovePick
}) {
  const [boardView, setBoardView] = useState('grid'); // 'grid' | 'stream'

  const teamsCount = draftInfo?.settings?.teams || 12;
  const totalRounds = draftInfo?.settings?.rounds || 15;
  const totalPicks = teamsCount * totalRounds;
  const isSnake = draftInfo?.type !== 'linear';

  // Calculate current pick number
  const currentPickNo = picks.length + 1;
  const currentRound = Math.ceil(currentPickNo / teamsCount);
  const currentPickInRound = ((currentPickNo - 1) % teamsCount) + 1;

  // Map users/display names by slot
  const teamNamesBySlot = useMemo(() => {
    const map = {};
    if (draftInfo?.users && draftInfo?.draft_order) {
      draftInfo.users.forEach((u) => {
        const slot = draftInfo.draft_order[u.user_id];
        if (slot) map[slot] = u.display_name;
      });
    }
    return map;
  }, [draftInfo]);

  // Build grid matrix
  const gridMatrix = useMemo(() => {
    if (!draftInfo) return [];

    const matrix = [];
    for (let r = 1; r <= totalRounds; r++) {
      const roundPicks = [];
      for (let slot = 1; slot <= teamsCount; slot++) {
        // Snake draft logic: odd rounds left-to-right, even rounds right-to-left
        const isReversed = isSnake && r % 2 === 0;
        const pickIndexInRound = isReversed ? (teamsCount - slot) : (slot - 1);
        const pickNo = (r - 1) * teamsCount + pickIndexInRound + 1;
        const pickObj = picks.find(p => p.pick_no === pickNo);

        roundPicks.push({
          round: r,
          slot,
          pickNo,
          pickObj
        });
      }
      matrix.push({ round: r, roundPicks });
    }
    return matrix;
  }, [picks, draftInfo, teamsCount, totalRounds, isSnake]);

  // Reverse picks for recent stream
  const recentPicks = useMemo(() => {
    return [...picks].reverse();
  }, [picks]);

  // Loading state
  if (isLoading) {
    return (
      <section className="glass-panel p-5 mb-6 glass-panel-accent" aria-labelledby="draft-board-heading">
        <DraftBoardSkeleton teams={teamsCount} rounds={4} />
      </section>
    );
  }

  // If no draft is connected, render clean empty state card
  if (!draftInfo) {
    return (
      <section className="glass-panel p-5 mb-6 glass-panel-accent" aria-labelledby="draft-board-heading">
        <h2 id="draft-board-heading" className="text-base sm:text-lg font-extrabold text-white mb-3">Live Draft Board</h2>
        <EmptyState
          icon={Radio}
          title="No Live Draft Connected"
          description="Connect to your Sleeper draft, start a Manual Draft, or launch Mock Draft mode."
          actionLabel={onConnectClick ? "Connect Draft" : undefined}
          onAction={onConnectClick}
        />
      </section>
    );
  }

  return (
    <section className="glass-panel p-5 mb-6 glass-panel-accent" aria-labelledby="draft-board-heading">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="draft-board-heading" className="font-extrabold text-white text-base">
                Live Draft Board
              </h2>
              {draftInfo.isManualDraft && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Manual
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {picks.length} of {totalPicks} picks logged • <span className="capitalize">{draftInfo.type || 'snake'}</span>
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800" role="group" aria-label="Draft Board View Switcher">
            <button
              type="button"
              onClick={() => setBoardView('grid')}
              aria-label="Switch to Grid Board view"
              aria-pressed={boardView === 'grid'}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                boardView === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" aria-hidden="true" /> <span>Grid Board</span>
            </button>
            <button
              type="button"
              onClick={() => setBoardView('stream')}
              aria-label="Switch to Pick Stream view"
              aria-pressed={boardView === 'stream'}
              className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                boardView === 'stream' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" /> <span>Pick Stream</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Pick Indicator Banner (when not in manual mode or alongside) */}
      {!draftInfo.isManualDraft && currentPickNo <= totalPicks && draftInfo.status === 'drafting' && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs shadow-md" role="region" aria-label="On The Clock Status">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
            <div>
              <span className="text-slate-400">ON THE CLOCK:</span>{' '}
              <span className="font-extrabold text-emerald-300 font-mono text-sm">
                Round {currentRound}, Pick {currentPickInRound} (#{currentPickNo})
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
            Live
          </span>
        </div>
      )}

      {/* View Content */}
      {boardView === 'grid' ? (
        /* Full Grid Draft Board */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2 max-h-[440px] overflow-y-auto scrollbar-thin" role="region" aria-label="Draft Grid Matrix">
          <div className="min-w-[720px]">
            {/* Team Headers */}
            <div className="grid gap-1 mb-1.5" style={{ gridTemplateColumns: `40px repeat(${teamsCount}, minmax(0, 1fr))` }}>
              <div className="text-[10px] font-mono font-bold text-slate-500 text-center py-1">Rd</div>
              {Array.from({ length: teamsCount }, (_, i) => i + 1).map(slot => {
                const teamName = teamNamesBySlot[slot];
                return (
                  <div
                    key={slot}
                    title={teamName || `Slot ${slot}`}
                    className="text-[10px] font-bold text-slate-300 text-center py-1 px-0.5 bg-slate-900/80 rounded border border-slate-800 truncate"
                  >
                    {teamName ? teamName.substring(0, 8) : `Slot ${slot}`}
                  </div>
                );
              })}
            </div>

            {/* Rounds Rows */}
            {gridMatrix.map(({ round, roundPicks }) => (
              <div key={round} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `40px repeat(${teamsCount}, minmax(0, 1fr))` }}>
                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center bg-slate-900/40 rounded border border-slate-800/60">
                  R{round}
                </div>

                {roundPicks.map(({ slot, pickNo, pickObj }) => {
                  const meta = pickObj?.metadata || {};
                  const pos = (meta.position || '').toUpperCase();
                  const isCurrent = pickNo === currentPickNo;

                  return (
                    <div
                      key={slot}
                      className={`p-1.5 rounded border text-[10px] flex flex-col justify-between h-14 transition relative group ${
                        isCurrent
                          ? 'border-emerald-400 bg-emerald-950/60 shadow-md shadow-emerald-500/20 animate-pulse'
                          : pickObj
                          ? `badge-pos-${pos} opacity-95`
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] opacity-75">#{pickNo}</span>
                        {pos && <span className="font-mono font-extrabold text-[8px] uppercase">{pos}</span>}
                      </div>

                      {pickObj ? (
                        <div className="font-bold truncate text-[10px] leading-tight text-white">
                          {meta.first_name?.[0]}. {meta.last_name || 'Player'}
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-700 text-center">Empty</div>
                      )}

                      {/* Remove pick button for manual drafts */}
                      {draftInfo.isManualDraft && pickObj && onRemovePick && (
                        <button
                          type="button"
                          onClick={() => onRemovePick(pickNo)}
                          aria-label={`Remove pick #${pickNo}`}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm z-10"
                          title="Remove pick"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Stream List View */
        <div>
          {picks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
              Draft has not started yet or no picks logged so far.
            </div>
          ) : (
            <ul role="list" className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentPicks.map((pick) => {
                const pNo = pick.pick_no;
                const round = Math.ceil(pNo / teamsCount);
                const pickInRound = ((pNo - 1) % teamsCount) + 1;
                const playerMeta = pick.metadata || {};
                const teamStyle = getTeamStyle(playerMeta.team);

                return (
                  <li
                    key={pNo}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition relative group"
                  >
                    {/* Pick Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 text-center font-mono font-extrabold text-slate-300 bg-slate-900 py-1 rounded-lg border border-slate-800 shrink-0">
                        {round}.{pickInRound < 10 ? `0${pickInRound}` : pickInRound}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 truncate">
                          <span>{playerMeta.first_name} {playerMeta.last_name}</span>
                          {playerMeta.position && (
                            <span className={`badge-pos badge-pos-${playerMeta.position} shrink-0`}>
                              {playerMeta.position}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          Picked by{' '}
                          <span className="text-blue-300 font-semibold">
                            {pick.picked_by_name || `Team ${pick.roster_id}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Team Chip, Pick #, & Remove button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {playerMeta.team && (
                        <span
                          className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: teamStyle.bg,
                            borderColor: teamStyle.border,
                            color: teamStyle.text
                          }}
                        >
                          {playerMeta.team}
                        </span>
                      )}
                      <span className="font-mono text-slate-500 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        #{pNo}
                      </span>
                      {draftInfo.isManualDraft && onRemovePick && (
                        <button
                          type="button"
                          onClick={() => onRemovePick(pNo)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                          title={`Remove pick #${pNo}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
});

export default DraftBoard;
