-- CareOS Suite — Rostering & Compliance additions
-- Run this AFTER supabase/schema.sql (or after you've already set up the
-- original tables). Safe to run once; re-running will error harmlessly on
-- "already exists" for tables/policies you've already created.

-- 6. Shifts — the roster: who's visiting which client, and when
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  carer_id uuid references auth.users(id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed')),
  notes text,
  created_at timestamptz not null default now()
);

-- 7. Compliance items — training, DBS checks, right-to-work, etc. per carer
create table if not exists compliance_items (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null, -- e.g. 'DBS Check', 'Right to Work', 'Manual Handling Training'
  completed_at date,
  expires_at date,
  created_at timestamptz not null default now()
);

alter table shifts enable row level security;
alter table compliance_items enable row level security;

-- Prototype-level policy: any signed-in team member can read/write.
-- Tighten to per-agency + per-carer scoping before handling real data.
create policy "shifts rw for authenticated" on shifts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "compliance_items rw for authenticated" on compliance_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
