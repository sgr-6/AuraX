import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Volume2 } from 'lucide-react';
import { useStore } from '../store/useStore';

function Waveform({ isPlaying }) {
  const bars = Array.from({ length: 20 });
  return (
    <div className="flex items-center gap-0.5 h-6">
      {bars.map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            height: isPlaying ? `${20 + Math.sin(Date.now() / 200 + i) * 14}%` : '20%',
            minHeight: '3px',
            maxHeight: '100%',
            animation: isPlaying ? `wave ${0.6 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

const SPEEDS = [0.8, 1.0, 1.25, 1.5];

export default function VoicePlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef(null);
  const { setVoicePlaying } = useStore();

  const speak = (resumeText) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(resumeText || text);
    utter.rate = SPEEDS[speedIdx];
    utter.pitch = 1;
    utter.volume = 1;

    // Pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => { setIsPlaying(true); setVoicePlaying(true); };
    utter.onend = () => { setIsPlaying(false); setVoicePlaying(false); setProgress(0); };
    utter.onerror = () => { setIsPlaying(false); setVoicePlaying(false); };
    utter.onboundary = (e) => {
      if (text.length > 0) setProgress(Math.round((e.charIndex / text.length) * 100));
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setVoicePlaying(false);
    setProgress(0);
  };

  const replay = () => { stop(); setTimeout(() => speak(), 100); };

  useEffect(() => () => stop(), []);

  return (
    <div className="glass-card px-4 py-3 flex items-center gap-3">
      <Volume2 size={15} className="text-accent-from flex-shrink-0" />
      <Waveform isPlaying={isPlaying} />

      <div className="flex items-center gap-2 ml-auto">
        {/* Speed toggle */}
        <button
          onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)}
          className="text-xs text-text-dim bg-surface border border-border px-2 py-1 rounded-lg hover:text-accent-from hover:border-accent-from/30 transition-all font-mono"
        >
          {SPEEDS[speedIdx]}x
        </button>

        {/* Replay */}
        <button onClick={replay}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-surface transition-colors">
          <RotateCcw size={13} />
        </button>

        {/* Play / Stop */}
        <button
          onClick={isPlaying ? stop : () => speak()}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-accent text-white hover:shadow-glow transition-all"
        >
          {isPlaying ? <Square size={12} fill="white" /> : <Play size={13} fill="white" />}
        </button>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-accent transition-all" style={{ width: `${progress}%` }} />
      )}
    </div>
  );
}
