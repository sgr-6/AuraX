import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ZoomIn, ZoomOut, FileText, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightRiskyText(text, riskySentences = []) {
  if (!riskySentences.length) return [{ type: 'normal', text }];

  let result = text;
  const markers = [];

  riskySentences.forEach((rs, i) => {
    const snippet = rs.text?.substring(0, 60);
    if (!snippet) return;
    const idx = result.indexOf(snippet);
    if (idx !== -1) markers.push({ idx, len: rs.text.length, explanation: rs.explanation, id: i });
  });

  if (!markers.length) return [{ type: 'normal', text }];

  markers.sort((a, b) => a.idx - b.idx);
  const parts = [];
  let cursor = 0;

  for (const m of markers) {
    if (m.idx > cursor) parts.push({ type: 'normal', text: text.substring(cursor, m.idx) });
    parts.push({ type: 'risky', text: text.substring(m.idx, m.idx + m.len), explanation: m.explanation });
    cursor = m.idx + m.len;
  }
  if (cursor < text.length) parts.push({ type: 'normal', text: text.substring(cursor) });
  return parts;
}

export default function DocumentPanel() {
  const { rawText, analysis } = useStore();
  const [zoom, setZoom] = useState(14);
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef();

  const parts = highlightRiskyText(rawText, analysis?.riskySentences || []);

  const filteredParts = search.trim()
    ? parts.map(p => {
        if (!search.trim()) return p;
        const regex = new RegExp(`(${escapeRegex(search)})`, 'gi');
        if (!regex.test(p.text)) return p;
        const chunks = p.text.split(regex);
        return { ...p, chunks, searchTerm: search };
      })
    : parts;

  const riskCount = analysis?.riskySentences?.length || 0;

  return (
    <div className="flex flex-col h-full bg-abyss rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface/50 flex-shrink-0">
        <FileText size={16} className="text-accent-from" />
        <span className="font-display font-semibold text-text-main text-sm">
          {analysis?.document?.name || 'Document'}
        </span>
        {riskCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-full ml-auto">
            <AlertTriangle size={10} />
            {riskCount} risky {riskCount === 1 ? 'clause' : 'clauses'}
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-surface rounded-lg px-3 py-1.5 flex-1 max-w-xs">
          <Search size={13} className="text-text-dim" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search document..."
            className="bg-transparent text-text-main text-xs outline-none placeholder-text-dim flex-1"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setZoom(z => Math.max(10, z - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface hover:bg-panel text-text-dim hover:text-text-main transition-colors">
            <ZoomOut size={13} />
          </button>
          <span className="text-text-dim text-xs w-8 text-center">{zoom}px</span>
          <button onClick={() => setZoom(z => Math.min(22, z + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface hover:bg-panel text-text-dim hover:text-text-main transition-colors">
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Legend */}
      {riskCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-danger">
            <span className="w-3 h-2 bg-danger/30 border border-danger/50 rounded-sm" />
            Risky clause (hover for explanation)
          </div>
        </div>
      )}

      {/* Document content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6">
        <pre
          className="font-mono text-text-main whitespace-pre-wrap leading-relaxed"
          style={{ fontSize: `${zoom}px` }}
        >
          {filteredParts.map((part, i) => {
            if (part.type === 'risky') {
              return (
                <span
                  key={i}
                  className="relative cursor-help"
                  style={{
                    background: 'rgba(239,68,68,0.18)',
                    borderBottom: '2px solid rgba(239,68,68,0.7)',
                    borderRadius: '2px',
                    padding: '1px 0'
                  }}
                  onMouseEnter={e => setTooltip({ text: part.explanation, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {part.text}
                </span>
              );
            }

            // Handle search highlights within normal parts
            if (part.chunks && part.searchTerm) {
              return (
                <span key={i}>
                  {part.chunks.map((chunk, j) =>
                    chunk.toLowerCase() === part.searchTerm.toLowerCase()
                      ? <mark key={j} className="bg-warning/30 text-warning rounded-sm">{chunk}</mark>
                      : chunk
                  )}
                </span>
              );
            }

            return <span key={i}>{part.text}</span>;
          })}
        </pre>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 max-w-xs glass-card p-3 text-xs text-text-main shadow-glass pointer-events-none"
          style={{ left: Math.min(tooltip.x + 10, window.innerWidth - 280), top: tooltip.y - 60 }}
        >
          <span className="text-danger font-semibold block mb-1">⚠️ Risk Identified</span>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
