# HireLens — AI Resume Analyzer

Upload a PDF or DOCX resume (optionally with a job description) and get a
structured AI analysis: an overall score, section scores, strengths,
weaknesses, matched/missing keywords, and bullet-point rewrites — all via a
server-side Gemini (Flash) call.

## Run it locally

```bash
cd resume-analyzer
npm install
# add your key (never commit it):
# echo "GEMINI_API_KEY=YOUR_KEY" > .env.local
npm run dev
```

Then open http://localhost:3000.

## How it works

- `app/api/analyze/route.js` — server-only POST route. It validates the
  upload (PDF/DOCX, ≤4MB), extracts text with `pdf-parse`/`mammoth`, and sends
  it (plus the optional job description) to Gemini Flash requesting structured
  JSON via `responseSchema`.
- `app/page.js` — the client upload UI posts a multipart `FormData` to
  `/api/analyze` and renders the returned JSON.
- The Gemini key lives in `.env.local` (git-ignored) and is read only in the
  Node.js server — never exposed to the client. The model can be overridden
  with `GEMINI_MODEL` (default `gemini-3.6-flash`).

## Stack

- Next.js 14 (App Router) + Tailwind CSS
- `pdf-parse` (PDF text extraction) + `mammoth` (DOCX text extraction)
- `@google/genai` (Gemini Flash) — called only from the server route
- Fonts: Fraunces (display), Inter (body), IBM Plex Mono (data/score)
- Design direction: an editor's desk — a document mockup marked up in
  red pen, with a rubber-stamp score badge

