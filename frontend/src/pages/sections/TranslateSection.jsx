import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { sendChatMessage } from '../../utils/api';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'हिंदी',     label: 'Hindi',     flag: '🇮🇳' },
  { code: 'ಕನ್ನಡ',    label: 'Kannada',   flag: '🇮🇳' },
  { code: 'தமிழ்',    label: 'Tamil',     flag: '🇮🇳' },
  { code: 'తెలుగు',   label: 'Telugu',    flag: '🇮🇳' },
  { code: 'മലയാളം', label: 'Malayalam', flag: '🇮🇳' },
  { code: 'मराठी',    label: 'Marathi',   flag: '🇮🇳' },
  { code: 'বাংলা',    label: 'Bengali',   flag: '🇮🇳' },
  { code: 'ਪੰਜਾਬੀ',   label: 'Punjabi',   flag: '🇮🇳' },
  { code: 'ગુજરાતી', label: 'Gujarati',  flag: '🇮🇳' },
];

export default function TranslateSection() {
  const { analysis, rawText } = useStore();
  const [selectedLang, setSelectedLang] = useState(null);
  const [translated, setTranslated]     = useState('');
  const [loading, setLoading]           = useState(false);

  const handleTranslate = async (lang) => {
    if (!analysis) return;
    setSelectedLang(lang);
    setTranslated('');
    setLoading(true);

    const prompt = `Translate and summarize the following strictly neutral legal document analysis into ${lang.label} (${lang.code}). 
Keep all key information intact: the dual-perspective clause analysis and suggestions.
Maintain a completely unbiased and professional tone. Use ${lang.code} script throughout.

Document Summary: ${analysis.summary}

Top Clauses (Dual-Perspective):
${(analysis.clauses || []).slice(0, 3).map((c, i) => `${i + 1}. [${c.risk_level}] ${c.title}\n   Text: "${c.clause_text}"\n   Party A Benefit: ${c.analysis?.party_a_benefit}\n   Party B Risk: ${c.analysis?.party_b_risk}`).join('\n\n')}

Key Suggestions:
${(analysis.suggestions || []).slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n')}

Translate the summary, clause overviews, and suggestions directly into ${lang.label}. Use clear, neutral language.`;

    try {
      const response = await sendChatMessage(prompt, [], rawText.substring(0, 2000), lang.code);
      setTranslated(response);
    } catch (err) {
      toast.error('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) return null;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Translate Analysis</h2>
            <p className="text-[#606088] text-sm">Get the full AI analysis in your preferred Indian language</p>
          </div>
        </div>

        {/* Language selector */}
        <div className="glass-card p-5 mb-5">
          <p className="text-[#7070a0] text-xs font-semibold uppercase tracking-wider mb-4">Select Language</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleTranslate(lang)}
                disabled={loading}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all ${
                  selectedLang?.code === lang.code
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-white'
                    : 'bg-white/[0.02] border-white/[0.07] text-[#8080aa] hover:border-indigo-500/30 hover:text-white hover:bg-white/[0.04]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{lang.label}</p>
                  <p className="text-xs text-[#505070]">{lang.code}</p>
                </div>
                {selectedLang?.code === lang.code && !loading && translated && (
                  <CheckCircle2 size={14} className="ml-auto text-indigo-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Result area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-10 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-[#7070a0] text-sm">
                Translating into {selectedLang?.label}...
              </p>
            </motion.div>
          )}

          {!loading && translated && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                <span className="text-lg">{selectedLang?.flag}</span>
                <span className="text-white font-semibold">{selectedLang?.label} Translation</span>
                <button
                  onClick={() => handleTranslate(selectedLang)}
                  className="ml-auto text-[#505070] hover:text-indigo-400 transition-colors"
                  title="Re-translate"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="text-[#c0c0e0] text-sm leading-relaxed whitespace-pre-wrap">
                {translated}
              </div>
            </motion.div>
          )}

          {!loading && !translated && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-10 flex flex-col items-center text-center gap-3"
            >
              <Globe size={32} className="text-[#303050]" />
              <p className="text-[#505070] text-sm">Select a language above to translate the analysis</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
