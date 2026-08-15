import React, { memo } from 'react';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import { getTeamStyle } from '../../utils/fantasyUtils';

const BestAvailableCard = memo(function BestAvailableCard({
  player: p,
  selectedRankingIds,
  datasetMetaMap,
  activeSortId,
  isPicked,
  isStarred,
  isManual,
  primaryRank,
  onToggleStar,
  onToggleManualDrafted
}) {
  const teamStyle = getTeamStyle(p.team);

  return (
    <div
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
            type="button"
            onClick={() => onToggleStar && onToggleStar(primaryRank)}
            aria-label={isStarred ? `Unstar ${p.player}` : `Star ${p.player} as target`}
            aria-pressed={isStarred}
            className="p-1 rounded hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <Star
              className={`w-4 h-4 ${
                isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
              }`}
              aria-hidden="true"
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
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Drafted
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Available
            </>
          )}
        </span>

        <button
          type="button"
          onClick={() => onToggleManualDrafted(primaryRank)}
          aria-label={isManual ? `Unmark ${p.player} as drafted` : `Mark ${p.player} as drafted`}
          className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          {isManual ? 'Unmark' : 'Mark Drafted'}
        </button>
      </div>
    </div>
  );
});

export default BestAvailableCard;
