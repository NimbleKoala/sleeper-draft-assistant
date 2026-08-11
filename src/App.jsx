import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BestAvailable from './components/BestAvailable';
import DraftBoard from './components/DraftBoard';
import MyRosterTracker from './components/MyRosterTracker';
import DraftConnectModal, { saveRecentDraft, PREFERRED_USERNAME } from './components/DraftConnectModal';
import RankingsManagerModal from './components/RankingsManagerModal';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function App() {
  const [savedRankings, setSavedRankings] = useState([]);
  const [selectedRankingIds, setSelectedRankingIds] = useState(['default']);
  const [activeDatasetsMap, setActiveDatasetsMap] = useState({});
  const [rankingsInfo, setRankingsInfo] = useState({ source: '', count: 0 });
  const [rankings, setRankings] = useState([]);
  const [activeSortKey, setActiveSortKey] = useState({ rankingId: 'default', direction: 'asc' });

  const [draftInfo, setDraftInfo] = useState(null);
  const [picks, setPicks] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Manual override toggles & Wishlist starring
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

  // Fetch list of all saved rankings on server
  const loadSavedRankingsList = useCallback(async () => {
    try {
      const res = await fetch('/api/rankings');
      const data = await res.json();
      setSavedRankings(data.rankings || []);
    } catch (err) {
      console.error('Failed to load saved rankings list:', err);
    }
  }, []);

  // Fetch parsed dataset for selected ranking IDs
  const loadActiveDatasets = useCallback(async (ids = selectedRankingIds) => {
    try {
      const map = {};
      let primaryData = null;

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const res = await fetch(`/api/rankings/dataset/${encodeURIComponent(id)}`);
        if (res.ok) {
          const dataset = await res.json();
          map[id] = {
            meta: dataset.meta,
            rankingsWithDraftStatus: dataset.rankings
          };
          if (i === 0) primaryData = dataset;
        }
      }

      setActiveDatasetsMap(map);

      if (primaryData) {
        setRankingsInfo({
          source: primaryData.meta?.name || 'Hayden Winks PPR',
          count: primaryData.rankings?.length || 0
        });
        setRankings(primaryData.rankings || []);
      }
    } catch (err) {
      console.error('Failed to load active datasets:', err);
    }
  }, [selectedRankingIds]);

  useEffect(() => {
    loadSavedRankingsList();
    loadActiveDatasets();
  }, []);

  // Sync / Refresh Picks from Sleeper API (Supports Multi-Rankings)
  const handleRefreshPicks = useCallback(async (currentDraft = draftInfo, ids = selectedRankingIds) => {
    if (!currentDraft || !currentDraft.draft_id || isDemoMode) return;

    setIsRefreshing(true);
    try {
      const queryParam = ids.join(',');
      const res = await fetch(`/api/sleeper/draft/${currentDraft.draft_id}/picks?ids=${encodeURIComponent(queryParam)}`);
      if (!res.ok) throw new Error('Failed to refresh picks');

      const data = await res.json();
      setPicks(data.picks || []);

      if (data.datasetsMap && Object.keys(data.datasetsMap).length > 0) {
        setActiveDatasetsMap(data.datasetsMap);
      }

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
  }, [draftInfo, isDemoMode, selectedRankingIds]);

  // Handle toggling selection of a ranking (up to 3 max)
  const handleToggleSelectRanking = async (id) => {
    let nextIds = [...selectedRankingIds];

    if (nextIds.includes(id)) {
      if (nextIds.length === 1) {
        showNotification('Must keep at least 1 active ranking selected', 'error');
        return;
      }
      nextIds = nextIds.filter(item => item !== id);
    } else {
      if (nextIds.length >= 3) {
        showNotification('Maximum 3 active rankings can be selected at a time', 'error');
        return;
      }
      nextIds.push(id);
    }

    setSelectedRankingIds(nextIds);

    // If active sort key is removed, reset sort to primary selected ID
    if (!nextIds.includes(activeSortKey.rankingId)) {
      setActiveSortKey({ rankingId: nextIds[0], direction: 'asc' });
    }

    await loadActiveDatasets(nextIds);
    if (draftInfo && !isDemoMode) {
      handleRefreshPicks(draftInfo, nextIds);
    }
  };

  // Sort change handler
  const handleSortChange = (rankingId) => {
    setActiveSortKey(prev => {
      if (prev.rankingId === rankingId) {
        return { rankingId, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { rankingId, direction: 'asc' };
    });
  };

  // Connect to a new Draft
  const handleSelectDraft = async (selectedDraft) => {
    setIsDemoMode(false);
    showNotification(`Connecting to draft...`, 'info');
    try {
      const res = await fetch(`/api/sleeper/draft/${selectedDraft.draft_id}`);
      const fullDraft = res.ok ? await res.json() : selectedDraft;

      setDraftInfo(fullDraft);
      saveRecentDraft(fullDraft);
      showNotification(`Connected to draft: ${fullDraft.metadata?.name || fullDraft.draft_id}`, 'success');
      handleRefreshPicks(fullDraft, selectedRankingIds);
    } catch (err) {
      setDraftInfo(selectedDraft);
      handleRefreshPicks(selectedDraft, selectedRankingIds);
    }
  };

  // Start Demo Mode
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

    const mockPicks = [
      { pick_no: 1, roster_id: 1, draft_slot: 1, picked_by: 'user_1', player_id: 'mock_1', metadata: { first_name: 'Jahmyr', last_name: 'Gibbs', position: 'RB', team: 'DET' } },
      { pick_no: 2, roster_id: 2, draft_slot: 2, picked_by: 'user_2', player_id: 'mock_2', metadata: { first_name: 'Puka', last_name: 'Nacua', position: 'WR', team: 'LAR' } },
      { pick_no: 3, roster_id: 3, draft_slot: 3, picked_by: 'user_3', player_id: 'mock_3', metadata: { first_name: "Ja'Marr", last_name: 'Chase', position: 'WR', team: 'CIN' } }
    ];
    setPicks(mockPicks);
    showNotification('Demo Mock Draft Mode started!', 'info');
  };

  // Manual drafted toggle
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

  // Star wishlist toggle
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

  // Upload custom rankings to server
  const handleUploadCustomRankings = async (csvContent, name) => {
    const res = await fetch('/api/rankings/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload CSV');

    setSavedRankings(data.allManifest || []);

    const newId = data.meta.id;
    let nextIds = [...selectedRankingIds];
    if (nextIds.length < 3) {
      nextIds.push(newId);
    } else {
      nextIds[nextIds.length - 1] = newId;
    }
    setSelectedRankingIds(nextIds);

    await loadActiveDatasets(nextIds);
    if (draftInfo && !isDemoMode) {
      handleRefreshPicks(draftInfo, nextIds);
    }
  };

  // Delete custom dataset from server
  const handleDeleteCustomRankings = async (id) => {
    const res = await fetch(`/api/rankings/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete dataset');

    setSavedRankings(data.allManifest || []);

    let nextIds = selectedRankingIds.filter(item => item !== id);
    if (nextIds.length === 0) nextIds = ['default'];
    setSelectedRankingIds(nextIds);

    await loadActiveDatasets(nextIds);
    if (draftInfo && !isDemoMode) {
      handleRefreshPicks(draftInfo, nextIds);
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-8 max-w-[1500px] mx-auto">
      {/* Toast Notification */}
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
            activeDatasetsMap={activeDatasetsMap}
            selectedRankingIds={selectedRankingIds}
            savedRankings={savedRankings}
            activeSortKey={activeSortKey}
            onSortChange={handleSortChange}
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
        savedRankings={savedRankings}
        selectedRankingIds={selectedRankingIds}
        onToggleSelectRanking={handleToggleSelectRanking}
        onUploadCustom={handleUploadCustomRankings}
        onDeleteCustom={handleDeleteCustomRankings}
      />
    </div>
  );
}
