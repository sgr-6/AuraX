import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function RiskGauge({ score }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - displayScore) / 100) * circumference;

  useEffect(() => {
    let current = 0;
    const step = score / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplayScore(Math.round(current));
      if (current >= score) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = (s) => {
    if (s >= 70) return '#EF4444';
    if (s >= 40) return '#F59E0B';
    return '#10B981';
  };

  const getLabel = (s) => {
    if (s >= 70) return { label: 'High Risk', color: '#EF4444' };
    if (s >= 40) return { label: 'Medium Risk', color: '#F59E0B' };
    return { label: 'Low Risk', color: '#10B981' };
  };

  const color = getColor(score);
  const { label, color: labelColor } = getLabel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-text-main">{displayScore}</span>
          <span className="text-text-dim text-xs">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ color: labelColor, background: `${labelColor}18` }}>
        {label}
      </span>
    </div>
  );
}

export default function RiskScoreCard({ analysis }) {
  if (analysis.riskScore == null) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">⚠️</span>
        <h3 className="font-display font-bold text-text-main">Overall Risk Score</h3>
        <span className="ml-auto text-xs text-text-dim bg-surface px-2 py-0.5 rounded-full">
          {analysis.confidence || 0}% confidence
        </span>
      </div>
      
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <RiskGauge score={analysis.riskScore || 0} />
        
        <div className="flex-1 flex flex-col gap-3 mt-2 md:mt-4 w-full">
          {analysis.risk_score_explanation && (
            <div className="p-4 rounded-xl bg-surface/30 border border-border/40">
              <p className="text-sm text-text-dim leading-relaxed">
                {analysis.risk_score_explanation}
              </p>
            </div>
          )}
          
          {analysis.overall_fairness_statement && (
            <div className="inline-flex self-start px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide">
              {analysis.overall_fairness_statement}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
