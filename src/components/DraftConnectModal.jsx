import React, { useState, useEffect } from 'react';
import { X, Hash, User, AlertCircle, Sparkles, History, Trash2, ArrowRight, Edit3, Users, ChevronDown, ChevronUp, CheckCircle, Play } from 'lucide-react';
import APP_CONFIG from '../config/appConfig';
import { createManualDraft, getStoredManualDraft, clearStoredManualDraft } from '../utils/manualDraftUtils';

const RECENT_DRAFTS_KEY = 'sleeper_recent_drafts';
const DEFAULT_USER_KEY = 'default_sleeper_username';
export const PREFERRED_USERNAME = APP_CONFIG.DEFAULT_SLEEPER_USERNAME;

export function getRecentDrafts() {
  try {
    const raw = localStorage.getItem(RECENT_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveRecentDraft(draft) {
  try {
    if (!draft || !draft.draft_id) return;
    const existing = getRecentDrafts();
    const filtered = existing.filter(d => d.draft_id !== draft.draft_id);
    const updated = [
      {
        draft_id: draft.draft_id,
        name: draft.metadata?.name || `Draft #${draft.draft_id}`,
        teams: draft.settings?.teams || 12,
        rounds: draft.settings?.rounds || 15,
        type: draft.type || 'snake',
        status: draft.status || 'pre_draft',
        isManualDraft: !!draft.isManualDraft,
        lastConnectedAt: new Date().toISOString()
      },
      ...filtered
    ].slice(0, APP_CONFIG.MAX_RECENT_DRAFTS_HISTORY || 5);
    localStorage.setItem(RECENT_DRAFTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent draft:', e);
  }
}

export function clearRecentDrafts() {
  try {
    localStorage.removeItem(RECENT_DRAFTS_KEY);
  } catch (e) {}
}

export function getStoredUsername() {
  try {
    return localStorage.getItem(DEFAULT_USER_KEY) || PREFERRED_USERNAME;
  } catch (e) {
    return PREFERRED_USERNAME;
  }
}

export function saveStoredUsername(username) {
  try {
    if (username) localStorage.setItem(DEFAULT_USER_KEY, username);
  } catch (e) {}
}

export default function DraftConnectModal({ isOpen, onClose, onSelectDraft, onStartManualDraft, onResumeManualDraft }) {
  const [username, setUsername] = useState(getStoredUsername());
  const [draftIdInput, setDraftIdInput] = useState('');
  const [season, setSeason] = useState(APP_CONFIG.DEFAULT_SEASON || '2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDrafts, setUserDrafts] = useState([]);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [activeTab, setActiveTab] = useState('recent');
  const [savedManualState, setSavedManualState] = useState(null);

  // Manual Draft Tab Form States
  const [manualLeagueName, setManualLeagueName] = useState('2026 Home League Draft');
  const [manualTeamsCount, setManualTeamsCount] = useState(12);
  const [manualRoundsCount, setManualRoundsCount] = useState(15);
  const [manualDraftType, setManualDraftType] = useState('snake');
  const [manualMyDraftSlot, setManualMyDraftSlot] = useState(1);
  const [manualTeamNames, setManualTeamNames] = useState({});
  const [isTeamNamesExpanded, setIsTeamNamesExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const recents = getRecentDrafts();
      setRecentDrafts(recents);
      const savedUser = getStoredUsername();
      setUsername(savedUser);

      const manualSaved = getStoredManualDraft();
      setSavedManualState(manualSaved);

      if (recents.length > 0) {
        setActiveTab('recent');
      } else {
        setActiveTab('username');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAndSave = (draft) => {
    saveRecentDraft(draft);
    onSelectDraft(draft);
    onClose();
  };

  const handleFetchUserDrafts = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    saveStoredUsername(username.trim());
    setLoading(true);
    setError(null);
    setUserDrafts([]);

    try {
      const uRes = await fetch(`/api/sleeper/user/${encodeURIComponent(username.trim())}`);
      const uData = await uRes.json();

      if (!uRes.ok || uData.error) {
        throw new Error(uData.error || `Sleeper user "${username}" not found`);
      }

      const dRes = await fetch(`/api/sleeper/user/${uData.user_id}/drafts/${season}`);
      const dData = await dRes.json();

      if (!dRes.ok) {
        throw new Error('Failed to fetch drafts for this user');
      }

      setUserDrafts(dData);
      if (dData.length === 0) {
        setError(`No NFL drafts found for "${username}" in season ${season}. Try switching season to 2025 or enter a Draft ID directly.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDraftIdSubmit = async (e) => {
    e.preventDefault();
    if (!draftIdInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sleeper/draft/${draftIdInput.trim()}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Draft not found');
      }

      handleSelectAndSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectRecent = async (recent) => {
    if (recent.isManualDraft) {
      const saved = getStoredManualDraft();
      if (saved && saved.draftInfo) {
        if (onResumeManualDraft) {
          onResumeManualDraft(saved);
        } else {
          onSelectDraft(saved.draftInfo);
        }
        onClose();
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sleeper/draft/${recent.draft_id}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to fetch draft ${recent.draft_id}`);
      }

      handleSelectAndSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearRecentDrafts();
    setRecentDrafts([]);
    setActiveTab('username');
  };

  const handleLaunchManualDraft = (e) => {
    e.preventDefault();
    const preferredUser = getStoredUsername() || PREFERRED_USERNAME;

    const newDraft = createManualDraft({
      name: manualLeagueName,
      teamsCount: manualTeamsCount,
      roundsCount: manualRoundsCount,
      draftType: manualDraftType,
      myDraftSlot: manualMyDraftSlot,
      customTeamNames: manualTeamNames,
      preferredUsername: preferredUser
    });

    saveRecentDraft(newDraft);

    if (onStartManualDraft) {
      onStartManualDraft(newDraft);
    } else {
      onSelectDraft(newDraft);
    }
    onClose();
  };

  const handleResumeSavedManual = () => {
    if (!savedManualState) return;
    if (onResumeManualDraft) {
      onResumeManualDraft(savedManualState);
    } else {
      onSelectDraft(savedManualState.draftInfo);
    }
    onClose();
  };

  const handleClearSavedManual = () => {
    clearStoredManualDraft();
    setSavedManualState(null);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="connect-modal-title">
      <div className="modal-content max-w-xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close connect modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <h2 id="connect-modal-title" className="text-xl font-extrabold text-white tracking-tight">
            Connect or Create Draft
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Connect to a live Sleeper draft, resume previous draft, or create a manually entered offline draft.
        </p>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-6 overflow-x-auto scrollbar-thin touch-pan-x" role="tablist" aria-label="Draft Connection Options">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'recent'}
            onClick={() => setActiveTab('recent')}
            className={`pb-3 px-2 sm:px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'recent'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 shrink-0" aria-hidden="true" /> <span>Recent Drafts</span>
            {recentDrafts.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
                {recentDrafts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-2 sm:px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4 shrink-0" aria-hidden="true" /> <span>Manual Draft</span>
            {savedManualState && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'username'}
            onClick={() => setActiveTab('username')}
            className={`pb-3 px-2 sm:px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'username'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 shrink-0" aria-hidden="true" /> <span>By Sleeper Username</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'draftId'}
            onClick={() => setActiveTab('draftId')}
            className={`pb-3 px-2 sm:px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'draftId'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-4 h-4 shrink-0" aria-hidden="true" /> <span>By Draft ID</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Recent Drafts */}
        {activeTab === 'recent' && (
          <div>
            {recentDrafts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                <History className="w-8 h-8 text-slate-700 mx-auto mb-2" aria-hidden="true" />
                No saved drafts yet. Choose <b>Manual Draft</b> to start an offline draft, or search by Sleeper username!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Previously Connected Drafts:
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" /> Clear History
                  </button>
                </div>

                {recentDrafts.map((d) => (
                  <div
                    key={d.draft_id}
                    onClick={() => handleReconnectRecent(d)}
                    className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-blue-300 flex items-center gap-2">
                        <span>{d.name}</span>
                        {d.isManualDraft ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            MANUAL
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 font-normal">
                            #{d.draft_id}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <span className="capitalize font-semibold">{d.type}</span> •{' '}
                        <span>{d.teams} Teams</span> •{' '}
                        <span>{d.rounds} Rounds</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      aria-label={`Reconnect to draft ${d.name}`}
                      className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1 group-hover:scale-105"
                    >
                      <span>{d.isManualDraft ? 'Resume' : 'Reconnect'}</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Draft Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-5">
            {/* Resume Active Saved Draft Banner */}
            {savedManualState && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 to-blue-950/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Saved Draft Session
                    </span>
                    <span className="font-bold text-white text-sm">
                      {savedManualState.draftInfo?.metadata?.name || 'Manual League Draft'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                    <span>{savedManualState.picks?.length || 0} picks logged</span> •{' '}
                    <span>{savedManualState.draftInfo?.settings?.teams || 12} Teams</span> •{' '}
                    <span className="capitalize">{savedManualState.draftInfo?.type || 'snake'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResumeSavedManual}
                    className="btn btn-emerald text-xs py-2 px-3 flex items-center gap-1.5 font-bold shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSavedManual}
                    className="btn btn-secondary text-xs py-2 px-2.5 text-slate-400 hover:text-rose-400"
                    title="Clear saved draft session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Create New Manual Draft Form */}
            <form onSubmit={handleLaunchManualDraft} className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {savedManualState ? 'Or Create New Manual Draft:' : 'Configure New Manual Draft:'}
              </div>

              <div>
                <label htmlFor="modal-manual-league-name" className="block text-xs font-bold text-slate-300 mb-1">
                  Draft / League Name
                </label>
                <input
                  id="modal-manual-league-name"
                  type="text"
                  required
                  value={manualLeagueName}
                  onChange={(e) => setManualLeagueName(e.target.value)}
                  placeholder="e.g. 2026 Home League Draft"
                  className="input-text w-full text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-manual-teams-count" className="block text-xs font-bold text-slate-300 mb-1">
                    Number of Teams
                  </label>
                  <select
                    id="modal-manual-teams-count"
                    value={manualTeamsCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setManualTeamsCount(val);
                      if (manualMyDraftSlot > val) setManualMyDraftSlot(1);
                    }}
                    className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
                  >
                    {[4, 6, 8, 10, 12, 14, 16, 18, 20].map(n => (
                      <option key={n} value={n}>{n} Teams</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-manual-rounds-count" className="block text-xs font-bold text-slate-300 mb-1">
                    Number of Rounds
                  </label>
                  <select
                    id="modal-manual-rounds-count"
                    value={manualRoundsCount}
                    onChange={(e) => setManualRoundsCount(Number(e.target.value))}
                    className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
                  >
                    {[10, 12, 14, 15, 16, 17, 18, 20, 22, 25, 30].map(n => (
                      <option key={n} value={n}>{n} Rounds</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-manual-draft-type" className="block text-xs font-bold text-slate-300 mb-1">
                    Draft Order Type
                  </label>
                  <select
                    id="modal-manual-draft-type"
                    value={manualDraftType}
                    onChange={(e) => setManualDraftType(e.target.value)}
                    className="input-text w-full text-xs bg-slate-950 font-bold border-slate-700"
                  >
                    <option value="snake">Snake Draft (1→12, 12→1)</option>
                    <option value="linear">Linear Draft (1→12, 1→12)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-manual-my-slot" className="block text-xs font-bold text-slate-300 mb-1">
                    My Draft Position (Slot)
                  </label>
                  <select
                    id="modal-manual-my-slot"
                    value={manualMyDraftSlot}
                    onChange={(e) => setManualMyDraftSlot(Number(e.target.value))}
                    className="input-text w-full text-xs bg-slate-950 font-bold text-blue-300 border-slate-700"
                  >
                    {Array.from({ length: manualTeamsCount }, (_, i) => i + 1).map(slot => (
                      <option key={slot} value={slot}>
                        Slot {slot} {manualTeamNames[slot] ? `(${manualTeamNames[slot]})` : ''}
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
                  className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Customize Team Names ({manualTeamsCount} Teams)</span>
                  </div>
                  {isTeamNamesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isTeamNamesExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    {Array.from({ length: manualTeamsCount }, (_, i) => i + 1).map((slot) => {
                      const isMe = slot === manualMyDraftSlot;
                      const preferredUser = getStoredUsername() || PREFERRED_USERNAME;
                      const currentVal = manualTeamNames[slot] !== undefined
                        ? manualTeamNames[slot]
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
                            onChange={(e) => setManualTeamNames(prev => ({ ...prev, [slot]: e.target.value }))}
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

              <button
                type="submit"
                className="btn btn-primary w-full justify-center text-xs py-2.5 font-bold flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Start Manual Draft</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Username Tab */}
        {activeTab === 'username' && (
          <div>
            <form onSubmit={handleFetchUserDrafts} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Sleeper Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label="Sleeper Username"
                  className="input-text w-full text-xs"
                />
              </div>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                aria-label="Draft Season Year"
                className="input-text text-xs bg-slate-950 font-bold border-slate-700"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary text-xs px-4 flex items-center gap-1.5"
              >
                {loading ? 'Searching...' : 'Find Drafts'}
              </button>
            </form>

            {/* List of User Drafts */}
            {userDrafts.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select a Draft ({userDrafts.length} found):
                </p>
                {userDrafts.map((d) => (
                  <div
                    key={d.draft_id}
                    onClick={() => handleSelectAndSave(d)}
                    className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-blue-300">
                        {d.metadata?.name || `Draft ${d.draft_id}`}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <span className="capitalize font-semibold">{d.type}</span> •{' '}
                        <span>{d.settings?.teams || 12} Teams</span> •{' '}
                        <span>{d.settings?.rounds || 15} Rounds</span>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary text-xs py-1 px-3">
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Draft ID Tab */}
        {activeTab === 'draftId' && (
          <form onSubmit={handleDirectDraftIdSubmit} className="space-y-4">
            <div>
              <label htmlFor="direct-draft-id" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Sleeper Draft ID
              </label>
              <input
                id="direct-draft-id"
                type="text"
                placeholder="e.g. 10482918391823901"
                value={draftIdInput}
                onChange={(e) => setDraftIdInput(e.target.value)}
                className="input-text w-full font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Found in your Sleeper draft web URL: sleeper.app/draft/nfl/<b>DRAFT_ID</b>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center text-xs py-2.5"
            >
              {loading ? 'Connecting...' : 'Connect to Draft'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
