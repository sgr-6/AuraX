import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { parseDocument, truncateText } from '../services/parser.js';
import { callLLM } from '../services/llm.js';
import { unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

export const analyzeRouter = express.Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are supported'));
    }
  }
});

// Max chars sent to Gemini per request — keeps token count low and avoids rate limits
const MAX_DOC_CHARS = 7000;

const ANALYSIS_PROMPT = (docText, language = 'English') => `Analyze the legal document below. Return ONLY valid JSON (no markdown) in this exact structure:
{
  "summary": "Simple explanation in plain English",
  "riskScore": 0, // 0-100 score calculated based on severity, frequency of high/critical limits, penalties, and balance.
  "risk_score_explanation": "<1-2 sentences neutrally explaining why this score was assigned considering both parties>",
  "overall_fairness_statement": "Fairness: Balanced | Fairness: Slightly favors one party",
  "confidence": 0, // Number between 0 and 100
  "clauses": [ // IMPORTANT: Extract max 5-7 of the most significant clauses. Keep explanations extremely concise (1 short sentence).
    {
      "title": "<Clause Name>",
      "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
      "clause_text": "<Exact sentence from document>",
      "analysis": {
        "party_a_benefit": "...",
        "party_a_risk": "...",
        "party_b_benefit": "...",
        "party_b_risk": "...",
        "neutral_insight": "...",
        "fairness_indicator": "favors Party A | favors Party B | balanced"
      }
    }
  ],
  "balanced_view": "<Summary describing the overall fairness of the document>",
  "suggestions": [
    "<Neutral consideration, not instruction>"
  ],
  "missingContext": [
    "<Missing or unclear information>"
  ],
  "riskySentences": [
    { "text": "<Exact quote>", "explanation": "<Why it matters neutrally>" }
  ],
  "disclaimer": "This is AI-generated guidance, not legal advice."
}
Rules: 100% neutral, dual-perspective (MANDATORY), calm phrasing. KEEP TEXT EXTREMELY CONCISE (1 short sentence max per field) to prevent hitting max token truncation limits. Respond in ${language}.
DOCUMENT:
${docText}`;

analyzeRouter.post('/', upload.single('document'), async (req, res) => {
  let filePath = null;

  try {
    const language = req.body.language || 'English';

    // Handle both file upload and raw text
    let docText = '';
    let docMeta = { format: 'TEXT', pages: null };

    if (req.file) {
      filePath = req.file.path;

      let filePart = null;
      if (req.file.mimetype === 'application/pdf') {
        const buffer = await readFile(filePath);
        filePart = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'application/pdf'
          }
        };
      }

      try {
        const parsed = await parseDocument(filePath, req.file.mimetype, req.file.originalname);
        docText = parsed.text;
        docMeta = { format: parsed.format, pages: parsed.pages, name: req.file.originalname, nativePart: filePart };
      } catch (err) {
        console.warn(`[AuraX] Could not extract text for UI preview: ${err.message}`);
        docText = "[Text preview unavailable due to document formatting. Analyzed natively by AI engine.]";
        docMeta = { format: 'PDF', pages: null, name: req.file.originalname, nativePart: filePart };
      }
    } else if (req.body.text) {
      docText = req.body.text;
      docMeta = { format: 'TEXT', pages: null, name: 'Pasted Document' };
    } else {
      return res.status(400).json({ error: 'No document provided. Upload a file or paste text.' });
    }

    if (docText.trim().length < 50) {
      return res.status(400).json({ error: 'Document is too short to analyze meaningfully.' });
    }

    const truncated = truncateText(docText, MAX_DOC_CHARS);
    const messages = [{ role: 'user', content: '' }];
    
    // Process PDF natively via inlineData to bypass token extraction limits and parsing errors
    if (docMeta.nativePart) {
      messages[0].filePart = docMeta.nativePart;
      messages[0].content = ANALYSIS_PROMPT("[Document sent natively via PDF attachment]", language);
    } else {
      messages[0].content = ANALYSIS_PROMPT(truncateText(docText, MAX_DOC_CHARS), language);
    }

    const rawResponse = await callLLM(messages, 'json');
    delete docMeta.nativePart; // remove from frontend payload

    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('[AuraX] JSON parsing failed on matched block. Raw response length:', rawResponse.length);
          console.error('[AuraX] Raw response:', rawResponse);
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        console.error('[AuraX] No JSON block found. Raw response:', rawResponse);
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    res.json({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      document: docMeta,
      analysis,
      rawText: truncated
    });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  } finally {
    if (filePath) {
      try { await unlink(filePath); } catch {}
    }
  }
});

// Text-only analysis (no file upload)
analyzeRouter.post('/text', async (req, res) => {
  try {
    const { text, language = 'English' } = req.body;
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide document text (minimum 50 characters).' });
    }

    const truncated = truncateText(text, MAX_DOC_CHARS);
    const rawResponse = await callLLM([
      { role: 'user', content: ANALYSIS_PROMPT(truncated, language) }
    ], 'json');

    let analysis = JSON.parse(rawResponse);

    res.json({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      document: { format: 'TEXT', name: 'Pasted Document' },
      analysis,
      rawText: truncated
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Analysis failed.' });
  }
});
