import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { readFileSync } from 'fs';

export async function parseDocument(filePath, mimeType, originalName) {
  const ext = originalName.split('.').pop().toLowerCase();

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const buffer = readFileSync(filePath);
      const data = await pdfParse(buffer);
      return {
        text: data.text,
        pages: data.numpages,
        format: 'PDF'
      };
    }

    if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        pages: null,
        format: 'DOCX'
      };
    }

    if (ext === 'txt' || mimeType === 'text/plain') {
      const text = readFileSync(filePath, 'utf-8');
      return {
        text,
        pages: null,
        format: 'TXT'
      };
    }

    throw new Error(`Unsupported file format: ${ext}`);
  } catch (err) {
    throw new Error(`Failed to parse document: ${err.message}`);
  }
}

export function truncateText(text, maxChars = 12000) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n\n[Document truncated for analysis. First 12,000 characters shown.]';
}
