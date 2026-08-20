// Polyfill browser-only DOMMatrix before anything can load pdf-parse/pdfjs —
// pdf.js evaluates `new DOMMatrix()` at module scope in serverless bundles and
// Node has no DOMMatrix global, which otherwise crashes with "DOMMatrix is not
// defined" on Netlify. Must be imported FIRST (side-effect installs the global).
import '../../../utils/dommatrix-polyfill';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '../../../utils/supabase/server';
import {
  CATEGORIES,
  computeWeights,
  clampScore,
  computeOverallScore,
  extractCategoryScores,
  extractExplanations,
  hasJobDescription,
} from './scoring.mjs';

// This route runs only on the Node.js server — GEMINI_API_KEY is read from
// process.env here and is never shipped to the browser.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB — cap is Netlify-safe (Function buffer ~4.5MB binary)
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

function normalizeDocxType(mime) {
  // Some browsers/tools report DOCX as application/octet-stream or zip.
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/octet-stream' ||
    mime === 'application/zip'
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return mime;
}

async function extractText(file) {
  const arrayBuffer = await file.arrayBuffer();
  let buf;
  try {
    buf = Buffer.from(arrayBuffer);
  } catch {
    buf = Buffer.from(new Uint8Array(arrayBuffer));
  }

  const mime = normalizeDocxType(file.type);

  if (mime === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    const result = await parser.getText();
    const text = (result?.text || '').trim();
    if (!text) throw new Error('No readable text found in this PDF (it may be a scanned image).');
    return text;
  }

  // DOCX
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer: buf });
  const text = (result?.value || '').trim();
  if (!text) throw new Error('No readable text found in this DOCX file.');
  return text;
}

