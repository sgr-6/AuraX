import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, Copy, CheckCheck, RefreshCw, Send } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateEmailDrafts } from '../utils/api';
import toast from 'react-hot-toast';

const EMAIL_TYPES = [
  { key: 'clarification', label: 'Clarify Terms', icon: '🔍', desc: 'Ask about ambiguous clauses' },
  { key: 'negotiation', label: 'Negotiate', icon: '🤝', desc: 'Flag and push back on risky terms' },
  { key: 'missing_info', label: 'Request Info', icon: '📋', desc: 'Ask about missing information' }
];

export default function EmailDrafter({ onClose }) {
  const { analysis, emailDrafts, isEmailLoading, setEmailDrafts, setEmailLoading, language } = useStore();
  const [activeTab, setActiveTab] = useState('clarification');
  const [editedBodies, setEditedBodies] = useState({});
  const [copied, setCopied] = useState({});

  const fetchDrafts = async () => {
    try {
      setEmailLoading(true);
      const data = await generateEmailDrafts(
        { summary: analysis.summary },
        analysis.clauses || [],
        language
      );
      setEmailDrafts(data);
      const bodies = {};
      data.emails?.forEach(e => { bodies[e.type] = e.body; });
      setEditedBodies(bodies);
    } catch (err) {
      toast.error('Failed to generate emails. Please try again.');
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    if (!emailDrafts) fetchDrafts();
    else {
      const bodies = {};
      emailDrafts.emails?.forEach(e => { bodies[e.type] = e.body; });
      setEditedBodies(bodies);
    }
  }, []);

  const getEmail = (type) => emailDrafts?.emails?.find(e => e.type === type);
  const activeEmail = getEmail(activeTab);
  const activeBody = editedBodies[activeTab] || activeEmail?.body || '';

  const copy = (field) => {
    const text = field === 'subject' ? activeEmail?.subject : activeBody;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(c => ({ ...c, [field]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [field]: false })), 2000);
    toast.success(`${field === 'subject' ? 'Subject' : 'Email body'} copied!`);
  };

  const copyAll = () => {
    const full = `Subject: ${activeEmail?.subject}\n\n${activeBody}`;
    navigator.clipboard.writeText(full);
    toast.success('Full email copied to clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex flex-col glass-card border border-border shadow-glass max-h-[90vh]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center">
          <Mail size={17} className="text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-text-main">Smart Email Drafter</h2>
          <p className="text-text-dim text-xs">AI-generated templates based on your document analysis</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchDrafts} disabled={isEmailLoading}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-accent-from hover:bg-surface transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={isEmailLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-surface transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {isEmailLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-2 border-border border-t-accent-from rounded-full animate-spin" />
          <p className="text-text-dim text-sm">Generating email templates...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border/50 flex-shrink-0">
            {EMAIL_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  activeTab === t.key
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-dim bg-surface hover:text-text-main hover:bg-panel'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:block font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeEmail ? (
              <div className="flex flex-col gap-4 max-w-2xl">
                <p className="text-text-dim text-xs">{EMAIL_TYPES.find(t => t.key === activeTab)?.desc}</p>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label className="text-text-dim text-xs font-semibold uppercase tracking-wider">Subject</label>
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3">
                    <p className="flex-1 text-text-main text-sm">{activeEmail.subject}</p>
                    <button onClick={() => copy('subject')} className="text-text-dim hover:text-accent-from transition-colors flex-shrink-0">
                      {copied.subject ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-text-dim text-xs font-semibold uppercase tracking-wider">Body</label>
                    <span className="text-text-dim text-xs">Editable</span>
                  </div>
                  <textarea
                    value={activeBody}
                    onChange={e => setEditedBodies(b => ({ ...b, [activeTab]: e.target.value }))}
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-text-main text-sm leading-relaxed outline-none focus:border-accent-from/50 resize-none transition-colors font-body"
                    rows={12}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button onClick={copyAll}
                    className="btn-primary flex items-center gap-2 text-sm">
                    <Copy size={14} />
                    Copy Full Email
                  </button>
                  <button onClick={() => copy('body')}
                    className="flex items-center gap-2 text-sm text-text-dim bg-surface border border-border px-4 py-2.5 rounded-xl hover:text-text-main hover:border-border/80 transition-all">
                    {copied.body ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
                    Copy Body
                  </button>
                  <button
                    onClick={() => {
                      const mailto = `mailto:?subject=${encodeURIComponent(activeEmail.subject)}&body=${encodeURIComponent(activeBody)}`;
                      window.open(mailto);
                    }}
                    className="flex items-center gap-2 text-sm text-text-dim bg-surface border border-border px-4 py-2.5 rounded-xl hover:text-text-main hover:border-border/80 transition-all ml-auto"
                  >
                    <Send size={14} />
                    Open in Mail
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-text-dim text-sm">No template available for this type.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
