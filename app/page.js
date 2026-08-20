'use client';

import { useRef, useState, useEffect } from 'react';

/* Smooth cursor-following glow behind the page content */
function MouseGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    const current = { ...target };
    let raf;

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const tick = () => {
      // Ease toward the cursor for a buttery (not jittery) trail
      current.x += (target.x - current.x) * 0.09;
      current.y += (target.y - current.y) * 0.09;
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
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
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[42rem] w-[42rem] rounded-full opacity-70"
      style={{
        background:
          'radial-gradient(circle, rgba(224,172,63,0.16) 0%, rgba(193,68,60,0.07) 42%, transparent 70%)',
        filter: 'blur(45px)',
        willChange: 'transform',
      }}
    />
  );
}

/* Counts up towards `target` while `active` is true (eased, buttery) */
function useCountUp(target, active) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf;
    const start = performance.now();
    const duration = 900;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return value;
}

/* Becomes true shortly after `status` matches — lets bars animate in on show */
function useVisible(status, match) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (status !== match) {
      setVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [status, match]);
  return visible;
}

export default function Home() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle | analyzing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const inputRef = useRef(null);
  const tiltRef = useRef(null);

  function handleHeroMove(e) {
    const el = tiltRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
  }

  function resetHeroTilt() {
    if (tiltRef.current) tiltRef.current.style.transform = '';
  }

  function handleFiles(fileList) {
    const picked = fileList?.[0];
    if (!picked) return;
    setFile(picked);
    // Clear a previous result when a new file is chosen
    setResult(null);
    setError(null);
    setStatus('idle');
  }

  async function handleAnalyze() {
    if (!file || status === 'analyzing') return;
    setStatus('analyzing');
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobDescription', jobDescription);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Analysis failed. Please try again.');
      }
      setResult(data);
      setStatus('result');
    } catch (err) {
      setError(err?.message || 'Something went wrong while analyzing your resume.');
      setStatus('error');
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setJobDescription('');
    setStatus('idle');
  }

  // Cycle the "analyzing" status message while a review is running.
  useEffect(() => {
    if (status !== 'analyzing') {
      setAnalyzingStep(0);
      return;
    }
    setAnalyzingStep(0);
    const id = setInterval(() => setAnalyzingStep((s) => s + 1), 1400);
    return () => clearInterval(id);
  }, [status]);

  const demoShown = useVisible(status, 'result');
  const score = useCountUp(result?.overallScore ?? 0, demoShown);
  const atsScore = useCountUp(result?.atsMatch ?? 0, demoShown);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <MouseGlow />
      {/* Header */}
      <header className="anim-up mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl italic text-paper">HireLens</span>
          <span className="font-mono text-[11px] tracking-widest text-paper/50">
            AI RESUME REVIEW
          </span>
        </div>
        <a
          href="#upload"
          className="group font-mono text-xs tracking-wide text-paper/70 underline decoration-paper/30 underline-offset-4 transition-all duration-300 hover:text-paper hover:decoration-marker"
        >
          try it{' '}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-6 sm:px-10 lg:grid-cols-2">
        <div>
          <p
            className="anim-up font-mono text-xs tracking-widest text-marker"
            style={{ animationDelay: '0.05s' }}
          >
            NO SIGN-UP · FREE · TAKES 30 SECONDS
          </p>
          <h1
            className="anim-up mt-4 font-display text-4xl leading-[1.1] text-paper sm:text-5xl"
            style={{ animationDelay: '0.15s' }}
          >
            Get your resume marked up{' '}
            <span className="italic text-marker">like an editor would.</span>
          </h1>
          <p
            className="anim-up mt-5 max-w-md font-body text-paper/70"
            style={{ animationDelay: '0.25s' }}
          >
            Upload your resume and, optionally, a job description. You{'\u0027'}ll get back
            what an ATS actually reads, which lines fall flat, and exactly what to
            rewrite — not a vague {'\u201C'}looks good.{'\u201D'}
          </p>
          <a
            href="#upload"
            className="anim-up group mt-8 inline-flex items-center gap-2 rounded-sm bg-pen px-5 py-3 font-body text-sm font-medium text-paper shadow-[0_10px_25px_-10px_rgba(193,68,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pen-dark hover:shadow-[0_16px_30px_-10px_rgba(193,68,60,0.9)] active:translate-y-0"
            style={{ animationDelay: '0.35s' }}
          >
            Upload your resume
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </div>

        {/* Signature element: annotated document mockup on the desk */}
        <div
          ref={tiltRef}
          onMouseMove={handleHeroMove}
          onMouseLeave={resetHeroTilt}
          className="anim-pop relative mx-auto w-full max-w-sm [perspective:900px]"
          style={{ transition: 'transform 0.18s ease-out' }}
        >
          <div className="paper-ruled relative rotate-2 rounded-sm bg-paper p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="h-3 w-24 rounded-sm bg-ink/80" />
            <div className="mt-2 h-2 w-16 rounded-sm bg-ink/30" />

            <div className="mt-6 space-y-2">
              <div className="h-2 w-full rounded-sm bg-ink/15" />
              <div className="h-2 w-5/6 rounded-sm bg-ink/15" />
              <div className="pen-underline inline-block h-2 w-4/6 rounded-sm bg-ink/15" />
            </div>

            <div className="mt-6 space-y-2">
              <div className="h-2 w-full rounded-sm bg-ink/15" />
              <div className="h-2 w-3/6 rounded-sm bg-ink/15" />
            </div>

            {/* margin comment */}
            <div className="anim-float absolute -right-8 top-24 hidden w-32 -rotate-3 font-display text-xs italic text-pen sm:block">
              prove it with a number →
            </div>
          </div>

          {/* Rubber-stamp score badge, the signature element */}
          <div
            className="stamp anim-pop absolute -bottom-6 -left-6 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-paper font-mono"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="text-2xl font-medium leading-none">78</span>
            <span className="mt-1 text-[9px] tracking-wide">/ 100</span>
          </div>
        </div>
      </section>

      {/* Upload + results */}
      <section
        id="upload"
        className="mx-auto max-w-3xl px-6 pb-28 sm:px-10"
      >
        <div
          className="anim-up rounded-sm bg-paper p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] sm:p-9"
          style={{ animationDelay: '0.15s' }}
        >
          <h2 className="font-display text-2xl text-ink">Start the review</h2>
          <p className="mt-1 font-body text-sm text-ink-soft">
            PDF or DOCX. A job description is optional but sharpens the keyword match.
          </p>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
              dragging
                ? 'scale-[1.02] border-pen bg-pen/5 shadow-[0_10px_30px_-12px_rgba(193,68,60,0.6)]'
                : 'border-ink/20 hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.4)] active:translate-y-0'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {file ? (
              <p className="anim-in font-mono text-sm text-ink">
                <span className="mr-2 inline-block text-pen">📄</span>
                {file.name}
              </p>
            ) : (
              <>
                <p className="font-body text-sm text-ink">
                  Drop your resume here, or{' '}
                  <span className="text-pen underline underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-faint">
                  PDF or DOCX · under 4MB
                </p>
              </>
            )}
          </div>

          {/* Job description */}
          <label className="mt-6 block font-body text-sm text-ink-soft">
            Job description <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste the role you're targeting to check keyword overlap…"
            className="mt-2 w-full resize-none rounded-sm border border-ink/15 bg-white/60 p-3 font-body text-sm text-ink transition-all duration-300 placeholder:text-ink-faint hover:border-ink/30 focus:border-pen focus:bg-white focus:shadow-[0_0_0_4px_rgba(224,172,63,0.18)]"
          />

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!file || status === 'analyzing'}
              className="rounded-sm bg-pen px-5 py-3 font-body text-sm font-medium text-paper shadow-[0_8px_20px_-10px_rgba(193,68,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-pen-dark hover:shadow-[0_14px_26px_-10px_rgba(193,68,60,0.9)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {status === 'analyzing' ? 'Reading it…' : 'Analyze resume'}
            </button>
            {file && (
            <button
              onClick={handleReset}
              className="group font-mono text-xs text-ink-faint underline underline-offset-2 transition-colors duration-200 hover:text-ink"
            >
              <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">←</span>{' '}
              start over
            </button>
            )}
          </div>
        </div>

        {/* Results dashboard */}
        <div className="mt-8">
          {status === 'idle' && (
            <div className="anim-in rounded-sm border-2 border-dashed border-paper/25 px-6 py-14 text-center">
              <p className="font-display text-lg italic text-paper/60">
                Your annotated resume will appear here.
              </p>
            </div>
          )}

                    {status === 'analyzing' && (
            <div className="anim-in flex flex-col items-center justify-center gap-4 rounded-sm border-2 border-dashed border-paper/25 px-6 py-14 text-center">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-paper/20">
                <div className="absolute h-5 w-5 animate-spin rounded-full border-2 border-marker border-t-transparent" />
              </div>
              <div className="font-mono text-xs tracking-widest text-marker">
                {['Reading your resume…', 'Checking ATS keyword match…', 'Scoring structure & impact…', 'Almost done…'][(analyzingStep * 1) % 4] || 'Analyzing your resume…'}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="anim-in rounded-sm border-2 border-dashed border-pen/40 px-6 py-10 text-center">
              <p className="font-display text-lg italic text-pen">Something went wrong.</p>
              <p className="mx-auto mt-2 max-w-md font-body text-sm text-paper/80">
                {error}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-5 rounded-sm border border-pen/50 px-4 py-2 font-mono text-xs text-paper transition hover:bg-pen/10"
              >
                try again
              </button>
            </div>
          )}


          {status === 'result' && result && (
            <div className="anim-in rounded-sm bg-paper p-6 sm:p-9">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-ink">
                  {result.verdict}
                </h3>
                <span className="font-mono font-tabular text-sm text-pen">
                  {score}/100
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-ink-faint">
                analyzed by HireLens AI
              </p>

              {/* Overall score message */}
              <p className="mt-4 font-body text-sm text-ink-soft">
                {score >= 80
                  ? 'Strong resume — a few sharpening edits below.'
                  : score >= 60
                    ? 'Solid foundation — the edits below will lift it.'
                    : 'Needs meaningful work — the edits below are the highest-impact fixes.'}
              </p>

              {/* Section scores */}
              <div className="mt-6 space-y-3">
                {result.sectionScores.map((d) => (
                  <div key={d.name || d.score}>
                    <div className="flex justify-between font-body text-xs text-ink-soft">
                      <span>{d.name}</span>
                      <span className="font-mono">{d.score}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-marker to-marker-soft transition-[width] duration-[900ms] ease-out"
                        style={{ width: `${demoShown ? d.score : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* ATS keyword match — headline score */}
              <div className="mt-7">
                <div className="flex justify-between font-body text-xs text-ink-soft">
                  <span>ATS keyword match</span>
                  <span className="font-mono">{atsScore}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-marker to-marker-soft transition-[width] duration-[900ms] ease-out"
                    style={{ width: `${demoShown ? result.atsMatch : 0}%` }}
                  />
                </div>
                {result.matchedKeywords?.length > 0 && (
                  <p className="mt-2 font-body text-[11px] text-ink-faint">
                    matched:{' '}
                    {result.matchedKeywords.slice(0, 6).map((k) => (
                      <span key={k} className="mr-1.5 text-pen">
                        {k}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Flagged resume lines — originals rewritten */}
              {result.rewrites?.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-body text-sm font-medium text-ink">
                    Flagged resume lines
                  </h4>
                  <div className="mt-3 space-y-3">
                    {result.rewrites.map((f, i) => (
                      <div
                        key={f.original || i}
                        className="rounded-sm border-l-2 border-pen bg-pen/5 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-pen/10 hover:shadow-[0_8px_20px_-12px_rgba(193,68,60,0.5)]"
                      >
                        <p className="font-mono text-xs text-ink-soft line-through">
                          {f.original}
                        </p>
                        <p className="mt-1 font-body text-sm text-ink">
                          <span className="mr-1 text-pen">→</span>
                          {f.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-body text-sm font-medium text-ink">Strengths</h4>
                  <ul className="mt-3 space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 font-body text-sm text-ink">
                        <span className="text-ink-faint">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {result.weaknesses?.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-body text-sm font-medium text-ink">Weaknesses</h4>
                  <ul className="mt-3 space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-2 font-body text-sm text-ink">
                        <span className="text-pen">−</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matched keywords */}
              {result.matchedKeywords?.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-body text-sm font-medium text-ink">
                    Matched keywords
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.matchedKeywords.map((k, i) => (
                      <span
                        key={`${k}-${i}`}
                        className="rounded-sm bg-marker-soft px-2.5 py-1 font-mono text-xs text-ink"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing keywords */}
              {result.missingKeywords?.length > 0 ? (
                <div className="mt-8">
                  <h4 className="font-body text-sm font-medium text-ink">
                    Missing keywords
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.missingKeywords.map((k, i) => (
                      <span
                        key={`${k}-${i}`}
                        className="rounded-sm bg-pen/10 px-2.5 py-1 font-mono text-xs text-pen transition-all duration-200 hover:-translate-y-0.5 hover:bg-pen hover:text-paper"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                result.matchedKeywords?.length > 0 && (
                  <p className="mt-8 font-body text-sm text-ink-faint">
                    No obvious missing keywords — nice coverage.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
