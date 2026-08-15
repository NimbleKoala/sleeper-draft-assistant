import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Database, Trash2, Layers, ShieldAlert } from 'lucide-react';

export default function RankingsManagerModal({
  isOpen,
  onClose,
  savedRankings = [],
  selectedRankingIds = ['default'],
  onToggleSelectRanking,
  onUploadCustom,
  onDeleteCustom
}) {
  const [pastedCsv, setPastedCsv] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const uploadName = file.name.replace(/\.csv$/i, '');
        await onUploadCustom(text, uploadName);
        setMessage({ type: 'success', text: `Saved rankings dataset "${uploadName}" to server!` });
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pastedCsv.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const uploadName = sourceName.trim() || 'Custom Pasted Ranking';
      await onUploadCustom(pastedCsv, uploadName);
      setMessage({ type: 'success', text: `Saved dataset "${uploadName}" to server!` });
      setPastedCsv('');
      setSourceName('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      await onDeleteCustom(id);
      setMessage({ type: 'success', text: `Deleted dataset "${name}".` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rankings-modal-title">
      <div className="modal-content max-w-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close rankings manager modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <h2 id="rankings-modal-title" className="text-lg sm:text-xl font-extrabold text-white">
            Server Rankings & Multi-Comparison Manager
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Select <span className="text-blue-300 font-bold">up to 3 active rankings</span> to display side-by-side in your draft dashboard.
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Saved Server Datasets List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Saved Datasets on Server
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
              {selectedRankingIds.length} / 3 Active Selected
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {savedRankings.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                No saved rankings datasets found on server.
              </div>
            ) : (
              savedRankings.map((dataset, idx) => {
                const isSelected = selectedRankingIds.includes(dataset.id);
                const isPrimary = selectedRankingIds[0] === dataset.id;
                const canSelectMore = isSelected || selectedRankingIds.length < 3;

                return (
                  <div
                    key={dataset.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSelectMore && !isSelected}
                        onChange={() => onToggleSelectRanking(dataset.id)}
                        className="w-4 h-4 rounded border-slate-700 text-blue-500 focus:ring-blue-500 bg-slate-900 cursor-pointer disabled:opacity-30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {dataset.name}
                          </span>
                          {dataset.isDefault && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Default PPR
                            </span>
                          )}
                          {isPrimary && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {dataset.count} players • Updated {new Date(dataset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!dataset.isDefault && (
                        <button
                          onClick={() => handleDelete(dataset.id, dataset.name)}
                          disabled={loading}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upload Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-blue-400" /> Upload & Save CSV
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Upload custom CSV to server: <code className="text-blue-300">Rank, Player, Team, Position</code>
              </p>
            </div>
            <label className="btn btn-primary text-xs justify-center cursor-pointer">
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          <form onSubmit={handlePasteSubmit} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-purple-400" /> Paste & Save CSV Text
              </h3>
              <input
                type="text"
                placeholder="Dataset Name (e.g. ESPN PPR)"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="input-text w-full text-xs mb-2"
              />
              <textarea
                rows={2}
                placeholder="Rank,Player,Team,Position&#10;1,Jahmyr Gibbs,DET,RB"
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                className="input-text w-full text-xs font-mono resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading || !pastedCsv.trim()}
              className="btn btn-primary text-xs w-full justify-center disabled:opacity-50"
            >
              Save Pasted CSV
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
