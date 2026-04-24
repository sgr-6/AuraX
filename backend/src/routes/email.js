import express from 'express';
import { callLLM } from '../services/llm.js';

export const emailRouter = express.Router();

emailRouter.post('/draft', async (req, res) => {
  try {
    const { analysisContext, clauses = [], language = 'English' } = req.body;

    const prompt = `Based on this legal document analysis, generate 3 professional email templates as JSON.

Analysis Context: ${JSON.stringify(analysisContext || {}).substring(0, 3000)}
Key Clauses: ${clauses.filter(c => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').map(c => c.title).join('; ')}

Return ONLY this JSON:
{
  "emails": [
    {
      "type": "clarification",
      "subject": "<email subject>",
      "body": "<full email body, professional tone, 150-200 words>",
      "purpose": "Request clarification on ambiguous terms"
    },
    {
      "type": "negotiation", 
      "subject": "<email subject>",
      "body": "<full email body>",
      "purpose": "Negotiate or flag risky terms"
    },
    {
      "type": "missing_info",
      "subject": "<email subject>",
      "body": "<full email body>",
      "purpose": "Ask about missing information"
    }
  ]
}

Rules:
- Professional but accessible tone
- Reference specific issues from the analysis
- Never say "I demand" — use "I would like to understand" or "Could you clarify"
- Respond in ${language}
- Return ONLY valid JSON`;

    const raw = await callLLM([{ role: 'user', content: prompt }], 'json');
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate emails' });
  }
});
