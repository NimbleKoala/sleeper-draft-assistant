import React, { useState } from 'react';
import { X, Upload, RotateCcw, FileText, Check, AlertCircle, Database } from 'lucide-react';

export default function RankingsManagerModal({
  isOpen,
  onClose,
  rankingsInfo,
  onReloadDefault,
  onUploadCustom
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
        await onUploadCustom(text, file.name);
        setMessage({ type: 'success', text: `Loaded rankings from "${file.name}"!` });
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
      await onUploadCustom(pastedCsv, sourceName.trim() || 'Custom Pasted Rankings');
      setMessage({ type: 'success', text: 'Custom CSV rankings applied successfully!' });
      setPastedCsv('');
      setSourceName('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReloadDefaultClick = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await onReloadDefault();
      setMessage({ type: 'success', text: 'Reloaded default Hayden Winks 2026 PPR Rankings!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Rankings & Value Manager
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Active Source: <span className="text-blue-300 font-bold">{rankingsInfo?.source}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Option 1: File Upload */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-blue-400" /> Upload Custom CSV
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Upload CSV containing columns: <code className="text-blue-300">Rank, Player, Team, Position</code>
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

          {/* Option 2: Reload Default */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-emerald-400" /> Reset Default Rankings
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Reload default Hayden Winks 2026 PPR Rankings CSV
              </p>
            </div>
            <button
              onClick={handleReloadDefaultClick}
              disabled={loading}
              className="btn btn-secondary text-xs justify-center"
            >
              Reload Default CSV
            </button>
          </div>
        </div>

        {/* Option 3: Paste CSV */}
        <form onSubmit={handlePasteSubmit} className="space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Or Paste CSV Text Directly
          </h3>
          <input
            type="text"
            placeholder="Ranking Set Name (Optional)"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="input-text w-full text-xs"
          />
          <textarea
            rows={3}
            placeholder="Rank,Player,Team,Position&#10;1,Jahmyr Gibbs,DET,RB"
            value={pastedCsv}
            onChange={(e) => setPastedCsv(e.target.value)}
            className="input-text w-full text-xs font-mono resize-none"
          ></textarea>
          <button
            type="submit"
            disabled={loading || !pastedCsv.trim()}
            className="btn btn-primary text-xs w-full justify-center disabled:opacity-50"
          >
            Apply Pasted CSV
          </button>
        </form>
      </div>
    </div>
  );
}
