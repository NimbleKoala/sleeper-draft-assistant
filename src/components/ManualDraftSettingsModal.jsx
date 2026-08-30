import React, { useState, useEffect } from 'react';
import { X, Edit3, Users, Sliders, ChevronDown, ChevronUp, CheckCircle, Sparkles } from 'lucide-react';
import { getStoredUsername, PREFERRED_USERNAME } from './DraftConnectModal';
import { createManualDraft } from '../utils/manualDraftUtils';

export default function ManualDraftSettingsModal({
  isOpen,
  onClose,
  initialDraftInfo = null,
  onSaveDraft
}) {
  const [leagueName, setLeagueName] = useState('2026 Home League Draft');
  const [teamsCount, setTeamsCount] = useState(12);
  const [roundsCount, setRoundsCount] = useState(15);
  const [draftType, setDraftType] = useState('snake');
  const [myDraftSlot, setMyDraftSlot] = useState(1);
  const [customTeamNames, setCustomTeamNames] = useState({});
  const [isTeamNamesExpanded, setIsTeamNamesExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const preferredUser = getStoredUsername() || PREFERRED_USERNAME;
      if (initialDraftInfo) {
        setLeagueName(initialDraftInfo.metadata?.name || 'Manual League Draft');
        setTeamsCount(initialDraftInfo.settings?.teams || 12);
        setRoundsCount(initialDraftInfo.settings?.rounds || 15);
        setDraftType(initialDraftInfo.type || 'snake');
        setMyDraftSlot(initialDraftInfo.myDraftSlot || 1);

        const namesMap = {};
        if (initialDraftInfo.users && initialDraftInfo.draft_order) {
          initialDraftInfo.users.forEach((u) => {
            const slot = initialDraftInfo.draft_order[u.user_id];
            if (slot) namesMap[slot] = u.display_name;
          });
        }
        setCustomTeamNames(namesMap);
      } else {
        setLeagueName('2026 Home League Draft');
        setTeamsCount(12);
        setRoundsCount(15);
        setDraftType('snake');
        setMyDraftSlot(1);
        setCustomTeamNames({ 1: `${preferredUser} (Me)` });
      }
    }
  }, [isOpen, initialDraftInfo]);

  if (!isOpen) return null;

  const handleTeamNameChange = (slot, name) => {
    setCustomTeamNames(prev => ({
      ...prev,
      [slot]: name
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const preferredUser = getStoredUsername() || PREFERRED_USERNAME;

    const newDraft = createManualDraft({
      name: leagueName,
      teamsCount,
      roundsCount,
      draftType,
      myDraftSlot,
      customTeamNames,
      preferredUsername: preferredUser
    });

    onSaveDraft(newDraft);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="manual-settings-modal-title">
      <div className="modal-content max-w-xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close manual draft settings modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Edit3 className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <h2 id="manual-settings-modal-title" className="text-xl font-extrabold text-white tracking-tight">
            {initialDraftInfo ? 'Edit Manual Draft Settings' : 'Create Manually Entered Draft'}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Configure league teams, rounds, snake/linear format, and custom manager names.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* League Name */}
          <div>
            <label htmlFor="manual-league-name" className="block text-xs font-bold text-slate-300 mb-1.5">
              Draft / League Name
            </label>
            <input
              id="manual-league-name"
              type="text"
              required
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder="e.g. 2026 Home League Draft"
              className="input-text w-full text-xs font-semibold"
            />
          </div>

          {/* Grid Settings: Teams, Rounds, Draft Type, My Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="manual-teams-count" className="block text-xs font-bold text-slate-300 mb-1.5">
                Number of Teams
              </label>
              <select
                id="manual-teams-count"
                value={teamsCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTeamsCount(val);
                  if (myDraftSlot > val) setMyDraftSlot(1);
                }}
                className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
              >
                {[4, 6, 8, 10, 12, 14, 16, 18, 20].map(n => (
                  <option key={n} value={n}>{n} Teams</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manual-rounds-count" className="block text-xs font-bold text-slate-300 mb-1.5">
                Number of Rounds
              </label>
              <select
                id="manual-rounds-count"
                value={roundsCount}
                onChange={(e) => setRoundsCount(Number(e.target.value))}
                className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
              >
                {[10, 12, 14, 15, 16, 17, 18, 20, 22, 25, 30].map(n => (
                  <option key={n} value={n}>{n} Rounds</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manual-draft-type" className="block text-xs font-bold text-slate-300 mb-1.5">
                Draft Order Type
              </label>
              <select
                id="manual-draft-type"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
              >
                <option value="snake">Snake Draft (1→12, 12→1)</option>
                <option value="linear">Linear Draft (1→12, 1→12)</option>
              </select>
            </div>

            <div>
              <label htmlFor="manual-my-slot" className="block text-xs font-bold text-slate-300 mb-1.5">
                My Draft Position (Slot)
              </label>
              <select
                id="manual-my-slot"
                value={myDraftSlot}
                onChange={(e) => setMyDraftSlot(Number(e.target.value))}
                className="input-text w-full text-xs bg-slate-950 font-bold text-blue-300 border-slate-700"
              >
                {Array.from({ length: teamsCount }, (_, i) => i + 1).map(slot => (
                  <option key={slot} value={slot}>
                    Slot {slot} {customTeamNames[slot] ? `(${customTeamNames[slot]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collapsible Custom Team Names */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsTeamNamesExpanded(!isTeamNamesExpanded)}
              className="flex items-center justify-between w-full py-2 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Customize Team & Manager Names ({teamsCount} Teams)</span>
              </div>
              {isTeamNamesExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isTeamNamesExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {Array.from({ length: teamsCount }, (_, i) => i + 1).map((slot) => {
                  const isMe = slot === myDraftSlot;
                  const preferredUser = getStoredUsername() || PREFERRED_USERNAME;
                  const currentVal = customTeamNames[slot] !== undefined
                    ? customTeamNames[slot]
                    : isMe ? `${preferredUser} (Me)` : `Team ${slot}`;

                  return (
                    <div key={slot} className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono font-extrabold w-12 text-right shrink-0 ${
                        isMe ? 'text-blue-400' : 'text-slate-500'
                      }`}>
                        Slot {slot}:
                      </span>
                      <input
                        type="text"
                        value={currentVal}
                        onChange={(e) => handleTeamNameChange(slot, e.target.value)}
                        placeholder={`Team ${slot}`}
                        className={`input-text w-full text-xs py-1.5 ${
                          isMe ? 'border-blue-500/50 bg-blue-950/20 font-bold text-white' : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs py-2 px-5 font-bold flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{initialDraftInfo ? 'Save Settings' : 'Start Manual Draft'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
