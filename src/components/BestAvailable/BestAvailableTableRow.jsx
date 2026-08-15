import React, { memo } from 'react';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import { getTeamStyle } from '../../utils/fantasyUtils';

const BestAvailableTableRow = memo(function BestAvailableTableRow({
  player: p,
  selectedRankingIds,
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
    <tr
      className={`hover-row transition ${
        isPicked ? 'opacity-40 bg-slate-950/70 line-through' : ''
      }`}
    >
      {/* Star Wishlist */}
      <td className="text-center">
        <button
          type="button"
          onClick={() => onToggleStar && onToggleStar(primaryRank)}
          aria-label={isStarred ? `Unstar ${p.player}` : `Star ${p.player} as target`}
          aria-pressed={isStarred}
          className="p-1 rounded hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          title={isStarred ? 'Unstar target' : 'Star target'}
        >
          <Star
            className={`w-4 h-4 ${
              isStarred
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-600 hover:text-slate-400'
            }`}
            aria-hidden="true"
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
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {p.pickInfo ? `Picked #${p.pickInfo.pick_no}` : 'Drafted'}
          </span>
        ) : (
          <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Available
          </span>
        )}
      </td>

      {/* Action Toggle */}
      <td className="text-right py-2 px-3">
        <button
          type="button"
          onClick={() => onToggleManualDrafted(primaryRank)}
          aria-label={isManual ? `Unmark ${p.player} as drafted` : `Mark ${p.player} as drafted`}
          className={`text-[11px] sm:text-xs font-semibold px-2.5 py-1 sm:py-1.5 rounded-lg border transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
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

export default BestAvailableTableRow;
