import React from 'react';
import { RefreshCw, Radio, Database, Zap, PlayCircle, Edit3, Sparkles } from 'lucide-react';

export default function Header({
  draftInfo,
  rankingsInfo,
  onRefreshPicks,
  isRefreshing,
  lastRefreshed,
  onOpenConnectModal,
  onOpenRankingsModal,
  onStartDemoMode,
  onOpenManualModal,
  isDemoMode
}) {
  const isManualDraft = !!draftInfo?.isManualDraft;

  const getStatusBadge = (status) => {
    if (isDemoMode) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
          <PlayCircle className="w-3 h-3 text-purple-400" aria-hidden="true" /> MOCK DRAFT MODE
        </span>
      );
    }

    if (isManualDraft) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Edit3 className="w-3 h-3 text-amber-400" aria-hidden="true" /> MANUAL DRAFT
        </span>
      );
    }

    switch (status) {
      case 'drafting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="pulse-dot" aria-hidden="true"></span> LIVE DRAFTING
          </span>
        );
      case 'paused':
        return (
          <span className="px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            PAUSED
          </span>
        );
      case 'complete':
        return (
          <span className="px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-mono font-extrabold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            PRE-DRAFT
          </span>
        );
    }
  };

  return (
    <header className="glass-panel p-4 md:px-6 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4 glass-panel-accent" role="banner">
      {/* Left: Brand Identity & Season */}
      <div className="flex items-center gap-3.5 w-full lg:w-auto">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border border-blue-400/30 shadow-md shadow-blue-500/20 shrink-0">
          <Radio className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              Sleeper Draft Assistant
            </h1>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
              2026 PPR
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Tactical Live Player Value Engine & Multi-Rankings Matrix
          </p>
        </div>
      </div>

      {/* Center: Live Draft Cockpit HUD */}
      <div className="flex items-center gap-3 glass-panel px-4 py-2.5 bg-slate-950/80 w-full lg:w-auto justify-between lg:justify-start border-slate-800">
        {draftInfo ? (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                {isManualDraft ? 'Manual Session' : 'Connected Draft'}
              </span>
              <span className="font-bold text-white max-w-[170px] truncate">
                {draftInfo.metadata?.name || `Draft #${draftInfo.draft_id}`}
              </span>
            </div>
            {getStatusBadge(draftInfo.status)}
          </div>
        ) : isDemoMode ? (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider">
                Demo Environment
              </span>
              <span className="font-bold text-white">
                Offline Mock Draft Simulator
              </span>
            </div>
            {getStatusBadge(null)}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="font-medium">No active Sleeper draft synced</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!draftInfo && !isDemoMode && (
            <>
              <button
                type="button"
                onClick={onOpenManualModal}
                className="btn btn-secondary text-xs py-1 px-2.5 text-amber-300 hover:text-amber-200 border-amber-500/30"
                title="Create a manually entered offline draft"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Manual</span>
              </button>
              <button
                type="button"
                onClick={onStartDemoMode}
                className="btn btn-secondary text-xs py-1 px-2.5 text-purple-300 hover:text-purple-200 border-purple-500/30"
                title="Test assistant in offline mock mode"
              >
                <PlayCircle className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                <span>Demo</span>
              </button>
            </>
          )}

          <button 
            type="button"
            onClick={onOpenConnectModal} 
            className="btn btn-primary text-xs py-1 px-3"
          >
            {draftInfo ? 'Change' : 'Connect Draft'}
          </button>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 w-full lg:w-auto justify-between sm:justify-end">
        <button
          type="button"
          onClick={onOpenRankingsModal}
          aria-label={`View rankings manager. Currently loaded: ${rankingsInfo?.count || 0} players`}
          className="btn btn-secondary text-xs py-1.5 px-3 min-h-[36px] flex items-center justify-center gap-2 flex-1 sm:flex-none"
          title={rankingsInfo?.source || 'Server Rankings'}
        >
          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span className="text-slate-400">Rankings:</span>
          <span className="text-blue-300 font-mono font-extrabold">
            {rankingsInfo?.count || 0}
          </span>
        </button>

        {!isManualDraft && (
          <button
            type="button"
            onClick={onRefreshPicks}
            disabled={!draftInfo || isRefreshing}
            aria-label="Sync draft picks from Sleeper"
            className="btn btn-emerald text-xs py-1.5 px-3 min-h-[36px] flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Sync Picks</span>
            {lastRefreshed && (
              <span className="text-[10px] opacity-75 font-mono ml-1 hidden xs:inline">
                ({lastRefreshed})
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
