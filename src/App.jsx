import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BestAvailable from './components/BestAvailable';
import DraftBoard from './components/DraftBoard';
import MyRosterTracker from './components/MyRosterTracker';
import DraftConnectModal, { saveRecentDraft, PREFERRED_USERNAME } from './components/DraftConnectModal';
import RankingsManagerModal from './components/RankingsManagerModal';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [rankingsInfo, setRankingsInfo] = useState({ source: '', count: 0 });
  const [rankings, setRankings] = useState([]);
  const [draftInfo, setDraftInfo] = useState(null);
  const [picks, setPicks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Manual override toggles for player ranks & Wishlist starring
  const [manualDraftedIds, setManualDraftedIds] = useState(new Set());
  const [starredIds, setStarredIds] = useState(new Set());

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isRankingsModalOpen, setIsRankingsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch Rankings on initial mount
  const loadRankings = async () => {
    try {
      const res = await fetch('/api/rankings');
      const data = await res.json();
      setRankingsInfo({ source: data.source, count: data.count });
      setRankings(data.rankings || []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  // Sync / Refresh Picks from Sleeper API
  const handleRefreshPicks = useCallback(async (currentDraft = draftInfo) => {
    if (!currentDraft || !currentDraft.draft_id || isDemoMode) return;

    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/sleeper/draft/${currentDraft.draft_id}/picks`);
      if (!res.ok) throw new Error('Failed to refresh picks');

      const data = await res.json();
      setPicks(data.picks || []);

      if (data.rankingsWithDraftStatus) {
        setRankings(data.rankingsWithDraftStatus);
      }

      setLastRefreshed(new Date().toLocaleTimeString());
      showNotification(`Synced draft! (${data.picks.length} picks logged)`, 'success');
    } catch (err) {
      showNotification(`Sync error: ${err.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [draftInfo, isDemoMode]);

  // Connect to a new Draft
  const handleSelectDraft = async (selectedDraft) => {
    setIsDemoMode(false);
    showNotification(`Connecting to draft...`, 'info');
    try {
      // Fetch full draft details (including users & draft_order) from API
      const res = await fetch(`/api/sleeper/draft/${selectedDraft.draft_id}`);
      const fullDraft = res.ok ? await res.json() : selectedDraft;

      setDraftInfo(fullDraft);
      saveRecentDraft(fullDraft);
      showNotification(`Connected to draft: ${fullDraft.metadata?.name || fullDraft.draft_id}`, 'success');
      handleRefreshPicks(fullDraft);
    } catch (err) {
      setDraftInfo(selectedDraft);
      handleRefreshPicks(selectedDraft);
    }
  };

  // Start Demo / Mock Draft Simulator Mode
  const handleStartDemoMode = () => {
    setIsDemoMode(true);
    const demoDraft = {
      draft_id: 'demo_mock_101',
      status: 'drafting',
      user_id: 'user_1',
      metadata: { name: '2026 PPR Mock League (Demo)' },
      settings: { teams: 12, rounds: 15 },
      users: Array.from({ length: 12 }, (_, i) => ({
        user_id: `user_${i + 1}`,
        display_name: i === 0 ? `${PREFERRED_USERNAME}` : `Manager ${i + 1}`,
        username: i === 0 ? `${PREFERRED_USERNAME}` : `manager_${i + 1}`
      })),
      draft_order: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`user_${i + 1}`, i + 1])),
      slot_to_roster_id: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, i + 1]))
    };
    setDraftInfo(demoDraft);

    // Populate mock initial picks for demonstration
    const mockPicks = [
      { pick_no: 1, roster_id: 1, draft_slot: 1, picked_by: 'user_1', player_id: 'mock_1', metadata: { first_name: 'Jahmyr', last_name: 'Gibbs', position: 'RB', team: 'DET' } },
      { pick_no: 2, roster_id: 2, draft_slot: 2, picked_by: 'user_2', player_id: 'mock_2', metadata: { first_name: 'Puka', last_name: 'Nacua', position: 'WR', team: 'LAR' } },
      { pick_no: 3, roster_id: 3, draft_slot: 3, picked_by: 'user_3', player_id: 'mock_3', metadata: { first_name: "Ja'Marr", last_name: 'Chase', position: 'WR', team: 'CIN' } }
    ];
    setPicks(mockPicks);
    showNotification('Demo Mock Draft Mode started! Click "Mark Drafted" to simulate picks.', 'info');
  };

  // Toggle manual drafted state
  const handleToggleManualDrafted = (rank) => {
    setManualDraftedIds(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  // Toggle star wishlist
  const handleToggleStar = (rank) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  // Reload default rankings
  const handleReloadDefaultRankings = async () => {
    const res = await fetch('/api/rankings/reload-default', { method: 'POST' });
    const data = await res.json();
    setRankingsInfo({ source: data.source, count: data.count });
    setRankings(data.rankings || []);
    setManualDraftedIds(new Set());
    if (draftInfo && !isDemoMode) {
      handleRefreshPicks(draftInfo);
    }
  };

  // Upload custom rankings
  const handleUploadCustomRankings = async (csvContent, sourceName) => {
    const res = await fetch('/api/rankings/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent, sourceName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload CSV');

    setRankingsInfo({ source: data.source, count: data.count });
    setRankings(data.rankings || []);
    setManualDraftedIds(new Set());
    if (draftInfo && !isDemoMode) {
      handleRefreshPicks(draftInfo);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-8 max-w-[1500px] mx-auto">
      {/* Toast Notification - Mobile Friendly Docking */}
      {notification && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-bounce-short">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
              notification.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                : notification.type === 'error'
                ? 'bg-rose-950/95 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                : 'bg-blue-950/95 text-blue-300 border-blue-500/40 shadow-blue-500/10'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        draftInfo={draftInfo}
        rankingsInfo={rankingsInfo}
        onRefreshPicks={() => handleRefreshPicks()}
        isRefreshing={isRefreshing}
        lastRefreshed={lastRefreshed}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenRankingsModal={() => setIsRankingsModalOpen(true)}
        onStartDemoMode={handleStartDemoMode}
        isDemoMode={isDemoMode}
      />

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column: Best Available Players (Takes 2 Cols on Desktop) */}
        <div className="lg:col-span-2">
          <BestAvailable
            rankings={rankings}
            manualDraftedIds={manualDraftedIds}
            onToggleManualDrafted={handleToggleManualDrafted}
            starredIds={starredIds}
            onToggleStar={handleToggleStar}
          />
        </div>

        {/* Right Column: Draft Stream & Roster Tracker */}
        <div className="space-y-4 md:space-y-6">
          <MyRosterTracker
            draftInfo={draftInfo}
            picks={picks}
            rankings={rankings}
            manualDraftedIds={manualDraftedIds}
          />
          
          <DraftBoard
            draftInfo={draftInfo}
            picks={picks}
          />
        </div>
      </div>

      {/* Modals */}
      <DraftConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSelectDraft={handleSelectDraft}
      />

      <RankingsManagerModal
        isOpen={isRankingsModalOpen}
        onClose={() => setIsRankingsModalOpen(false)}
        rankingsInfo={rankingsInfo}
        onReloadDefault={handleReloadDefaultRankings}
        onUploadCustom={handleUploadCustomRankings}
      />
    </div>
  );
}
