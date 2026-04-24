import axios from 'axios';

const API_BASE = 'https://aurax-8g61.onrender.com';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000 // 2 min for LLM
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export async function analyzeDocument(file, language = 'English') {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('language', language);

  const res = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function analyzeText(text, language = 'English') {
  const res = await api.post('/analyze/text', { text, language });
  return res.data;
}

export async function sendChatMessage(message, history, documentContext, language) {
  const res = await api.post('/chat/sync', { message, history, documentContext, language });
  return res.data.response;
}

export async function generateEmailDrafts(analysisContext, risks, language) {
  const res = await api.post('/email/draft', { analysisContext, risks, language });
  return res.data;
}

export default api;
