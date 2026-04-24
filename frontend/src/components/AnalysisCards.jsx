import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } })
};

function SeverityBadge({ severity }) {
  const map = {
    CRITICAL: 'severity-critical',
    HIGH: 'severity-high',
    MEDIUM: 'severity-medium',
    LOW: 'severity-low'
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${map[severity] || 'severity-low'}`}>
      {severity}
    </span>
  );
}

function CollapsibleCard({ title, icon, index, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-base">{icon}</span>
        <span className="font-display font-bold text-text-main text-sm flex-1 text-left">{title}</span>
        {open ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border/50 pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };
  return (
    <button onClick={copy} className="text-text-dim hover:text-accent-from transition-colors mt-0.5">
      {copied ? <CheckCheck size={13} className="text-success" /> : <Copy size={13} />}
    </button>
  );
}

export default function AnalysisCards({ analysis }) {
  const { summary, clauses = [], balanced_view, suggestions = [], missingContext = [], riskySentences = [], disclaimer } = analysis;

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Executive Summary */}
      <CollapsibleCard title="Executive Summary" icon="📊" index={0}>
        <p className="text-text-dim text-sm leading-relaxed">{summary}</p>
      </CollapsibleCard>

      {/* 2. Detailed Clauses */}
      <CollapsibleCard title="Dual-Perspective Clause Analysis" icon="⚖️" index={1}>
        {clauses.length === 0 ? (
          <p className="text-text-dim text-sm">No critical clauses identified.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {clauses.map((clause, i) => (
              <div key={i} className="border border-border/50 rounded-xl bg-surface/40 overflow-hidden">
                {/* Header */}
                <div className="px-3.5 py-3 border-b border-border/50 bg-black/20 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-text-main text-sm font-bold leading-tight">{clause.title}</p>
                    <SeverityBadge severity={clause.risk_level} />
                  </div>
                  {clause.clause_text && (
                    <div className="flex items-start gap-2 bg-black/30 rounded-md px-2.5 py-2 border border-white/5">
                      <div className="w-1 h-full min-h-[20px] bg-white/10 rounded-full" />
                      <p className="text-xs text-text-dim font-mono leading-relaxed flex-1 italic">
                        "{clause.clause_text}"
                      </p>
                      <CopyButton text={clause.clause_text} />
                    </div>
                  )}
                  {clause.analysis?.fairness_indicator && (
                    <div className="inline-block mt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface/80 text-text-main border border-border/50">
                        Fairness: <span className="text-accent-from">{clause.analysis.fairness_indicator}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">
                  {/* Party A */}
                  <div className="flex flex-col bg-surface/10">
                    <div className="p-3 border-b border-border/30 flex gap-3">
                      <div className="text-success text-base flex-shrink-0 mt-0.5">🟢</div>
                      <div>
                        <p className="text-[11px] font-bold tracking-wide uppercase text-success mb-1">Party A Benefit</p>
                        <p className="text-xs text-text-dim leading-relaxed">{clause.analysis?.party_a_benefit}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-danger/5 flex gap-3">
                      <div className="opacity-50 text-base flex-shrink-0 mt-0.5">⚠️</div>
                      <div>
                        <p className="text-[11px] font-bold tracking-wide uppercase text-danger/80 mb-1">Party A Risk</p>
                        <p className="text-xs text-text-dim leading-relaxed">{clause.analysis?.party_a_risk}</p>
                      </div>
                    </div>
                  </div>

                  {/* Party B */}
                  <div className="flex flex-col bg-surface/10">
                    <div className="p-3 border-b border-border/30 flex gap-3">
                      <div className="text-success text-base flex-shrink-0 mt-0.5">🟢</div>
                      <div>
                        <p className="text-[11px] font-bold tracking-wide uppercase text-success mb-1">Party B Benefit</p>
                        <p className="text-xs text-text-dim leading-relaxed">{clause.analysis?.party_b_benefit}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-danger/5 flex gap-3">
                      <div className="opacity-50 text-base flex-shrink-0 mt-0.5">⚠️</div>
                      <div>
                        <p className="text-[11px] font-bold tracking-wide uppercase text-danger/80 mb-1">Party B Risk</p>
                        <p className="text-xs text-text-dim leading-relaxed">{clause.analysis?.party_b_risk}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Neutral Insight */}
                <div className="p-3 bg-surface/30 flex gap-3 border-t border-border/30">
                  <div className="text-text-main text-base flex-shrink-0 mt-0.5">⚖️</div>
                  <div>
                    <p className="text-[11px] font-bold tracking-wide uppercase text-text-main mb-1">Neutral Insight</p>
                    <p className="text-xs text-text-dim leading-relaxed">{clause.analysis?.neutral_insight}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* 3. Balanced View Overview */}
      <CollapsibleCard title="Balanced View Summary" icon="🤝" index={2}>
        {!balanced_view ? (
          <p className="text-text-dim text-sm">No balanced overview available.</p>
        ) : (
          <p className="text-text-dim text-sm font-medium leading-relaxed bg-surface/20 p-3 rounded-lg border border-border/30">
            {balanced_view}
          </p>
        )}
      </CollapsibleCard>

      {/* 4. Missing Context */}
      {missingContext && missingContext.length > 0 && (
        <CollapsibleCard title="Missing Context" icon="❓" index={3} defaultOpen={false}>
          <ul className="flex flex-col gap-2">
            {missingContext.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-warning">
                <span className="mt-0.5 flex-shrink-0 text-warning/70">→</span>
                {m}
              </li>
            ))}
          </ul>
        </CollapsibleCard>
      )}

      {/* 5. Risky Sentences */}
      {riskySentences && riskySentences.length > 0 && (
        <CollapsibleCard title="Risky Sentences" icon="📝" index={4} defaultOpen={false}>
          <div className="flex flex-col gap-3">
            {riskySentences.map((rs, i) => (
              <div key={i} className="border border-danger/20 bg-danger/5 rounded-xl p-3.5">
                <p className="text-danger/80 text-xs font-mono leading-relaxed mb-2 flex justify-between gap-2">
                  <span>"{rs.text}"</span>
                  <CopyButton text={rs.text} />
                </p>
                <p className="text-text-dim text-xs">{rs.explanation}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}

      {/* 6. Actionable Suggestions */}
      <CollapsibleCard title="Neutral Considerations" icon="💡" index={5}>
        {suggestions.length === 0 ? (
          <p className="text-text-dim text-sm">No suggestions provided.</p>
        ) : (
          <ul className="flex flex-col gap-2.5 bg-surface/20 p-3 rounded-xl border border-border/40">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-dim">
                <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] text-text-main font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleCard>

      {/* Disclaimer */}
      {disclaimer && (
        <div className="glass-card p-4 border border-warning/20 bg-warning/5 mt-2 flex gap-3 items-center">
          <span className="text-warning text-xl">⚠️</span>
          <p className="text-warning/90 text-sm font-semibold">{disclaimer}</p>
        </div>
      )}
    </div>
  );
}
