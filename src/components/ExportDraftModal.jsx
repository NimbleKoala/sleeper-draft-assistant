import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Table } from 'lucide-react';
import { exportDraftToCsv, exportDraftToText } from '../utils/manualDraftUtils';

export default function ExportDraftModal({ isOpen, onClose, draftInfo, picks = [] }) {
  const [copiedFormat, setCopiedFormat] = useState(null);

  if (!isOpen) return null;

  const csvContent = exportDraftToCsv(draftInfo, picks);
  const textContent = exportDraftToText(draftInfo, picks);

  const handleCopy = (format) => {
    const content = format === 'csv' ? csvContent : textContent;
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${(draftInfo?.metadata?.name || 'draft').toLowerCase().replace(/\s+/g, '_')}_picks.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-content max-w-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close export modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <h2 id="export-modal-title" className="text-xl font-extrabold text-white tracking-tight">
            Export Draft Results
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          {picks.length} picks logged for <span className="text-white font-bold">{draftInfo?.metadata?.name || 'Manual Draft'}</span>
        </p>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="btn btn-emerald py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download CSV Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopy('csv')}
            className="btn btn-secondary py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold"
          >
            {copiedFormat === 'csv' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-300">Copied CSV!</span>
              </>
            ) : (
              <>
                <Table className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <span>Copy CSV to Clipboard</span>
              </>
            )}
          </button>
        </div>

        {/* Text Summary Preview & Copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Draft Summary Text</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy('text')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
            >
              {copiedFormat === 'text' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={textContent}
            className="input-text w-full h-48 font-mono text-[11px] bg-slate-950/90 text-slate-300 p-3 rounded-xl border-slate-800 resize-none select-all"
          />
        </div>
      </div>
    </div>
  );
}
