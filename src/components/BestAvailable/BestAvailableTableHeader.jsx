import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function BestAvailableTableHeader({
  selectedRankingIds,
  datasetMetaMap,
  activeSortId,
  activeSortKey,
  onSortChange
}) {
  return (
    <thead>
      <tr className="bg-slate-900/95 border-b border-slate-800">
        <th className="text-center w-10 py-3" scope="col">Target</th>

        {/* Dynamically Render Header for Each Selected Ranking */}
        {selectedRankingIds.map((id, index) => {
          const meta = datasetMetaMap[id] || { name: id === 'default' ? 'Winks PPR' : `Rank ${index + 1}` };
          const isCurrentSort = activeSortId === id;

          return (
            <th key={id} className="text-center py-3 px-2" scope="col">
              <button
                type="button"
                onClick={() => onSortChange && onSortChange(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold transition ${
                  isCurrentSort
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-400/40'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                title={`Click to sort by ${meta.name}`}
                aria-label={`Sort by ${meta.name}`}
              >
                <span className="truncate max-w-[120px]">{meta.name}</span>
                {isCurrentSort ? (
                  activeSortKey.direction === 'desc' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-blue-200" aria-hidden="true" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5 text-blue-200" aria-hidden="true" />
                  )
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-slate-500" aria-hidden="true" />
                )}
              </button>
            </th>
          );
        })}

        <th className="py-3 px-3 text-left" scope="col">Player</th>
        <th className="py-3 px-2 text-center" scope="col">Pos</th>
        <th className="py-3 px-2 text-center" scope="col">Team</th>
        <th className="hidden sm:table-cell py-3 px-3 text-left" scope="col">Status</th>
        <th className="text-right py-3 px-3" scope="col">Action</th>
      </tr>
    </thead>
  );
}
