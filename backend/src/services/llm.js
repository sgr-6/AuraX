import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Gemini client initialisation
// ---------------------------------------------------------------------------
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please add it to your .env file.');
  }
  return new GoogleGenerativeAI(apiKey);
};

// gemini-2.5-flash-lite — fast, cheap, high rate limits. Override via GEMINI_MODEL env.
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest';

// Max retries and base delay (ms) for exponential backoff
const MAX_RETRIES  = 4;
const BASE_DELAY   = 2000; // 2 s → 4 s → 8 s → 16 s

// Safety settings — keep permissive so legal content isn't blocked
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const GENERATION_CONFIG = {
  temperature:     0.15, 
  topP:            0.85,
  maxOutputTokens: 8192, // Increased to support verbose detailed Dual-Perspective clauses
};

export const SYSTEM_PROMPT = `You are an unbiased contract analysis system. When evaluating clauses, always maintain neutrality and avoid emotional or persuasive wording.

If a contract appears to favor one party, explain it strictly using clause-based reasoning instead of subjective language.

When describing impact:
- Mention both positive and negative effects if they exist.
- Do not use emotionally loaded phrases like "harsh", "burden", "severe", "trapping", or "unfair".
- Instead of judging, describe what the clause does and its practical effect.

For every clause in the document, you must provide a dual-perspective analysis. Clearly identify the clause and its risk level. Then explain how the clause benefits Party A (for example, landlord or provider) and also identify any risks for Party A, even if they are indirect. Similarly, explain how the clause benefits Party B (for example, tenant or user) and identify any risks for Party B.

After this, provide a neutral insight that explains the purpose of the clause in simple language without taking sides. Then include a fairness indicator.

When stating fairness:
- Clearly indicate whether it favors Party A, favors Party B, or is balanced.
- Justify this only using factual observations from the contract terms.
- Ensure the explanation remains neutral and evidence-based.

You will calculate an Overall Risk Score (0-100) reflecting the entire document's risk. This score must be based objectively on:
- The severity of the clauses (LOW, MEDIUM, HIGH, CRITICAL).
- The number of high-risk and critical clauses.
- The weight of financial obligations and penalties.
- The flexibility of terms and overall balance between both parties.

When generating the Risk_Score_Explanation:
- Do not refer to only one party (e.g., tenant or landlord). Avoid one-sided phrasing.
- Ensure the explanation reflects impact on both parties where applicable.
- Briefly justify the score (1-2 lines), mentioning key contributing factors.
- Remain calm, factual, and balanced. Do not exaggerate risk or make assumptions.

Finally, calculate a brief "Overall Fairness Statement" representing the holistic contract balance.

Overall goal: Produce analysis that is factual, balanced, and interpretable without bias toward any party.`;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Strip markdown code fences Gemini sometimes wraps around JSON */
function stripMarkdownCodeFence(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/** Sleep helper */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Detect whether an error is retryable (rate limit / server overload) */
function isRateLimitError(err) {
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('quota')              ||
    msg.includes('429')                ||
    msg.includes('rate limit')         ||
    msg.includes('503')                ||
    msg.includes('overloaded')
  );
}

// ---------------------------------------------------------------------------
// Retry wrapper — exponential backoff for rate-limited calls
// ---------------------------------------------------------------------------
async function withRetry(fn, label = 'Gemini call') {
  let lastErr;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Immediately switch to fallback on the very first retry
    const currentModel = attempt >= 1 ? FALLBACK_MODEL : MODEL_NAME;
    try {
      return await fn(currentModel);
    } catch (err) {
      lastErr = err;

      if (!isRateLimitError(err) || attempt === MAX_RETRIES) {
        // Not retryable, or exhausted all retries — translate and throw
        handleGeminiError(err, currentModel);
      }

      const nextModel = (attempt + 1) >= 1 ? FALLBACK_MODEL : MODEL_NAME;
      
      // If we are switching to the fallback model right now, don't wait — do it fast (200ms + jitter)
      // Otherwise, use standard exponential backoff for the fallback model itself
      const baseWait = attempt === 0 ? 200 : BASE_DELAY * Math.pow(2, attempt - 1);
      const delay = baseWait + Math.floor(Math.random() * 500); 
      
      console.warn(`[AuraX] ${label} — rate limited. Retry ${attempt + 1}/${MAX_RETRIES} in ${(delay / 1000).toFixed(1)}s (Model: ${nextModel})...`);
      await sleep(delay);
    }
  }

  handleGeminiError(lastErr, FALLBACK_MODEL);
}

