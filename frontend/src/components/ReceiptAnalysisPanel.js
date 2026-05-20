import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/format';

function StatusBadge({ status }) {
  if (status === 'detected') {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        ✓ Found
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
      — Missing
    </span>
  );
}

function ConfidenceMeter({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>Extraction confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReceiptAnalysisPanel({ scanResult, onContinue, onRescan }) {
  const [showRawText, setShowRawText] = useState(false);

  if (!scanResult) {
    return null;
  }

  const extracted = scanResult.extracted || scanResult;
  const analysis = scanResult.analysis || extracted.analysis || {};
  const rawText = scanResult.rawText || extracted.rawText || '';
  const ocrEngine = scanResult.ocrEngine || 'OCR';
  const message = scanResult.message || '';
  const partial = scanResult.partial || false;
  const previewUrl = scanResult.previewUrl || '';
  const items = Array.isArray(extracted.items) ? extracted.items : [];
  const confidence = extracted.confidence ?? 0;
  const fields = analysis.fields || [];
  const detectedCount = fields.filter((f) => f.status === 'detected').length;

  const qualityColors = {
    good: 'text-emerald-600 dark:text-emerald-400',
    fair: 'text-amber-600 dark:text-amber-400',
    poor: 'text-red-600 dark:text-red-400',
  };
  const qualityClass = qualityColors[analysis.ocrQuality] || qualityColors.fair;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="glass-card border border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-violet-500/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {partial ? 'Partial bill analysis' : 'Bill analysis complete'}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {message || 'Here is what we found on your bill'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {analysis.summary || 'Review the extracted details below.'}
            </p>
            <ConfidenceMeter value={confidence} />
          </div>
          <div className="flex shrink-0 flex-col gap-2 rounded-xl bg-white/60 px-4 py-3 text-xs dark:bg-white/5">
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">OCR engine</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{ocrEngine}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Read quality</span>
              <span className={`font-semibold capitalize ${qualityClass}`}>
                {analysis.ocrQuality || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Fields found</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {detectedCount}/{fields.length || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-500">Characters read</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {analysis.characterCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {extracted.amount ? (
        <div className="rounded-2xl border border-primary-500/30 bg-gradient-to-r from-primary-500/10 via-violet-500/10 to-primary-500/5 p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Detected total</p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
            {formatCurrency(extracted.amount)}
          </p>
          {extracted.merchant && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{extracted.merchant}</p>
          )}
          {extracted.date && (
            <p className="text-xs text-slate-500">{formatDate(extracted.date)}</p>
          )}
        </div>
      ) : null}

      {Array.isArray(analysis.warnings) && analysis.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Notes</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-400">
            {analysis.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card">
          <h4 className="mb-4 font-bold text-slate-900 dark:text-white">Extracted details</h4>
          <div className="space-y-2">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-500">No structured fields detected.</p>
            ) : (
              fields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-white/5"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs text-slate-500">{field.label}</p>
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {field.value || '—'}
                    </p>
                  </div>
                  <StatusBadge status={field.status} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          {previewUrl ? (
            <div className="glass-card">
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Uploaded bill
              </p>
              <img
                src={previewUrl}
                alt="Receipt"
                className="max-h-56 w-full rounded-xl object-contain bg-slate-100 dark:bg-slate-800"
              />
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="glass-card">
              <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Line items ({items.length})
              </p>
              <ul className="max-h-56 space-y-2 overflow-y-auto custom-scrollbar">
                {items.map((item, i) => (
                  <li
                    key={`${item.name}-${i}`}
                    className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/5"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 font-medium text-primary-600 dark:text-primary-400">
                      {formatCurrency(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-card">
        <button
          type="button"
          onClick={() => setShowRawText(!showRawText)}
          className="flex w-full items-center justify-between text-left font-semibold text-slate-900 dark:text-white"
        >
          <span>Raw OCR text from bill</span>
          <span className="text-sm text-primary-600">{showRawText ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
        {showRawText ? (
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-300 custom-scrollbar">
            {rawText || 'No text was extracted from this image.'}
          </pre>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onContinue} className="btn-primary flex-1 py-3">
          Continue to edit & save
        </button>
        <button type="button" onClick={onRescan} className="btn-secondary">
          Scan again
        </button>
      </div>
    </div>
  );
}

export default ReceiptAnalysisPanel;
