import express from 'express';
import { streamLLM, callLLM } from '../services/llm.js';

export const chatRouter = express.Router();

chatRouter.post('/', async (req, res) => {
  try {
    const { message, history = [], documentContext = '', language = 'English' } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextNote = documentContext
      ? `\n\nDOCUMENT CONTEXT (for reference only):\n${documentContext.substring(0, 6000)}`
      : '';

    const systemContext = `You are AuraX, an unbiased legal document AI assistant. You help users UNDERSTAND legal documents — never advise them.
    
Rules:
- Stay neutral — never favor either party  
- Simplify legal terms to plain English
- Say "you may want to consider" not "you should"
- Always suggest consulting an attorney for decisions
- Respond in ${language}
- Be concise and clear${contextNote}`;

    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    await streamLLM(
      [{ role: 'user', content: `${systemContext}\n\nUser: ${message}` }],
      (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Chat failed' });
    }
  }
});

// Non-streaming fallback
chatRouter.post('/sync', async (req, res) => {
  try {
    const { message, history = [], documentContext = '', language = 'English' } = req.body;

    const contextNote = documentContext
      ? `\n\nDOCUMENT CONTEXT:\n${documentContext.substring(0, 6000)}`
      : '';

    const fullMessage = `You are AuraX, neutral legal AI. Help understand documents, never advise. Respond in ${language}.${contextNote}\n\nUser: ${message}`;

    const response = await callLLM([{ role: 'user', content: fullMessage }]);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
