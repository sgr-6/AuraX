import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Clock, Globe, MessageSquare, Mail,
  Zap, RotateCcw, Menu, X, ChevronLeft
} from 'lucide-react';
import { useStore } from '../store/useStore';

// Section components
import AnalyzeSection   from './sections/AnalyzeSection';
import DeadlinesSection from './sections/DeadlinesSection';
import TranslateSection from './sections/TranslateSection';
import ChatSection      from './sections/ChatSection';
import EmailSection     from './sections/EmailSection';

// ─── Sidebar config ──────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'analyze',   label: 'Analyze',          icon: <FileSearch  size={18} />, desc: 'Document analysis & risks' },
  { id: 'deadlines', label: 'Critical Deadlines',icon: <Clock       size={18} />, desc: 'Important dates & timelines' },
  { id: 'translate', label: 'Translate',         icon: <Globe       size={18} />, desc: 'Multilingual analysis' },
  { id: 'chat',      label: 'Chat',              icon: <MessageSquare size={18} />, desc: 'Ask about the document' },
  { id: 'email',     label: 'Email Draft',       icon: <Mail        size={18} />, desc: 'Generate professional emails' },
];

const SECTION_MAP = {
  analyze:   AnalyzeSection,
  deadlines: DeadlinesSection,
  translate: TranslateSection,
  chat:      ChatSection,
  email:     EmailSection,
};

// ─── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ activeSection, onSelect, onReset, collapsed, onToggleCollapse }) {
  const { analysis, document: docMeta } = useStore();

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'rgba(10,10,20,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Logo row */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]" style={{ minHeight: 65 }}>
        <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-bold text-white text-base tracking-tight block leading-tight">AuraX</span>
            <span className="text-[#5050780] text-[10px] text-[#505070]">Legal AI Assistant</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto text-[#404060] hover:text-[#8080aa] transition-colors flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={15} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Doc pill */}
      {!collapsed && docMeta && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[#7070a0] text-[10px] font-semibold uppercase tracking-wider mb-0.5">Document</p>
          <p className="text-white text-xs font-medium truncate">{docMeta.name || 'Document'}</p>
          {analysis && (
            <p className="text-[#606088] text-[10px] mt-0.5">Risk: {analysis.riskScore}/100</p>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`sidebar-item w-full text-left ${activeSection === item.id ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Reset / New analysis */}
      <div className="px-2 pb-4 border-t border-white/[0.05] pt-3">
        <button
          onClick={onReset}
          className={`sidebar-item w-full text-left hover:text-red-400 hover:bg-red-500/8 ${collapsed ? 'justify-center' : ''}`}
          title="New Analysis"
        >
          <RotateCcw size={16} className="flex-shrink-0" />
          {!collapsed && <span>New Analysis</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────
function MobileTabBar({ activeSection, onSelect }) {
  return (
    <nav className="flex items-center justify-around border-t border-white/[0.06] bg-[#0a0a14] px-2 py-2 flex-shrink-0">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all text-[10px] font-medium ${
            activeSection === item.id
              ? 'text-indigo-400'
              : 'text-[#505070]'
          }`}
        >
          <span className={activeSection === item.id ? 'text-indigo-400' : 'text-[#505070]'}>{item.icon}</span>
          <span className="hidden xs:block">{item.label.split(' ')[0]}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { activeSection, setActiveSection, reset } = useStore();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const ActiveSection = SECTION_MAP[activeSection] || AnalyzeSection;
  const activeItem    = NAV_ITEMS.find(n => n.id === activeSection);

  const handleSelect = (id) => {
    setActiveSection(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar
          activeSection={activeSection}
          onSelect={handleSelect}
          onReset={reset}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sidebar-overlay md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              key="mobile-sidebar"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar
                activeSection={activeSection}
                onSelect={handleSelect}
                onReset={reset}
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-white/[0.06] bg-[#080810]/80 backdrop-blur-xl flex-shrink-0 z-20">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden text-[#505070] hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-[#505070] text-sm hidden sm:block">AuraX</span>
            <span className="text-[#353555] hidden sm:block">/</span>
            <div className="flex items-center gap-2">
              <span className="text-white/40">{activeItem?.icon}</span>
              <span className="font-semibold text-white text-sm">{activeItem?.label}</span>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status pill */}
          <div className="flex items-center gap-1.5 text-xs text-[#606088] bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:block">Gemini AI</span>
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              <ActiveSection />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden flex-shrink-0">
          <MobileTabBar activeSection={activeSection} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
