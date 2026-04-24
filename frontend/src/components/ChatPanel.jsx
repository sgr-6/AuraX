import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Trash2, Bot, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { sendChatMessage } from '../utils/api';
import toast from 'react-hot-toast';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-white" />
      </div>
      <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-from typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-from typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-from typing-dot" />
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-surface border border-border' : 'bg-gradient-accent'
      }`}>
        {isUser ? <User size={13} className="text-text-dim" /> : <Bot size={13} className="text-white" />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-accent text-white rounded-br-sm'
          : 'glass-card text-text-main rounded-bl-sm'
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

const SUGGESTED = [
  'What are the biggest risks?',
  'Explain the termination clause',
  'What should I ask before signing?'
];

export default function ChatPanel({ onClose }) {
  const { chatHistory, isChatLoading, rawText, analysis, language, addChatMessage, setChatLoading, clearChat } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || isChatLoading) return;
    setInput('');

    addChatMessage({ role: 'user', content: msg });
    setChatLoading(true);

    try {
      const response = await sendChatMessage(
        msg,
        chatHistory.slice(-8),
        rawText.substring(0, 4000),
        language
      );
      addChatMessage({ role: 'assistant', content: response });
    } catch (err) {
      toast.error('Chat failed. Please try again.');
      addChatMessage({ role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.' });
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center">
          <Bot size={15} className="text-white" />
        </div>
        <div>
          <p className="text-text-main font-display font-semibold text-sm">AuraX Chat</p>
          <p className="text-text-dim text-xs">Ask anything about this document</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {chatHistory.length > 0 && (
            <button onClick={clearChat} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-danger hover:bg-danger/10 transition-colors" title="Clear chat">
              <Trash2 size={14} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-main hover:bg-surface transition-colors">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-accent/20 border border-accent-from/30 flex items-center justify-center">
              <Bot size={24} className="text-accent-from" />
            </div>
            <div>
              <p className="text-text-main font-semibold mb-1">Ask me anything</p>
              <p className="text-text-dim text-xs leading-relaxed max-w-[220px]">
                I can explain clauses, flag concerns, and simplify legal terms — always neutrally.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTED.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className="text-left text-xs text-text-dim bg-surface hover:bg-panel border border-border hover:border-accent-from/30 px-3 py-2.5 rounded-xl transition-all hover:text-accent-from">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, i) => <Message key={i} msg={msg} />)}
            {isChatLoading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about this document..."
            rows={1}
            className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-text-main text-sm placeholder-text-dim resize-none outline-none focus:border-accent-from/50 transition-colors leading-relaxed"
            style={{ maxHeight: '100px', overflowY: 'auto' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isChatLoading}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow transition-all"
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-text-dim text-xs mt-2 text-center">Not legal advice · Consult a qualified attorney</p>
      </div>
    </motion.div>
  );
}