// Structured JSON contract we ask Gemini to return. Gemini scores EACH weighted
// category individually (0-100) and explains it. The API computes the overall
// score from those category scores using fixed weights — Gemini never decides the
// final number, so the result is consistent every time.
const responseSchema = {
  type: 'OBJECT',
  properties: {
    categoryScores: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          name: { type: 'STRING' },
          score: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
        },
        required: ['id', 'name', 'score'],
      },
    },
    atsMatch: { type: 'INTEGER' },
    verdict: { type: 'STRING' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
    matchedKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
    missingKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
    rewrites: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          original: { type: 'STRING' },
          suggestion: { type: 'STRING' },
        },
        required: ['original', 'suggestion'],
      },
    },
  },
  required: [
    'categoryScores',
    'atsMatch',
    'verdict',
    'strengths',
    'weaknesses',
    'matchedKeywords',
    'missingKeywords',
    'rewrites',
  ],
};
function buildPrompt(resumeText, jobDescription) {
  const trimmed = (jobDescription || '').trim();
  return [
    'You are a senior technical recruiter and ATS expert. Analyze the resume below and ',
    'return structured, honest feedback. Score the resume 0-100 overall.',
    '',
    trimmed
      ? `JOB DESCRIPTION (use it to judge keyword match and relevance):\n"""\n${trimmed}\n"""\n`
      : '(No job description was provided — evaluate keyword match on the resume alone.)\n',
    'RESUME TEXT:\n"""\n' + resumeText + '\n"""\n',
    '',
    'Return JSON with these fields:',
    '- categoryScores: array of 7 objects {id,name,score 0-100,explanation}, one per category: Ats & Keyword Match, Skills Relevance, Experience Relevance, Resume Structure & Formatting, Impact & Achievement Quality, Education & Certifications, Projects',
    '- atsMatch: integer 0-100 scoring how well the resume matches ATS keyword filters (vs the job description if provided)',
    '- verdict: one short phrase (e.g. "STRONG — with edits", "NEEDS WORK")',
    '- strengths: array of 3-5 short strings (what works well)',
    '- weaknesses: array of 3-5 short strings (what to improve)',
    '- matchedKeywords: keywords from the job description (or common for the role) that appear in the resume',
    '- missingKeywords: important keywords the resume is missing (empty if no job description)',
    '- NOTE: overallScore and sectionScores are computed server-side from categoryScores — do not return them',
    '- rewrites: array of 2-5 {original, suggestion} pairs rewriting weak bullet points into strong, quantified ones',
  ].join('\n');
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API key is not configured on the server.' },
        { status: 500 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: 'Could not read the upload.' }, { status: 400 });
    }

    const file = formData.get('file');
    const jobDescription = (formData.get('jobDescription') || '').toString();

    // --- Validation ---
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Please attach a resume file.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ error: 'File is over 4MB. Please upload a smaller resume.' }, { status: 413 });
    }
    const mime = normalizeDocxType(file.type);
    if (!ALLOWED_TYPES.has(mime)) {
      return Response.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX resume.' },
        { status: 415 }
      );
    }

    // --- Text extraction ---
    let resumeText;
    try {
      resumeText = await extractText(file);
    } catch (err) {
      console.error('Text extraction failed:', err);
      return Response.json(
        { error: err.message || 'Failed to read the resume file.' },
        { status: 422 }
      );
    }

    // --- Gemini call ---
    let data;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildPrompt(resumeText, jobDescription),
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const raw = response?.text;
      if (!raw) {
        const reason = response?.promptFeedback?.blockReason;
        return Response.json(
          { error: reason ? `Request was blocked (${reason}).` : 'Gemini returned no result.' },
          { status: 502 }
        );
      }
      data = JSON.parse(raw);
    } catch (err) {
      console.error('Gemini analysis failed:', err);
      return Response.json(
        { error: err?.message || 'AI analysis failed. Please try again.' },
        { status: 502 }
      );
    }

    // --- Basic shape validation of the model output ---
    if (!Array.isArray(data.categoryScores) || !Array.isArray(data.rewrites)) {
      return Response.json(
        { error: 'The AI returned an unexpected response. Please try again.' },
        { status: 502 }
      );
    }

    // The weighted overall score is computed HERE from per-category scores so
    // Gemini never decides the final number — consistent and auditable.
    const hasJD = hasJobDescription(jobDescription);
    const weights = computeWeights(hasJD);
    const categoryValues = extractCategoryScores(data.categoryScores);
    const overallScore = computeOverallScore(categoryValues, weights);
    const explanations = extractExplanations(data.categoryScores);

    const atsClamped = Math.max(
      0,
      Math.min(100, Math.round(Number(data.atsMatch) || 0))
    );
    const result = {
      overallScore,
      atsMatch: atsClamped,
      verdict: data.verdict || 'REVIEWED',
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
      matchedKeywords: Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [],
      missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords : [],
      sectionScores: CATEGORIES.map((c, i) => ({
        id: c.id,
        name: c.name,
        score: categoryValues[i],
        weight: Number(weights[i].toFixed(3)),
        explanation: explanations[c.id] || '',
      })),
      rewrites: data.rewrites.map((r) => ({
        original: String(r.original || ''),
        suggestion: String(r.suggestion || ''),
      })),
    };

    // --- Persist to Supabase (best-effort) ---
    // Saves the analysis to the `analyses` table. Failures are logged but NEVER
    // break the response — the user still gets their results either way.
    try {
      const { error: dbError } = await createClient()
        .from('analyses')
        .insert({
          resume_name: file?.name || 'Untitled resume',
          job_description: jobDescription,
          overall_score: overallScore,
          category_scores: result.sectionScores,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          matched_keywords: result.matchedKeywords,
          missing_keywords: result.missingKeywords,
          bullet_suggestions: result.rewrites,
        });

      if (dbError) {
        console.error('Supabase insert failed:', dbError);
      } else {
        console.log('Analysis saved to Supabase for:', file?.name || 'Untitled resume');
      }
    } catch (err) {
      console.error('Supabase save threw:', err);
    }

    return Response.json(result);
  } catch (err) {
    console.error('/api/analyze unexpected error:', err);
    return Response.json(
      { error: 'Unexpected server error. Please try again.' },
      { status: 500 }
    );
  }
}

