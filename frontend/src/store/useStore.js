import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Pages
  currentPage: 'landing', // 'landing' | 'dashboard'

  // Active sidebar section
  activeSection: 'analyze', // 'analyze' | 'deadlines' | 'translate' | 'chat' | 'email'

  // Document state
  document: null,
  rawText: '',
  isAnalyzing: false,
  analysisError: null,

  // Analysis results
  analysis: null,

  // UI state
  language: 'English',
  activeCard: null,
  isChatOpen: false,
  isEmailOpen: false,
  isVoicePlaying: false,

  // Chat
  chatHistory: [],
  isChatLoading: false,

  // Email drafts
  emailDrafts: null,
  isEmailLoading: false,

  // Actions
  setPage: (page) => set({ currentPage: page }),

  setActiveSection: (section) => set({ activeSection: section }),

  setDocument: (doc) => set({ document: doc }),

  setAnalysis: (data) => set({
    analysis: data.analysis,
    rawText: data.rawText,
    document: data.document,
    isAnalyzing: false,
    analysisError: null,
    currentPage: 'dashboard',
    activeSection: 'analyze',
    chatHistory: [],
    emailDrafts: null
  }),

  setAnalyzing: (bool) => set({ isAnalyzing: bool }),
  setAnalysisError: (err) => set({ analysisError: err, isAnalyzing: false }),

  setLanguage: (lang) => set({ language: lang }),
  setActiveCard: (card) => set({ activeCard: card }),
  toggleChat: () => set(s => ({ isChatOpen: !s.isChatOpen })),
  toggleEmail: () => set(s => ({ isEmailOpen: !s.isEmailOpen })),

  addChatMessage: (msg) => set(s => ({ chatHistory: [...s.chatHistory, msg] })),
  updateLastChatMessage: (content) => set(s => {
    const history = [...s.chatHistory];
    if (history.length > 0) {
      history[history.length - 1] = { ...history[history.length - 1], content };
    }
    return { chatHistory: history };
  }),
  setChatLoading: (bool) => set({ isChatLoading: bool }),
  clearChat: () => set({ chatHistory: [] }),

  setEmailDrafts: (drafts) => set({ emailDrafts: drafts, isEmailLoading: false }),
  setEmailLoading: (bool) => set({ isEmailLoading: bool }),

  setVoicePlaying: (bool) => set({ isVoicePlaying: bool }),

  reset: () => set({
    document: null,
    rawText: '',
    analysis: null,
    isAnalyzing: false,
    analysisError: null,
    currentPage: 'landing',
    activeSection: 'analyze',
    chatHistory: [],
    emailDrafts: null,
    isChatOpen: false,
    isEmailOpen: false
  })
}));
