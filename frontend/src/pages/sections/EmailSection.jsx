import { useStore } from '../../store/useStore';
import EmailDrafter from '../../components/EmailDrafter';

// Adapter: EmailDrafter was built as a full-screen modal.
// We wrap it inline by removing the fixed positioning via a container trick.
export default function EmailSection() {
  const { analysis } = useStore();
  if (!analysis) return null;

  return (
    <div className="h-full overflow-hidden p-3 md:p-4">
      <EmailDrafterInline />
    </div>
  );
}

// Inline version of EmailDrafter (no fixed/modal positioning)
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Copy, CheckCheck, RefreshCw, Send } from 'lucide-react';
import { generateEmailDrafts } from '../../utils/api';
import toast from 'react-hot-toast';

const EMAIL_TYPES = [
  { key: 'clarification', label: 'Clarify Terms',   icon: '🔍', desc: 'Ask about ambiguous clauses' },
  { key: 'negotiation',   label: 'Negotiate',        icon: '🤝', desc: 'Flag and push back on risky terms' },
  { key: 'missing_info',  label: 'Request Info',     icon: '📋', desc: 'Ask about missing information' },
];

function EmailDrafterInline() {
  const { analysis, emailDrafts, isEmailLoading, setEmailDrafts, setEmailLoading, language } = useStore();
  const [activeTab,    setActiveTab]    = useState('clarification');
  const [editedBodies, setEditedBodies] = useState({});
  const [copied,       setCopied]       = useState({});

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

  const getEmail   = (type) => emailDrafts?.emails?.find(e => e.type === type);
  const activeEmail = getEmail(activeTab);
  const activeBody  = editedBodies[activeTab] || activeEmail?.body || '';

  const copy = (field) => {
    const text = field === 'subject' ? activeEmail?.subject : activeBody;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(c => ({ ...c, [field]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [field]: false })), 2000);
    toast.success(`${field === 'subject' ? 'Subject' : 'Body'} copied!`);
  };

  const copyAll = () => {
    const full = `Subject: ${activeEmail?.subject}\n\n${activeBody}`;
    navigator.clipboard.writeText(full);
    toast.success('Full email copied!');
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
          <Mail size={16} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white text-base">Smart Email Drafter</h2>
          <p className="text-[#606088] text-xs">AI-generated templates based on your document analysis</p>
        </div>
        <button
          onClick={fetchDrafts}
          disabled={isEmailLoading}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-[#606088] hover:text-indigo-400 hover:bg-white/[0.05] transition-colors disabled:opacity-40"
          title="Regenerate"
        >
          <RefreshCw size={14} className={isEmailLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isEmailLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-[#6060888] text-sm text-[#606088]">Generating email templates...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
            {EMAIL_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-indigo-500/20'
                    : 'text-[#6060888] text-[#606088] bg-white/[0.03] hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
                }`}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:block">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeEmail ? (
              <div className="flex flex-col gap-4 max-w-2xl">
                <p className="text-[#606088] text-xs">{EMAIL_TYPES.find(t => t.key === activeTab)?.desc}</p>

                {/* Subject */}
                <div>
                  <label className="text-[#7070a0] text-xs font-semibold uppercase tracking-wider mb-2 block">Subject</label>
                  <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                    <p className="flex-1 text-white text-sm">{activeEmail.subject}</p>
                    <button onClick={() => copy('subject')} className="text-[#505070] hover:text-indigo-400 transition-colors flex-shrink-0">
                      {copied.subject ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#7070a0] text-xs font-semibold uppercase tracking-wider">Body</label>
                    <span className="text-[#404060] text-xs">Editable</span>
                  </div>
                  <textarea
                    value={activeBody}
                    onChange={e => setEditedBodies(b => ({ ...b, [activeTab]: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm leading-relaxed outline-none focus:border-indigo-500/40 resize-none transition-colors"
                    rows={10}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={copyAll} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5">
                    <Copy size={14} /> Copy Full Email
                  </button>
                  <button
                    onClick={() => copy('body')}
                    className="flex items-center gap-2 text-sm text-[#7070a0] bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-xl hover:text-white transition-all"
                  >
                    {copied.body ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    Copy Body
                  </button>
                  <button
                    onClick={() => {
                      const mailto = `mailto:?subject=${encodeURIComponent(activeEmail.subject)}&body=${encodeURIComponent(activeBody)}`;
                      window.open(mailto);
                    }}
                    className="flex items-center gap-2 text-sm text-[#7070a0] bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-xl hover:text-white transition-all ml-auto"
                  >
                    <Send size={14} /> Open in Mail
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-[#606088] text-sm">No template available for this type.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
