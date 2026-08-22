'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────
   Animated background orbs (smooth cursor-following + ambient)
───────────────────────────────────────────────────────────── */
function BackgroundOrbs() {
  const orbRef = useRef(null);

  useEffect(() => {
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    const current = { ...target };
    let raf;

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const tick = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Static ambient orbs */}
      <div
        className="orb"
        style={{
          width: '600px', height: '600px',
          top: '-200px', left: '-100px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          animationDuration: '14s',
        }}
      />
      <div
        className="orb"
        style={{
          width: '500px', height: '500px',
          top: '40%', right: '-150px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)',
          animationDuration: '18s', animationDelay: '-6s',
        }}
      />
      <div
        className="orb"
        style={{
          width: '400px', height: '400px',
          bottom: '5%', left: '20%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          animationDuration: '22s', animationDelay: '-10s',
        }}
      />
      {/* Cursor-following glow */}
      <div
        ref={orbRef}
        style={{
          position: 'absolute',
          width: '500px', height: '500px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
          filter: 'blur(40px)',
          willChange: 'transform',
          pointerEvents: 'none',
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Count-up animation hook
───────────────────────────────────────────────────────────── */
function useCountUp(target, active) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    let raf;
    const start = performance.now();
    const duration = 1100;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return value;
}

function useVisible(status, match) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (status !== match) { setVisible(false); return; }
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [status, match]);
  return visible;
}

/* ─────────────────────────────────────────────────────────────
   SVG Score Ring
───────────────────────────────────────────────────────────── */
function ScoreRing({ score, visible, size = 120, color }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = visible ? circ - (score / 100) * circ : circ;
  const gradient = score >= 80
    ? ['#34d399', '#059669']
    : score >= 60
    ? ['#fbbf24', '#f59e0b']
    : ['#f87171', '#ef4444'];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={r} />
      <circle
        className="score-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ring-grad)"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Progress bar with glow
───────────────────────────────────────────────────────────── */
function ProgressBar({ value, visible, gradient = 'from-indigo-500 to-violet-500' }) {
  const getGlowColor = () => {
    if (gradient.includes('emerald') || gradient.includes('green')) return 'rgba(16,185,129,0.6)';
    if (gradient.includes('amber') || gradient.includes('yellow')) return 'rgba(245,158,11,0.6)';
    if (gradient.includes('rose') || gradient.includes('red')) return 'rgba(239,68,68,0.6)';
    return 'rgba(99,102,241,0.6)';
  };

  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-[1100ms] ease-out`}
        style={{
          width: `${visible ? value : 0}%`,
          boxShadow: `0 0 10px ${getGlowColor()}`,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Analyzing step messages
───────────────────────────────────────────────────────────── */
const ANALYZING_MESSAGES = [
  { icon: '📄', text: 'Reading your resume…' },
  { icon: '🔍', text: 'Checking ATS keyword match…' },
  { icon: '📊', text: 'Scoring structure & impact…' },
  { icon: '✨', text: 'Generating rewrite suggestions…' },
  { icon: '🎯', text: 'Almost done…' },
];

/* ─────────────────────────────────────────────────────────────
   Section score bar color
───────────────────────────────────────────────────────────── */
function getSectionGradient(score) {
  if (score >= 80) return 'from-emerald-500 to-teal-400';
  if (score >= 60) return 'from-amber-400 to-orange-400';
  return 'from-rose-500 to-pink-500';
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */
export default function Home() {
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const inputRef = useRef(null);

  /* Site-load screen */
  useEffect(() => {
    const t = setTimeout(() => setLoadingInitial(false), 900);
    return () => clearTimeout(t);
  }, []);

  /* File handling */
  function handleFiles(fileList) {
    const picked = fileList?.[0];
    if (!picked) return;
    setFile(picked);
    setResult(null);
    setError(null);
    setStatus('idle');
  }

  /* Analyze */
  async function handleAnalyze() {
    if (!file || status === 'analyzing') return;
    setStatus('analyzing');
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Analysis failed. Please try again.');
      setResult(data);
      setStatus('result');
    } catch (err) {
      setError(err?.message || 'Something went wrong while analyzing your resume.');
      setStatus('error');
    }
  }

  /* Reset */
  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setJobDescription('');
    setStatus('idle');
  }

  /* Download */
  function handleDownloadReport() {
    if (!result) return;
    const content = [
      'HIRELENS AI RESUME REVIEW REPORT',
      '=================================',
      `File: ${file?.name || 'Resume'}`,
      `Verdict: ${result.verdict} (${result.overallScore}/100)`,
      `ATS Keyword Match: ${result.atsMatch}%`,
      '',
      'CATEGORY SCORES:',
      ...(result.sectionScores || []).map((s) => `• ${s.name}: ${s.score}/100 (Weight: ${(s.weight * 100).toFixed(0)}%)`),
      '',
      'STRENGTHS:',
      ...(result.strengths || []).map((s) => `+ ${s}`),
      '',
      'WEAKNESSES:',
      ...(result.weaknesses || []).map((w) => `- ${w}`),
      '',
      'FLAGGED RESUME LINES & SUGGESTED REWRITES:',
      ...(result.rewrites || []).map((r, i) => `[${i + 1}] ORIGINAL:\n    "${r.original}"\n    SUGGESTION:\n    "${r.suggestion}"\n`),
      'MATCHED KEYWORDS:',
      (result.matchedKeywords || []).join(', ') || 'None',
      '',
      'MISSING KEYWORDS:',
      (result.missingKeywords || []).join(', ') || 'None',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(file?.name || 'resume').replace(/\.[^/.]+$/, '')}-hirelens-review.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Cycle analyzing messages */
  useEffect(() => {
    if (status !== 'analyzing') { setAnalyzingStep(0); return; }
    setAnalyzingStep(0);
    const id = setInterval(() => setAnalyzingStep((s) => s + 1), 1500);
    return () => clearInterval(id);
  }, [status]);

  const demoShown = useVisible(status, 'result');
  const score = useCountUp(result?.overallScore ?? 0, demoShown);
  const atsScore = useCountUp(result?.atsMatch ?? 0, demoShown);

  const stepMsg = ANALYZING_MESSAGES[analyzingStep % ANALYZING_MESSAGES.length];

  /* Verdict badge style */
  const getVerdictStyle = (s) => {
    if (s >= 80) return { label: 'Excellent', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' };
    if (s >= 60) return { label: 'Solid', cls: 'bg-amber-500/10 border-amber-500/30 text-amber-400' };
    return { label: 'Needs Work', cls: 'bg-rose-500/10 border-rose-500/30 text-rose-400' };
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden">

      {/* ── Loading Screen ─────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${
          loadingInitial ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: '#080c14' }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                }}
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div
                className="absolute inset-0 rounded-xl animate-ping"
                style={{ background: 'rgba(99,102,241,0.3)' }}
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-body">
              Hire<span className="text-gradient">Lens</span>
            </span>
          </div>
          {/* Loading bar */}
          <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease infinite, gradient-x 2s ease infinite',
              }}
            />
          </div>
          <p className="text-xs tracking-widest font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
            INITIALIZING AI ENGINE…
          </p>
        </div>
      </div>

      {/* ── Ambient Background ─────────────────────────── */}
      <BackgroundOrbs />

      {/* ── Nav ────────────────────────────────────────── */}
      <nav className="anim-up relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
          >
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white font-body tracking-tight">
            Hire<span className="text-gradient">Lens</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-1 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-widest"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>FREE · NO SIGNUP</span>
          </div>
          <a
            href="#upload"
            className="group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
            }}
          >
            Analyze Resume
            <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">

          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div
              className="anim-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                animationDelay: '0.05s',
              }}
            >
              <span className="text-xs">✨</span>
              <span className="font-mono text-[11px] tracking-widest" style={{ color: '#a5b4fc' }}>
                AI-POWERED RESUME INTELLIGENCE
              </span>
            </div>

            <h1
              className="anim-up font-body text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl xl:text-7xl"
              style={{ animationDelay: '0.12s' }}
            >
              Your resume,{' '}
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #f0abfc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                brutally reviewed.
              </span>
            </h1>

            <p
              className="anim-up mt-6 max-w-lg text-lg leading-relaxed font-body"
              style={{ color: 'rgba(255,255,255,0.55)', animationDelay: '0.22s' }}
            >
              Upload your resume and get back exactly what an ATS reads, which lines fall flat,
              keyword gaps, and precise rewrites — not vague &quot;looks good.&quot;
            </p>

            {/* Feature pills */}
            <div
              className="anim-up mt-8 flex flex-wrap gap-2"
              style={{ animationDelay: '0.3s' }}
            >
              {[
                { icon: '🎯', label: 'ATS Score' },
                { icon: '✍️', label: 'Line rewrites' },
                { icon: '🔑', label: 'Keyword gaps' },
                { icon: '📊', label: 'Section scores' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium font-body"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            </div>

            <div
              className="anim-up mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: '0.38s' }}
            >
              <a
                href="#upload"
                className="group relative inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-sm font-semibold text-white transition-all duration-300 font-body hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 40px rgba(99,102,241,0.5), 0 0 0 1px rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.3)'; }}
              >
                Analyze my resume
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Free · 30 seconds · No signup
              </span>
            </div>
          </div>

          {/* Right: Document mockup */}
          <div className="anim-pop relative mx-auto w-full max-w-sm" style={{ animationDelay: '0.2s' }}>
            {/* Glow behind card */}
            <div
              className="absolute -inset-8 rounded-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.4), transparent 70%)',
                filter: 'blur(30px)',
              }}
            />

            {/* Document card */}
            <div
              className="relative rotate-1 rounded-2xl p-6 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              {/* Header lines */}
              <div className="h-3 w-28 rounded-md mb-1.5" style={{ background: '#1a1a2e' }} />
              <div className="h-2 w-20 rounded-md" style={{ background: 'rgba(0,0,0,0.15)' }} />

              {/* Body lines with highlights */}
              <div className="mt-5 space-y-2.5">
                {[100, 83, 66, 90, 75].map((w, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full"
                    style={{
                      width: `${w}%`,
                      background: i === 2
                        ? 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
                        : 'rgba(0,0,0,0.1)',
                      borderBottom: i === 2 ? '2px solid rgba(239,68,68,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Section 2 */}
              <div className="mt-5 space-y-2">
                {[100, 60].map((w, i) => (
                  <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: 'rgba(0,0,0,0.08)' }} />
                ))}
              </div>

              {/* AI annotation bubble */}
              <div
                className="anim-float absolute -right-10 top-20 hidden w-40 sm:block"
                style={{ animationDuration: '5s' }}
              >
                <div
                  className="rounded-xl p-3 text-xs font-body shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    transform: 'rotate(-3deg)',
                    boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
                  }}
                >
                  <div className="font-semibold mb-0.5">💡 AI Suggestion</div>
                  <div className="text-[10px] opacity-80">Add a metric here — quantify your impact</div>
                </div>
              </div>
            </div>

            {/* Score badge */}
            <div
              className="anim-pop absolute -bottom-5 -left-5 flex flex-col items-center justify-center rounded-2xl p-3 font-body"
              style={{
                animationDelay: '0.45s',
                background: 'linear-gradient(135deg, #080c14, #111827)',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2)',
                minWidth: '80px',
              }}
            >
              <div className="text-3xl font-extrabold" style={{ color: '#818cf8' }}>78</div>
              <div className="text-[9px] font-mono tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>/ 100</div>
              <div className="text-[8px] font-mono tracking-wider mt-1" style={{ color: '#34d399' }}>SCORE</div>
            </div>

            {/* ATS badge */}
            <div
              className="anim-pop absolute -top-4 -right-4 rounded-xl px-3 py-2 font-body"
              style={{
                animationDelay: '0.55s',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div className="text-[10px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>ATS MATCH</div>
              <div className="text-lg font-extrabold" style={{ color: '#34d399' }}>92%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 sm:px-10">
        <div
          className="rounded-3xl p-8 sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: '#818cf8' }}>
                HOW IT WORKS
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-body">
                From rough draft to{' '}
                <span className="text-gradient">interview-ready</span>{' '}
                in seconds
              </h2>
            </div>
            <div className="hidden sm:block font-mono text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
              3-STEP PROCESS
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: '📤',
                title: 'Upload',
                desc: 'Drop your PDF or DOCX resume. Optionally paste a job description to sharpen keyword analysis.',
                accent: '#6366f1',
                accentBg: 'rgba(99,102,241,0.1)',
                accentBorder: 'rgba(99,102,241,0.2)',
              },
              {
                step: '02',
                icon: '🤖',
                title: 'AI Deep Scan',
                desc: 'Our AI audits ATS compatibility, keyword density, impact metrics, tone, and structure scoring.',
                accent: '#a78bfa',
                accentBg: 'rgba(167,139,250,0.1)',
                accentBorder: 'rgba(167,139,250,0.2)',
              },
              {
                step: '03',
                icon: '✅',
                title: 'Get Rewrites',
                desc: 'Receive line-by-line suggestions, keyword gap analysis, and a downloadable full report.',
                accent: '#34d399',
                accentBg: 'rgba(52,211,153,0.1)',
                accentBorder: 'rgba(52,211,153,0.2)',
              },
            ].map(({ step, icon, title, desc, accent, accentBg, accentBorder }) => (
              <div
                key={step}
                className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: accentBg,
                  border: `1px solid ${accentBorder}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 12px 40px -10px ${accent}33`; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
                  >
                    {icon}
                  </div>
                  <span className="font-mono text-3xl font-bold" style={{ color: `${accent}20` }}>
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-white font-body text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upload + Results ───────────────────────────── */}
      <section id="upload" className="relative z-10 mx-auto max-w-3xl px-6 pb-32 sm:px-10">

        {/* Upload card */}
        <div
          className="anim-up rounded-3xl p-7 sm:p-9"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
            animationDelay: '0.1s',
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white font-body">Start your review</h2>
            <p className="mt-1.5 text-sm font-body" style={{ color: 'rgba(255,255,255,0.45)' }}>
              PDF or DOCX · under 4MB · A job description sharpens keyword matching
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${dragging ? 'dropzone-active' : ''}`}
            style={{
              border: dragging
                ? '2px dashed rgba(99,102,241,0.7)'
                : file
                ? '2px solid rgba(99,102,241,0.4)'
                : '2px dashed rgba(255,255,255,0.12)',
              background: dragging
                ? 'rgba(99,102,241,0.08)'
                : file
                ? 'rgba(99,102,241,0.06)'
                : 'rgba(255,255,255,0.02)',
              padding: '2rem',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {file ? (
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <svg className="h-6 w-6" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white font-body truncate">{file.name}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {(file.size / 1024).toFixed(0)} KB · Ready to analyze
                  </p>
                </div>
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
                >
                  <svg className="h-3.5 w-3.5" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center py-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <svg className="h-7 w-7" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-body">
                    Drop your resume here
                  </p>
                  <p className="text-xs mt-1 font-body" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    or{' '}
                    <span className="underline underline-offset-2" style={{ color: '#818cf8' }}>
                      click to browse
                    </span>
                    {' '}· PDF or DOCX
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Job description */}
          <div className="mt-5">
            <label className="block text-sm font-medium mb-2 font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Job Description{' '}
              <span className="font-normal font-mono text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                optional · sharpens keyword match
              </span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              placeholder="Paste the role you're targeting to check keyword overlap…"
              className="w-full resize-none rounded-xl px-4 py-3 text-sm font-body transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.85)',
                outline: 'none',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || status === 'analyzing'}
              className="group relative inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 font-body disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !file || status === 'analyzing'
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: !file || status === 'analyzing'
                  ? 'none'
                  : '0 8px 24px rgba(99,102,241,0.35)',
              }}
              onMouseEnter={e => {
                if (file && status !== 'analyzing') {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.5)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = file && status !== 'analyzing'
                  ? '0 8px 24px rgba(99,102,241,0.35)'
                  : 'none';
              }}
            >
              {status === 'analyzing' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analyze Resume
                </>
              )}
            </button>

            {file && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 font-body"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.45)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start over
              </button>
            )}
          </div>

          {/* Privacy badge */}
          <div
            className="mt-5 flex items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-body" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <strong className="font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>Encrypted & auto-deleted</strong> · Processed privately in-memory, never used for training
            </span>
          </div>
        </div>

        {/* ── Result States ──────────────────────────── */}
        <div className="mt-6">

          {/* Idle placeholder */}
          {status === 'idle' && (
            <div
              className="anim-in rounded-3xl py-16 text-center"
              style={{
                border: '2px dashed rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <svg className="h-7 w-7" style={{ color: 'rgba(99,102,241,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Your AI-powered resume analysis will appear here
              </p>
            </div>
          )}

          {/* Analyzing state */}
          {status === 'analyzing' && (
            <div
              className="anim-in rounded-3xl p-10"
              style={{
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <div className="flex flex-col items-center gap-6">
                {/* Spinner */}
                <div className="relative">
                  <div
                    className="h-16 w-16 rounded-full"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}
                  />
                  <svg
                    className="absolute inset-0 h-16 w-16 animate-spin"
                    style={{ animationDuration: '1.5s' }}
                    fill="none"
                    viewBox="0 0 64 64"
                  >
                    <circle
                      cx="32" cy="32" r="26"
                      stroke="url(#spin-grad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="40 120"
                    />
                    <defs>
                      <linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    {stepMsg.icon}
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                  <p className="font-semibold text-white font-body">{stepMsg.text}</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span className="dot-bounce" />
                    <span className="dot-bounce" />
                    <span className="dot-bounce" />
                  </div>
                </div>

                {/* Progress steps */}
                <div className="flex gap-2">
                  {ANALYZING_MESSAGES.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full transition-all duration-500"
                      style={{
                        width: i <= analyzingStep % ANALYZING_MESSAGES.length ? '24px' : '8px',
                        background: i <= analyzingStep % ANALYZING_MESSAGES.length
                          ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div
              className="anim-in rounded-3xl p-8 text-center"
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <svg className="h-6 w-6" style={{ color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white font-body mb-2">Something went wrong</h3>
              <p className="text-sm max-w-sm mx-auto font-body mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {error}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium font-body transition-all duration-200"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Results dashboard */}
          {status === 'result' && result && (
            <div
              className="anim-in rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Results header */}
              <div
                className="px-7 py-6 flex flex-wrap items-start justify-between gap-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <h3 className="text-xl font-bold text-white font-body">{result.verdict}</h3>
                  <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Analyzed by HireLens AI · {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadReport}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold font-body transition-all duration-200"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: '#a5b4fc',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Report
                  </button>
                </div>
              </div>

              <div className="p-7 space-y-8">
                {/* Top score metrics */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {/* Overall score ring */}
                  <div
                    className="col-span-1 flex flex-col items-center justify-center rounded-2xl p-5 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="relative">
                      <ScoreRing score={score} visible={demoShown} size={100} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-white font-body">{score}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>Overall Score</p>
                  </div>

                  {/* ATS match */}
                  <div
                    className="col-span-1 flex flex-col items-center justify-center rounded-2xl p-5 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="relative">
                      <ScoreRing score={atsScore} visible={demoShown} size={100} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-extrabold text-white font-body">{atsScore}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>%</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>ATS Match</p>
                  </div>

                  {/* Verdict badge */}
                  <div
                    className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center rounded-2xl p-5 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="text-4xl mb-3"
                    >
                      {score >= 80 ? '🏆' : score >= 60 ? '💪' : '🔧'}
                    </div>
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-mono border ${getVerdictStyle(score).cls}`}
                    >
                      {getVerdictStyle(score).label}
                    </div>
                    <p className="mt-3 text-xs font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {score >= 80
                        ? 'Strong — a few sharpening edits below'
                        : score >= 60
                        ? 'Solid — the edits below will lift it'
                        : 'Needs meaningful improvements'}
                    </p>
                  </div>
                </div>

                {/* Section scores */}
                <div>
                  <h4 className="text-sm font-bold text-white font-body mb-4 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-xs"
                      style={{ background: 'rgba(99,102,241,0.15)' }}
                    >📊</span>
                    Category Scores
                  </h4>
                  <div className="space-y-3.5">
                    {result.sectionScores.map((d) => (
                      <div key={d.name || d.score}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>{d.name}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold font-mono"
                              style={{
                                color: d.score >= 80 ? '#34d399' : d.score >= 60 ? '#fbbf24' : '#f87171',
                              }}
                            >
                              {d.score}
                            </span>
                            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>/100</span>
                          </div>
                        </div>
                        <ProgressBar
                          value={d.score}
                          visible={demoShown}
                          gradient={getSectionGradient(d.score)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ATS keyword match bar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="text-sm font-bold text-white font-body flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(99,102,241,0.15)' }}>🎯</span>
                      ATS Keyword Match
                    </h4>
                    <span className="text-sm font-bold font-mono" style={{ color: '#818cf8' }}>{atsScore}%</span>
                  </div>
                  <ProgressBar value={result.atsMatch} visible={demoShown} gradient="from-indigo-500 to-violet-500" />
                  {result.matchedKeywords?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {result.matchedKeywords.slice(0, 8).map((k) => (
                        <span key={k} className="chip chip-indigo">{k}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rewrites */}
                {result.rewrites?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-white font-body mb-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.15)' }}>✍️</span>
                      Flagged Lines & Rewrites
                    </h4>
                    <div className="space-y-3">
                      {result.rewrites.map((f, i) => (
                        <div
                          key={f.original || i}
                          className="rounded-2xl p-4 transition-all duration-300"
                          style={{
                            background: 'rgba(239,68,68,0.04)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderLeft: '3px solid rgba(239,68,68,0.5)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.04)'; e.currentTarget.style.transform = ''; }}
                        >
                          <p className="text-xs font-mono line-through" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.original}</p>
                          <div className="flex items-start gap-2 mt-2">
                            <svg className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <p className="text-sm font-body" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {result.strengths?.length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}
                    >
                      <h4 className="text-sm font-bold font-body mb-4 flex items-center gap-2" style={{ color: '#34d399' }}>
                        <span>✅</span> Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {result.strengths.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-sm font-body">
                            <span className="mt-0.5 flex-shrink-0" style={{ color: '#34d399' }}>+</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.weaknesses?.length > 0 && (
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <h4 className="text-sm font-bold font-body mb-4 flex items-center gap-2" style={{ color: '#f87171' }}>
                        <span>⚠️</span> Weaknesses
                      </h4>
                      <ul className="space-y-2.5">
                        {result.weaknesses.map((w, i) => (
                          <li key={i} className="flex gap-2.5 text-sm font-body">
                            <span className="mt-0.5 flex-shrink-0" style={{ color: '#f87171' }}>−</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {result.matchedKeywords?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-white font-body mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(16,185,129,0.15)' }}>🟢</span>
                        Matched Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchedKeywords.map((k, i) => (
                          <span key={`${k}-${i}`} className="chip chip-green">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missingKeywords?.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-bold text-white font-body mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.15)' }}>🔴</span>
                        Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {result.missingKeywords.map((k, i) => (
                          <span key={`${k}-${i}`} className="chip chip-red">{k}</span>
                        ))}
                      </div>
                    </div>
                  ) : result.matchedKeywords?.length > 0 && (
                    <div
                      className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
                      style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                    >
                      <span className="text-lg">🎉</span>
                      <p className="text-sm font-body" style={{ color: '#34d399' }}>
                        No missing keywords — great coverage!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="relative z-10 border-t py-8 text-center flex flex-col items-center justify-center gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          HireLens · AI Resume Intelligence · Free · No signup required
        </p>
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Made by{' '}
          <a
            href="https://apurv-portfolio-gamma.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200 underline decoration-indigo-500/30 underline-offset-4 hover:decoration-indigo-400"
          >
            Apurv
          </a>
        </p>
      </footer>
    </main>
  );
}
