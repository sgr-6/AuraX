import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';

// Simple date extractors for common patterns
const DATE_PATTERNS = [
  /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/g,
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
  /\bwithin\s+(\d+)\s+(days?|weeks?|months?|years?)\b/gi,
  /\b(termination|expiry|renewal|notice|deadline|due|payment|effective)\s+date[^.]*?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi,
];

const DEADLINE_KEYWORDS = [
  { word: 'terminat', label: 'Termination', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertTriangle size={15} className="text-red-400" /> },
  { word: 'expir', label: 'Expiry', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: <Clock size={15} className="text-orange-400" /> },
  { word: 'renew', label: 'Renewal', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <CheckCircle2 size={15} className="text-emerald-400" /> },
  { word: 'payment', label: 'Payment', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Calendar size={15} className="text-yellow-400" /> },
  { word: 'notice', label: 'Notice', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <Clock size={15} className="text-blue-400" /> },
  { word: 'due', label: 'Due Date', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: <Calendar size={15} className="text-purple-400" /> },
  { word: 'deadline', label: 'Deadline', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertTriangle size={15} className="text-red-400" /> },
  { word: 'effectiv', label: 'Effective Date', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <Calendar size={15} className="text-indigo-400" /> },
];

function extractDeadlines(text) {
  if (!text) return [];
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);
  const found = [];

  sentences.forEach(sentence => {
    const hasDate = DATE_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(sentence);
    });
    if (!hasDate) return;

    const lc = sentence.toLowerCase();
    const kw = DEADLINE_KEYWORDS.find(k => lc.includes(k.word));
    if (!kw && !lc.includes('date') && !lc.includes('day') && !lc.includes('month') && !lc.includes('year')) return;

    found.push({
      sentence: sentence.length > 180 ? sentence.substring(0, 180) + '…' : sentence,
      type: kw?.label || 'Date Reference',
      color: kw?.color || 'text-indigo-400',
      bg: kw?.bg || 'bg-indigo-500/10',
      border: kw?.border || 'border-indigo-500/20',
      icon: kw?.icon || <Calendar size={15} className="text-indigo-400" />,
    });
  });

  // Deduplicate by sentence start
  const seen = new Set();
  return found.filter(d => {
    const key = d.sentence.substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function DeadlinesSection() {
  const { rawText, analysis } = useStore();

  const deadlines = useMemo(() => extractDeadlines(rawText), [rawText]);

  if (!analysis) return null;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center">
            <Clock size={20} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Critical Deadlines</h2>
            <p className="text-[#606088] text-sm">Dates and time-sensitive clauses extracted from your document</p>
          </div>
          <div className="ml-auto text-sm font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
            {deadlines.length} found
          </div>
        </div>

        {deadlines.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Calendar size={28} className="text-[#404060]" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">No explicit dates found</p>
              <p className="text-[#505070] text-sm max-w-sm">
                This document may use relative timeframes (e.g. "30 days from signing") rather than fixed calendar dates.
                Review the Analyze section for context.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {deadlines.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass-card-sm p-4 border ${d.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${d.bg} border ${d.border}`}>
                    {d.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${d.color}`}>{d.type}</span>
                    </div>
                    <p className="text-[#c0c0e0] text-sm leading-relaxed">
                      {d.sentence}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Disclaimer */}
            <div className="glass-card p-4 border border-yellow-500/20 bg-yellow-500/5 mt-2">
              <p className="text-yellow-400/80 text-xs leading-relaxed">
                ⚠️ <strong>Note:</strong> Deadlines are extracted automatically from the document text. Always verify dates in the original document and consult a qualified attorney before taking action.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
