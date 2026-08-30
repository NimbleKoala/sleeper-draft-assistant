import React, { memo } from 'react';
import { Star, CheckCircle2, XCircle, UserPlus, RotateCcw } from 'lucide-react';
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
  isManualDraft = false,
  onToggleStar,
  onToggleManualDrafted,
  onDraftPlayer,
  onRemovePick
}) {
  const teamStyle = getTeamStyle(p.team);

  const handleActionClick = () => {
    if (isManualDraft) {
      if (!isPicked && onDraftPlayer) {
        onDraftPlayer(p);
      } else if (p.pickInfo && onRemovePick) {
        onRemovePick(p.pickInfo.pick_no);
      } else if (onToggleManualDrafted) {
        onToggleManualDrafted(primaryRank);
      }
    } else {
      if (onToggleManualDrafted) {
        onToggleManualDrafted(primaryRank);
      }
    }
  };

  return (
    <div
      className={`glass-panel p-4 flex flex-col justify-between transition relative ${
        isPicked ? 'opacity-40 bg-slate-950/80 line-through' : 'glass-panel-hover'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2.5">
          {/* Multi-Ranking Badges on Card */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedRankingIds.map((id) => {
              const r = p.ranks[id];
              const meta = datasetMetaMap[id];
              const label = meta ? meta.name.substring(0, 8) : id;
              const isSortActive = activeSortId === id;

              return r ? (
                <span
                  key={id}
                  className={`font-mono text-[11px] font-extrabold px-2 py-0.5 rounded border transition ${
                    isSortActive
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  #{r} <span className="opacity-60 text-[9px] font-normal">{label}</span>
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
            className="p-1 rounded hover:bg-slate-800 transition"
          >
            <Star
              className={`w-4 h-4 transition ${
                isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'
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
            <span className="text-[9px] px-1.5 py-0.5 font-mono font-extrabold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
              {p.sleeperDetails.injuryStatus}
            </span>
          )}

          {p.sleeperDetails?.age && (
            <span className="text-xs text-slate-400 font-mono">
              Age {p.sleeperDetails.age}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className={`text-xs font-semibold flex items-center gap-1 ${isPicked ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isPicked ? (
            <>
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{p.pickInfo ? `Pick #${p.pickInfo.pick_no}` : 'Drafted'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Available</span>
            </>
          )}
        </span>

        {isManualDraft && !isPicked ? (
          <button
            type="button"
            onClick={handleActionClick}
            aria-label={`Draft ${p.player}`}
            className="btn btn-primary text-xs font-bold py-1 px-3 flex items-center gap-1 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Draft</span>
          </button>
        ) : isManualDraft && isPicked && p.pickInfo ? (
          <button
            type="button"
            onClick={handleActionClick}
            aria-label={`Undo pick #${p.pickInfo.pick_no} for ${p.player}`}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActionClick}
            aria-label={isManual ? `Unmark ${p.player} as drafted` : `Mark ${p.player} as drafted`}
            className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
              isManual
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                : 'btn-secondary text-slate-300'
            }`}
          >
            {isManual ? 'Unmark' : 'Mark Drafted'}
          </button>
        )}
      </div>
    </div>
  );
});

export default BestAvailableCard;
