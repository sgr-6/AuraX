import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, Zap, Shield, Globe, ChevronRight, FileText, X, ArrowRight, Scale } from 'lucide-react';
import { useStore } from '../store/useStore';
import { analyzeDocument, analyzeText } from '../utils/api';

const LANGUAGES = ['English', 'हिंदी', 'ಕನ್ನಡ', 'தமிழ்', 'తెలుగు', 'മലയാളം'];

const FEATURES = [
  { icon: <Scale size={20} />, title: 'Unbiased Analysis', desc: 'Every clause evaluated from both sides — no favourites.' },
  { icon: <Shield size={20} />, title: 'Risk Detection', desc: 'Critical risks highlighted with severity and plain-English impact.' },
  { icon: <Globe size={20} />, title: '6 Indian Languages', desc: 'Full analysis in Hindi, Kannada, Tamil, Telugu & more.' },
  { icon: <Zap size={20} />, title: 'Instant AI Insights', desc: 'Powered by Google Gemini for fast, accurate responses.' },
];

function Particle({ style }) {
  return <div className="particle" style={style} />;
}

// ─── SPLASH (hero) ─────────────────────────────────────────────
function SplashView({ onGetStarted }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    left: `${5 + (i * 5.5) % 92}%`,
    animationDuration: `${9 + (i * 3.7) % 11}s`,
    animationDelay: `${(i * 1.3) % 8}s`,
    opacity: 0.25 + (i % 4) * 0.1,
  }));

  return (
    <div className="min-h-screen bg-[#080810] dot-grid relative overflow-hidden flex flex-col">
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
      </div>

      {/* Ambient orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.07), transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/5 w-[380px] h-[380px] rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(118,75,162,0.07), transparent 70%)' }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap size={17} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">AuraX</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7070a0] bg-white/[0.04] border border-white/[0.07] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI Online
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] text-[#9090bb] text-xs px-4 py-2 rounded-full mb-10"
          >
            <Shield size={12} className="text-indigo-400" />
            Unbiased · Neutral · Educational · Not Legal Advice
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-5 leading-[1.04] tracking-tight">
            Welcome to{' '}
            <span className="text-gradient">AuraX</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#7070a0] font-medium mb-4">
            An Unbiased Legal AI Decision Support System
          </p>

          <p className="text-[#5050780] md:text-base text-sm text-[#505078] max-w-xl mx-auto mb-14 leading-relaxed">
            Upload any contract, agreement, or legal document and get clear, neutral analysis 
            in seconds — risks, clauses, and balanced insights in plain English.
          </p>

          {/* CTA */}
          <motion.button
            onClick={onGetStarted}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all animate-pulse-glow"
          >
            Get Started
            <ArrowRight size={20} />
          </motion.button>

          <p className="text-[#404060] text-sm mt-5">
            Free to use · No login required · Your documents stay private
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto w-full"
        >
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card-sm p-5 text-left group hover:border-indigo-500/20 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/10 transition-all">
                {f.icon}
              </div>
              <p className="text-white font-semibold text-sm mb-1">{f.title}</p>
              <p className="text-[#6060888] text-xs leading-relaxed text-[#606088]">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

// ─── UPLOAD (analyze flow) ──────────────────────────────────────
function UploadView({ onBack }) {
  const { setAnalysis, setAnalyzing, setAnalysisError, isAnalyzing, language, setLanguage } = useStore();
  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const inFlightRef = useRef(false); // extra guard against double-submit

  const handleAnalyze = async () => {
    // Hard guard: ignore if already processing
    if (inFlightRef.current || isAnalyzing) return;
    inFlightRef.current = true;

    try {
      setAnalyzing(true);
      let result;

      if (pasteMode && pastedText.trim()) {
        if (pastedText.trim().length < 50) {
          toast.error('Please paste at least 50 characters of document text');
          return;
        }
        toast.loading('Analyzing document…', { id: 'analyzing' });
        result = await analyzeText(pastedText.trim(), language);
      } else if (uploadedFile) {
        toast.loading('Processing & analyzing document…', { id: 'analyzing' });
        result = await analyzeDocument(uploadedFile, language);
      } else {
        toast.error('Please upload a file or paste document text');
        return;
      }

      toast.dismiss('analyzing');
      toast.success('Analysis complete!');
      setAnalysis(result);
    } catch (err) {
      toast.dismiss('analyzing');
      const isRateLimit = err.message?.toLowerCase().includes('high traffic') ||
                          err.message?.toLowerCase().includes('busy') ||
                          err.message?.toLowerCase().includes('rate limit');
      toast.error(
        isRateLimit
          ? '⏳ AuraX is busy right now — please wait a moment and try again.'
          : err.message || 'Analysis failed. Please try again.',
        { duration: 5000 }
      );
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
      inFlightRef.current = false;
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
      setPasteMode(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDropRejected: (files) => {
      toast.error(files[0]?.errors[0]?.message || 'File rejected');
    }
  });

  const canAnalyze = (uploadedFile && !pasteMode) || (pasteMode && pastedText.trim().length >= 50);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="min-h-screen bg-[#080810] dot-grid relative overflow-hidden flex flex-col"
    >
      {/* Ambient */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.06), transparent 70%)' }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/[0.05]">
        <button onClick={onBack} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
            <Zap size={17} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">AuraX</span>
        </button>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.07] text-[#9090bb] text-sm px-3 py-1.5 rounded-xl focus:outline-none cursor-pointer"
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">Analyze Your Document</h2>
            <p className="text-[#6060888] text-[#606088]">Upload a PDF, DOCX or TXT — or paste text directly</p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 justify-center mb-5">
            {['Upload File', 'Paste Text'].map((label, i) => (
              <button
                key={label}
                onClick={() => { if (i === 0) setPasteMode(false); else setPasteMode(true); }}
                className={`text-sm px-5 py-2 rounded-xl font-medium transition-all ${
                  (i === 0 ? !pasteMode : pasteMode)
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-indigo-500/20'
                    : 'text-[#7070a0] hover:text-white bg-white/[0.04] border border-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!pasteMode ? (
              <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {uploadedFile ? (
                  <div className="glass-card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{uploadedFile.name}</p>
                        <p className="text-[#6060888] text-sm text-[#606088]">{(uploadedFile.size / 1024).toFixed(1)} KB · Ready to analyze</p>
                      </div>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="text-[#505070] hover:text-red-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`glass-card p-14 cursor-pointer transition-all duration-300 border-2 border-dashed flex flex-col items-center gap-5 ${
                      isDragActive
                        ? 'border-indigo-400 bg-indigo-500/5 shadow-xl shadow-indigo-500/10'
                        : 'border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.02]'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                      isDragActive ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-xl shadow-indigo-500/30' : 'bg-white/[0.05] border border-white/[0.08]'
                    }`}>
                      <Upload size={32} className={isDragActive ? 'text-white' : 'text-[#5050780] text-[#505078]'} />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg mb-1">
                        {isDragActive ? 'Drop it here' : 'Drop your legal document'}
                      </p>
                      <p className="text-[#5050780] text-[#505078] text-sm">PDF, DOCX, or TXT · Max 10 MB</p>
                    </div>
                    <span className="text-indigo-400 text-sm font-semibold bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full">
                      or click to browse
                    </span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Paste your contract, agreement or legal document text here..."
                  className="w-full glass-card p-5 text-white text-sm placeholder-[#404060] resize-none outline-none focus:border-indigo-500/40 font-mono h-52 leading-relaxed"
                  style={{ border: '1px solid rgba(102,126,234,0.15)' }}
                />
                <p className="text-xs text-[#505070] mt-2 text-right">
                  {pastedText.length} chars {pastedText.length < 50 && pastedText.length > 0 ? '· min 50 needed' : ''}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze button */}
          <motion.button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            whileHover={{ scale: canAnalyze && !isAnalyzing ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full mt-5 btn-primary flex items-center justify-center gap-3 py-4 text-base ${
              !canAnalyze ? 'opacity-40 cursor-not-allowed' : 'animate-pulse-glow'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing with Gemini AI...
              </>
            ) : (
              <>
                <Zap size={18} />
                Analyze with AuraX
                <ChevronRight size={16} />
              </>
            )}
          </motion.button>

          <p className="text-[#404060] text-xs text-center mt-4">
            ⚠️ Analysis is for understanding only — not legal advice. Always consult a qualified attorney.
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────
export default function LandingPage() {
  const [phase, setPhase] = useState('splash'); // 'splash' | 'upload'

  return (
    <AnimatePresence mode="wait">
      {phase === 'splash' ? (
        <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
          <SplashView onGetStarted={() => setPhase('upload')} />
        </motion.div>
      ) : (
        <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <UploadView onBack={() => setPhase('splash')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
