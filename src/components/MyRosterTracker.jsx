import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Award, Sparkles, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { getTeamStyle } from '../utils/fantasyUtils';
import { getStoredUsername, PREFERRED_USERNAME } from './DraftConnectModal';

export default function MyRosterTracker({ draftInfo, picks = [], rankings = [], manualDraftedIds = new Set() }) {
  const [selectedSlot, setSelectedSlot] = useState(1);

  // Extract all rosters / users from draftInfo sorted strictly by draft slot (1, 2, 3...)
  const rosters = useMemo(() => {
    if (!draftInfo) return [{ rosterId: 1, slot: 1, userId: null, name: `Slot 1: ${PREFERRED_USERNAME}` }];
    const users = draftInfo.users || [];
    const teamsCount = draftInfo.settings?.teams || 12;
    const draftOrder = draftInfo.draft_order || {};
    const slotToRoster = draftInfo.slot_to_roster_id || {};

    const list = [];
    for (let slot = 1; slot <= teamsCount; slot++) {
      // Match user by draft_order[user.user_id] === slot
      const user = users.find(u => draftOrder[u.user_id] === slot);
      const rosterId = slotToRoster[slot] || slot;
      const teamName = user
        ? (user.metadata?.team_name || user.display_name || user.username)
        : `Team ${slot}`;

      list.push({
        slot: Number(slot),
        rosterId: Number(rosterId),
        userId: user ? user.user_id : null,
        name: `Slot ${slot}: ${teamName}`
      });
    }

    // Sort strictly in numerical order by Draft Slot (Slot 1, Slot 2, Slot 3...)
    return list.sort((a, b) => a.slot - b.slot);
  }, [draftInfo]);

  // Automatically detect & jump to NimbleKoala's draft slot on connect
  useEffect(() => {
    if (draftInfo && draftInfo.users && draftInfo.draft_order) {
      const preferredUsername = (getStoredUsername() || PREFERRED_USERNAME).toLowerCase();

      // Find user matching NimbleKoala by username, display_name, or user_id
      const myUser = draftInfo.users.find(u => 
        (u.username && u.username.toLowerCase() === preferredUsername) ||
        (u.display_name && u.display_name.toLowerCase() === preferredUsername)
      ) || draftInfo.users.find(u => u.user_id === draftInfo.user_id);

      if (myUser && draftInfo.draft_order[myUser.user_id]) {
        const mySlot = Number(draftInfo.draft_order[myUser.user_id]);
        setSelectedSlot(mySlot);
      }
    }
  }, [draftInfo]);

  // Find currently selected roster object
  const selectedRoster = useMemo(() => {
    return rosters.find(r => r.slot === Number(selectedSlot)) || rosters[0];
  }, [rosters, selectedSlot]);

  // Find picks made strictly by the selected roster slot
  const myPicks = useMemo(() => {
    if (!picks || !selectedRoster) return [];

    return picks.filter(p => {
      // 1. Match by picked_by user_id if present
      if (selectedRoster.userId && p.picked_by) {
        if (p.picked_by === selectedRoster.userId) return true;
      }
      // 2. Match by draft_slot
      if (p.draft_slot !== undefined && p.draft_slot !== null) {
        if (Number(p.draft_slot) === selectedRoster.slot) return true;
      }
      // 3. Fallback match by roster_id if draft_slot is missing
      if (p.roster_id !== undefined && p.roster_id !== null) {
        if (Number(p.roster_id) === selectedRoster.rosterId) return true;
      }
      return false;
    });
  }, [picks, selectedRoster]);

  // Positional counts
  const posCounts = useMemo(() => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
    myPicks.forEach(p => {
      const pos = (p.metadata?.position || '').toUpperCase();
      if (counts[pos] !== undefined) {
        counts[pos]++;
      }
    });
    return counts;
  }, [myPicks]);

  // Positional Targets for Standard PPR Roster
  const posTargets = { QB: 1, RB: 4, WR: 5, TE: 1, K: 1, DEF: 1 };

  // AI Draft Recommendations based on current roster state & best available rankings
  const draftRecommendations = useMemo(() => {
    const totalPicks = myPicks.length;
    const adviceList = [];

    // Urgent Needs
    if (posCounts.RB < 2) adviceList.push({ pos: 'RB', text: `Need ${2 - posCounts.RB} starting RB(s)`, priority: 'HIGH' });
    if (posCounts.WR < 3) adviceList.push({ pos: 'WR', text: `Need ${3 - posCounts.WR} starting WR(s)`, priority: 'HIGH' });
    if (posCounts.QB === 0 && totalPicks >= 5) adviceList.push({ pos: 'QB', text: 'Target starting QB soon', priority: 'MEDIUM' });
    if (posCounts.TE === 0 && totalPicks >= 6) adviceList.push({ pos: 'TE', text: 'Target elite TE value drop', priority: 'MEDIUM' });

    // Top recommended available player for needed position
    const recommendedPlayers = [];
    if (rankings && rankings.length > 0) {
      const neededPosList = [];
      if (posCounts.RB < 3) neededPosList.push('RB');
      if (posCounts.WR < 4) neededPosList.push('WR');
      if (posCounts.TE === 0 && totalPicks >= 4) neededPosList.push('TE');
      if (posCounts.QB === 0 && totalPicks >= 4) neededPosList.push('QB');

      const unpicked = rankings.filter(p => {
        const isManual = manualDraftedIds.has(p.rank);
        return !p.isPicked && !isManual;
      });

      for (const pos of neededPosList) {
        const topPosPlayer = unpicked.find(p => p.position === pos);
        if (topPosPlayer && recommendedPlayers.length < 2) {
          recommendedPlayers.push(topPosPlayer);
        }
      }
    }

    return { adviceList, recommendedPlayers };
  }, [posCounts, myPicks, rankings, manualDraftedIds]);

  return (
    <section className="glass-panel p-5 mb-6 glass-panel-accent" aria-labelledby="roster-tracker-heading">
      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <UserCheck className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h3 id="roster-tracker-heading" className="font-extrabold text-white text-base">Roster Tracker</h3>
            <p className="text-[11px] text-slate-400">Positional Counts & Value Engine</p>
          </div>
        </div>

        {rosters.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="roster-team-select" className="text-slate-400 font-semibold">Team:</label>
            <select
              id="roster-team-select"
              aria-label="Select draft team roster"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(Number(e.target.value))}
              className="input-text text-xs py-1.5 px-3 bg-slate-950 font-bold text-blue-300 border-slate-700 max-w-[220px]"
            >
              {rosters.map(r => (
                <option key={r.slot} value={r.slot}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Positional Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4" role="group" aria-label="Positional Roster Progress">
        {[
          { pos: 'QB', count: posCounts.QB, target: posTargets.QB, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
          { pos: 'RB', count: posCounts.RB, target: posTargets.RB, color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
          { pos: 'WR', count: posCounts.WR, target: posTargets.WR, color: 'bg-pink-500', glow: 'shadow-pink-500/20' },
          { pos: 'TE', count: posCounts.TE, target: posTargets.TE, color: 'bg-amber-500', glow: 'shadow-amber-500/20' },
          { pos: 'K',  count: posCounts.K,  target: posTargets.K,  color: 'bg-purple-500', glow: 'shadow-purple-500/20' },
          { pos: 'DEF',count: posCounts.DEF,target: posTargets.DEF,color: 'bg-cyan-500', glow: 'shadow-cyan-500/20' }
        ].map(item => {
          const pct = Math.min(100, Math.round((item.count / item.target) * 100));
          const isComplete = item.count >= item.target;

          return (
            <div
              key={item.pos}
              className={`p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 transition ${
                isComplete ? 'border-slate-700' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`badge-pos badge-pos-${item.pos} text-[10px] py-0.5 px-2`}>
                  {item.pos}
                </span>
                <span className={`font-mono font-extrabold text-xs ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
                  {item.count}/{item.target}
                </span>
              </div>
              <div
                className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-0.5"
                role="progressbar"
                aria-valuenow={item.count}
                aria-valuemin={0}
                aria-valuemax={item.target}
                aria-label={`${item.pos} roster target progress: ${item.count} of ${item.target}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color} ${item.glow}`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Draft Recommendations Box */}
      {draftRecommendations.recommendedPlayers.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-500/30 text-xs shadow-lg" role="region" aria-label="Recommended Value Targets">
          <div className="flex items-center gap-2 mb-2 text-blue-300 font-extrabold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Recommended Value Targets</span>
          </div>

          <div className="space-y-1.5">
            {draftRecommendations.recommendedPlayers.map(rec => (
              <div key={rec.rank} className="flex items-center justify-between bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-400 font-extrabold text-[11px]">#{rec.rank}</span>
                  <span className={`badge-pos badge-pos-${rec.position} text-[10px]`}>{rec.position}</span>
                  <span className="font-bold text-white">{rec.player}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rec.team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roster Picks List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Roster Picks ({myPicks.length})
          </h4>
        </div>

        {myPicks.length === 0 ? (
          <div className="p-5 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-800/60">
            No picks logged yet for this team.
          </div>
        ) : (
          <ul role="list" className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {myPicks.map(p => {
              const meta = p.metadata || {};
              const rankObj = rankings?.find(r => r.sleeperId === p.player_id);
              const teamStyle = getTeamStyle(meta.team);

              return (
                <li
                  key={p.pick_no}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-slate-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                      Pick #{p.pick_no}
                    </span>
                    <span className={`badge-pos badge-pos-${meta.position} shrink-0`}>
                      {meta.position}
                    </span>
                    <span className="font-bold text-white truncate">
                      {meta.first_name} {meta.last_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {meta.team && (
                      <span
                        className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: teamStyle.bg,
                          borderColor: teamStyle.border,
                          color: teamStyle.text
                        }}
                      >
                        {meta.team}
                      </span>
                    )}
                    {rankObj && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/30">
                        Rank #{rankObj.rank}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