// ---------------------------------------------------------------------------
// Build Gemini model + chat session from an OpenAI-style messages array
// ---------------------------------------------------------------------------
function buildChat(genAI, messages, generationConfig, modelName = MODEL_NAME) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig,
    safetySettings: SAFETY_SETTINGS,
  });

  // Convert OpenAI-style array → Gemini history + last user message
  const history = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    if (msg.role === 'system') continue;
    const role = msg.role === 'assistant' ? 'model' : msg.role;
    
    const parts = [{ text: msg.content }];
    if (msg.filePart) parts.push(msg.filePart);
    
    history.push({ role, parts });
  }

  const lastUserMessage = messages[messages.length - 1];
  const lastMessageParts = [];
  if (lastUserMessage.filePart) {
    lastMessageParts.push(lastUserMessage.filePart);
  }
  lastMessageParts.push({ text: lastUserMessage.content });
  
  const chat = history.length > 0 ? model.startChat({ history }) : model.startChat();
  return { chat, lastMessage: lastMessageParts };
}

// ---------------------------------------------------------------------------
// callLLM — non-streaming with retry
// responseFormat = 'json' → instructs model to output valid JSON only
// ---------------------------------------------------------------------------
export async function callLLM(messages, responseFormat = null) {
  const genAI = getClient();

  const generationConfig = {
    ...GENERATION_CONFIG,
    ...(responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
  };

  return withRetry(async (currentModel) => {
    const { chat, lastMessage } = buildChat(genAI, messages, generationConfig, currentModel);
    const result = await chat.sendMessage(lastMessage);
    const text   = result.response.text();
    return responseFormat === 'json' ? stripMarkdownCodeFence(text) : text;
  }, 'callLLM');
}

// ---------------------------------------------------------------------------
// streamLLM — streaming with retry
// ---------------------------------------------------------------------------
export async function streamLLM(messages, onChunk) {
  const genAI = getClient();

  const streamConfig = { ...GENERATION_CONFIG, maxOutputTokens: 2000 };

  return withRetry(async (currentModel) => {
    const { chat, lastMessage } = buildChat(genAI, messages, streamConfig, currentModel);
    const result   = await chat.sendMessageStream(lastMessage);
    let fullText   = '';

    for await (const chunk of result.stream) {
      const delta = chunk.text();
      fullText   += delta;
      onChunk(delta);
    }

    return fullText;
  }, 'streamLLM');
}

// ---------------------------------------------------------------------------
// Centralised Gemini error → user-friendly message translator
// ---------------------------------------------------------------------------
function handleGeminiError(err, modelName = MODEL_NAME) {
  const msg = (err.message || '').toLowerCase();

  if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
    throw new Error('Invalid Gemini API key. Check your GEMINI_API_KEY environment variable.');
  }
  if (isRateLimitError(err)) {
    throw new Error('High traffic — AuraX is busy right now. Please try again in a moment.');
  }
  if (msg.includes('safety')) {
    throw new Error('The document content was flagged by Gemini safety filters. Try a different document.');
  }
  if (msg.includes('recitation')) {
    throw new Error('Gemini declined to respond due to content concerns. Please try again.');
  }
  if (msg.includes('not found') || msg.includes('404')) {
    throw new Error(`Gemini model "${modelName}" is unavailable. Check available models or set GEMINI_MODEL in your .env.`);
  }

  // Unknown errors — pass through with original message
  throw err;
}
