// Unit tests for the weighted scoring logic in scoring.mjs.
// Run with: npm run test:scoring  (or: node app/api/analyze/scoring.test.mjs)
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  computeWeights,
  computeOverallScore,
  clampScore,
  extractCategoryScores,
  extractExplanations,
  NO_JD_ATS_WEIGHT,
  DEFAULT_ATS_WEIGHT,
} from './scoring.mjs';

const within = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// --- Weights ---
{
  const withJD = computeWeights(true);
  assert.equal(withJD[0], DEFAULT_ATS_WEIGHT, 'JD: ATS weight is 0.25');
  assert.ok(within(sum(withJD), 1), 'JD weights sum to 1');
  assert.deepEqual(withJD, CATEGORIES.map((c) => c.weight), 'JD uses default weights');

  const noJD = computeWeights(false);
  assert.equal(noJD[0], NO_JD_ATS_WEIGHT, 'no-JD: ATS weight is reduced to 0.1');
  assert.ok(within(sum(noJD), 1), 'no-JD weights still sum to 1');
  // Freed ATS weight is redistributed, so every other category grows.
  for (let i = 1; i < CATEGORIES.length; i++) assert.ok(noJD[i] > withJD[i]);
  console.log('JD weights:      ', withJD.map((w) => +w.toFixed(3)));
  console.log('no-JD weights:   ', noJD.map((w) => +w.toFixed(3)));
}

// --- Basic edge cases ---
assert.equal(computeOverallScore(CATEGORIES.map(() => 100), computeWeights(true)), 100, 'all 100 -> 100');
assert.equal(computeOverallScore(CATEGORIES.map(() => 0), computeWeights(true)), 0, 'all 0 -> 0');

// --- Hand-checked example with a job description ---
{
  const scores = [90, 70, 80, 60, 50, 75, 65];
  const w = computeWeights(true);
  const raw = scores.reduce((s, v, i) => s + v * w[i], 0);
  const expected = Math.round(raw);
  assert.equal(computeOverallScore(scores, w), expected);
  console.log(`JD  example: scores=[${scores.join(',')}] raw=${raw.toFixed(3)} -> ${expected}`);
}

// --- Weighted example equals manual per-line computation (with JD) ---
{
  const scores = [85, 92, 78, 88, 64, 90, 70];
  const w = computeWeights(true);
  const manual = Math.round(
    85 * w[0] + 92 * w[1] + 78 * w[2] + 88 * w[3] + 64 * w[4] + 90 * w[5] + 70 * w[6]
  );
  assert.equal(computeOverallScore(scores, w), manual);
  console.log(`Weighted check (with JD) -> ${manual}`);
}

// --- A low ATS score is penalised less when there is no job description ---
{
  const scores = [30, 70, 80, 60, 50, 75, 65]; // weak ATS only
  const withJD = computeOverallScore(scores, computeWeights(true));
  const noJD = computeOverallScore(scores, computeWeights(false));
  assert.ok(noJD > withJD, 'reduced ATS weight must soften the penalty when ATS is weak');
  console.log(`ATS=30 -> with JD ${withJD}, no JD ${noJD} (no-JD higher: ${noJD > withJD})`);
}

// --- A high ATS score carries *less* weight when there is no job description ---
{
  const scores = [98, 70, 80, 60, 50, 75, 65]; // excellent ATS
  const withJD = computeOverallScore(scores, computeWeights(true));
  const noJD = computeOverallScore(scores, computeWeights(false));
  assert.ok(noJD < withJD, 'reduced ATS weight also caps an oversized ATS contribution');
  console.log(`ATS=98 -> with JD ${withJD}, no JD ${noJD} (no-JD lower: ${noJD < withJD})`);
}

// --- Extraction with a missing category falls back to the average ---
{
  const raw = CATEGORIES.slice(0, 6).map((c, i) => ({
    id: c.id,
    name: c.name,
    score: 50 + i * 5,
  }));
  const scores = extractCategoryScores(raw);
  assert.equal(scores.length, CATEGORIES.length, 'always returns all 7 categories');
  assert.equal(scores[0], 50, 'first provided category matched');
  const avg = clampScore(Math.round(sum([50, 55, 60, 65, 70, 75]) / 6)); // 63
  assert.equal(scores[6], avg, 'missing category uses the average of the provided scores');
}

// --- Extraction matches by id or by name, and captures explanations ---
{
  const raw = [
    { id: 'atsKeywordMatch', name: 'ATS & Keyword Match', score: 77, explanation: 'Good headings.' },
    { name: 'Projects', score: 60, explanation: 'Great repos.' }, // no id, matched by name
  ];
  const scores = extractCategoryScores(raw);
  assert.equal(scores[0], 77);
  assert.equal(scores[6], 60);
  const expl = extractExplanations(raw);
  assert.equal(expl['atsKeywordMatch'], 'Good headings.');
  assert.equal(expl['projects'], 'Great repos.');
}

// --- Clamping ---
assert.equal(clampScore(150), 100);
assert.equal(clampScore(-5), 0);
assert.equal(clampScore(83.6), 84);
assert.equal(clampScore('88.2'), 88);
assert.equal(clampScore('oops'), 0);

console.log('\nAll scoring tests passed ✔');