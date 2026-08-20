-- ============================================================================
-- HireLens — analyses table
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- Stores every successful Gemini analysis so results can be reviewed later.
-- ============================================================================

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  resume_name text not null default 'Untitled resume',
  job_description text,
  overall_score integer not null check (overall_score between 0 and 100),
  -- Per-section score breakdown, e.g.
  -- [{"id":"atsKeywordMatch","name":"ATS & Keyword Match","score":85,"weight":0.25,"explanation":"..."}]
  category_scores jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  matched_keywords jsonb not null default '[]'::jsonb,
  missing_keywords jsonb not null default '[]'::jsonb,
  -- Bullet rewrites, e.g. [{"original":"...","suggestion":"..."}]
  bullet_suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Auth isn't implemented yet, so allow anonymous (publishable-key) inserts so
-- the server can write analyses. Anyone with the publishable key can only
-- INSERT (no read/update/delete) until authentication is added later.
-- ---------------------------------------------------------------------------
alter table public.analyses enable row level security;

create policy "Allow anonymous inserts"
  on public.analyses
  for insert
  to anon
  with check (true);

-- Optional convenience index for later queries by date.
create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);
