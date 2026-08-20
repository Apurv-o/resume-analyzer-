// Pure, deterministic scoring logic for the Resume AI Analyzer.
// The overall score is ALWAYS computed here from weighted category scores (0-100).
// Gemini only provides per-category scores; it never decides the final number, so
// the result is consistent and auditable.

// The seven scoring categories and their default weights (used with a job
// description). Weights always sum to 1.0.
export const CATEGORIES = [
  { id: 'atsKeywordMatch', name: 'ATS & Keyword Match', weight: 0.25 },
  { id: 'skillsRelevance', name: 'Skills Relevance', weight: 0.2 },
  { id: 'experienceRelevance', name: 'Experience Relevance', weight: 0.2 },
  { id: 'structureFormatting', name: 'Resume Structure & Formatting', weight: 0.15 },
  { id: 'impactAchievements', name: 'Impact & Achievement Quality', weight: 0.1 },
  { id: 'educationCertifications', name: 'Education & Certifications', weight: 0.05 },
  { id: 'projects', name: 'Projects', weight: 0.05 },
];

// When a job description is provided we use the full ATS weight. With no job
// description the ATS weight is REDUCED so the user is not penalised for missing
// job-specific keywords, and the freed weight is redistributed proportionally
// across the other six categories, keeping the total at 100%.
export const DEFAULT_ATS_WEIGHT = 0.25;
export const NO_JD_ATS_WEIGHT = 0.1;

const TOTAL_WEIGHT = CATEGORIES.reduce((sum, c) => sum + c.weight, 0); // 1.0

export function hasJobDescription(jobDescription) {
  return Boolean(jobDescription && String(jobDescription).trim().length > 0);
}

// Returns the effective weight (0-1) for each category. The array index matches
// the index of CATEGORIES.
export function computeWeights(hasJD) {
  if (hasJD) return CATEGORIES.map((c) => c.weight);

  const othersTotal = TOTAL_WEIGHT - DEFAULT_ATS_WEIGHT; // 0.75
  const scale = (1 - NO_JD_ATS_WEIGHT) / othersTotal; // redistributes proportionally
  return CATEGORIES.map((c) =>
    c.id === 'atsKeywordMatch' ? NO_JD_ATS_WEIGHT : c.weight * scale
  );
}

// Clamp any value to an integer in [0, 100].
export function clampScore(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Weighted average -> rounded overall score in [0, 100]. This is THE function that
// turns per-category scores into the final score.
export function computeOverallScore(categoryScores, weights) {
  if (!Array.isArray(categoryScores) || !Array.isArray(weights)) return 0;
  let total = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    total += (Number(categoryScores[i]) || 0) * (Number(weights[i]) || 0);
  }
  return clampScore(total);
}

// Turn Gemini's categoryScores array into an array aligned 1:1 with CATEGORIES.
// Matches by canonical id or by category name; any missing category falls back to
// the average of the provided scores (so all 7 always produce a valid number).
export function extractCategoryScores(rawCategories) {
  const list = Array.isArray(rawCategories) ? rawCategories : [];
  const found = {};
  for (const c of list) {
    const idMatch = CATEGORIES.some((k) => k.id === c?.id);
    const key = idMatch
      ? String(c.id)
      : CATEGORIES.find((k) => k.name === String(c?.name || '').trim())?.id;
    if (!key) continue;
    found[key] = clampScore(c?.score);
  }
  const supplied = Object.values(found);
  const fallback = supplied.length
    ? Math.round(supplied.reduce((a, b) => a + b, 0) / supplied.length)
    : 50;
  return CATEGORIES.map((c) => found[c.id] ?? clampScore(fallback));
}

// Extract per-category explanations keyed by canonical id (empty string if absent).
export function extractExplanations(rawCategories) {
  const list = Array.isArray(rawCategories) ? rawCategories : [];
  const out = {};
  for (const c of list) {
    const idMatch = CATEGORIES.some((k) => k.id === c?.id);
    const key = idMatch
      ? String(c.id)
      : CATEGORIES.find((k) => k.name === String(c?.name || '').trim())?.id;
    if (key) out[key] = String(c?.explanation || '');
  }
  return out;
}