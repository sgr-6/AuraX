import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import DocumentPanel from '../../components/DocumentPanel';
import AnalysisCards from '../../components/AnalysisCards';
import RiskScoreCard from '../../components/RiskScoreCard';
import VoicePlayer from '../../components/VoicePlayer';

export default function AnalyzeSection() {
  const { analysis } = useStore();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [showDocument, setShowDocument] = useState(false);

  if (!analysis) return null;

  const summaryText = `${analysis.summary} ${analysis.suggestions?.slice(0, 2).join('. ')}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Voice player bar */}
      <AnimatePresence>
        {voiceOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b border-white/[0.06] bg-[#0a0a18] flex-shrink-0 overflow-hidden"
          >
            <VoicePlayer text={summaryText} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.05] flex-shrink-0 bg-[#080810]">
        <button
          onClick={() => setVoiceOpen(v => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            voiceOpen
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-white/[0.04] border-white/[0.07] text-[#7070a0] hover:text-white'
          }`}
        >
          <Volume2 size={13} />
          <span className="hidden sm:inline">Voice Summary</span>
        </button>

        {/* Toggle Document Button */}
        <button
          onClick={() => setShowDocument(s => !s)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            showDocument
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-[#505070] border border-white/[0.06] hover:text-white'
          }`}
        >
          📄 {showDocument ? 'Hide Document' : 'Show Document'}
        </button>
      </div>

      {/* Rebalanced Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Main Content — Analysis (Left side / Full Width) */}
        <motion.div 
          layout
          className="flex flex-col flex-1 h-full overflow-hidden border-r border-transparent"
        >
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-8 xl:px-12">
            <div className="max-w-4xl mx-auto flex flex-col gap-4 pb-12">
              <RiskScoreCard analysis={analysis} />
              <AnalysisCards analysis={analysis} />
            </div>
          </div>
        </motion.div>

        {/* Secondary Content — Document Preview (Right side) */}
        <AnimatePresence>
          {showDocument && (
            <motion.div
              layout
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col h-full overflow-hidden border-l border-white/[0.05] bg-[#05050a] hidden md:flex md:w-[35%] lg:w-[30%] min-w-[300px]"
            >
              <div className="flex-1 overflow-hidden p-3 md:p-4">
                <DocumentPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile View Document Overlay */}
        <AnimatePresence>
          {showDocument && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 z-10 bg-[#05050a] flex flex-col md:hidden"
            >
              <div className="flex-1 overflow-hidden p-3">
                <DocumentPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
