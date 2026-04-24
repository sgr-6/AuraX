# ⚡ AuraX — Unbiased Legal AI Decision Support System

> Understand contracts without the jargon. Stay neutral. Decide confidently.

AuraX is a production-grade AI legal analysis web app. It analyzes legal documents with 100% neutrality — showing benefits and concerns for both parties, flagging risks, and simplifying legalese into plain English.

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/aurax.git
cd aurax

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your API key (OpenAI or Groq)
```

**Choose one LLM provider:**
- **OpenAI** (best quality): Get key at https://platform.openai.com
- **Groq** (free tier, fast): Get key at https://console.groq.com

```env
# backend/.env
OPENAI_API_KEY=sk-your-key-here
# OR
GROQ_API_KEY=gsk_your-key-here
```

### 3. Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → Running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → Running on http://localhost:5173
```

Open http://localhost:5173 and upload any legal document!

---

## 📁 Project Structure

```
aurax/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/
│   │   │   ├── analyze.js        # Document analysis (file + text)
│   │   │   ├── chat.js           # Contextual Q&A (streaming SSE)
│   │   │   └── email.js          # AI email template generator
│   │   └── services/
│   │       ├── llm.js            # OpenAI / Groq adapter
│   │       └── parser.js         # PDF / DOCX / TXT parsing
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx   # Animated upload page
    │   │   └── Dashboard.jsx     # Split-panel analysis view
    │   ├── components/
    │   │   ├── DocumentPanel.jsx  # Document viewer w/ highlights
    │   │   ├── AnalysisCards.jsx  # 7 glassmorphism analysis cards
    │   │   ├── RiskScoreCard.jsx  # Animated circular gauge
    │   │   ├── ChatPanel.jsx      # Contextual document chat
    │   │   ├── EmailDrafter.jsx   # 3 AI email templates
    │   │   └── VoicePlayer.jsx    # TTS with waveform
    │   ├── store/useStore.js      # Zustand global state
    │   └── utils/api.js           # API client
    └── package.json
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 Document Upload | PDF, DOCX, TXT — drag & drop or paste text |
| ⚠️ Risk Scoring | Animated 0–100 gauge with confidence % |
| ⚖️ Balanced View | Side-by-side Party A benefits vs Party B concerns |
| 🚨 Risk Flags | CRITICAL / HIGH / MEDIUM / LOW severity |
| 🔴 Clause Highlights | Risky sentences highlighted red in document |
| 💬 Contextual Chat | Ask questions about your specific document |
| ✉️ Email Drafter | 3 AI email templates (clarify, negotiate, request info) |
| 🎙️ Voice Playback | TTS summary with speed controls & waveform |
| 🌐 6 Languages | English, Hindi, Kannada, Tamil, Telugu, Malayalam |
| 📱 Responsive | Mobile-first, works on all screen sizes |

---

## 🔒 Legal Disclaimer

AuraX provides AI-generated analysis for understanding purposes only. **This is NOT legal advice.** Always consult a qualified attorney before making any legal decisions.

---

## 🚢 Deployment

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Deploy /dist to Vercel
```

### Railway / Render (Backend)
Set environment variables: `OPENAI_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, TailwindCSS, Framer Motion, Zustand, Axios  
**Backend:** Node.js, Express, Multer, pdf-parse, Mammoth  
**AI:** OpenAI GPT-4o or Groq (Llama 3.3)  
**Fonts:** Syne (display), DM Sans (body), JetBrains Mono (code)
