-- CareOS Suite prototype schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query).

-- 1. Profiles — one row per authenticated user (carer or manager)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'carer' check (role in ('carer', 'manager')),
  created_at timestamptz not null default now()
);

-- 2. Clients — the people receiving care
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  care_need text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 3. Care plans — one active plan per client (goals / needs / risks)
create table if not exists care_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade unique,
  goals text,
  needs text,
  risks text,
  updated_at timestamptz not null default now()
);

-- 4. Visit notes — the running log the AI assistant reads from
create table if not exists visit_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  author_id uuid references auth.users(id),
  note text not null,
  created_at timestamptz not null default now()
);

-- 5. Shifts — rostering: who is visiting which client, and when
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  carer_id uuid references auth.users(id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed')),
  created_at timestamptz not null default now()
);

-- 6. Carer training — compliance: certifications and their expiry dates
create table if not exists carer_training (
  id uuid primary key default gen_random_uuid(),
  carer_id uuid not null references auth.users(id) on delete cascade,
  training_name text not null,
  completed_date date,
  expiry_date date,
  created_at timestamptz not null default now()
);

-- 7. Billing accounts — synced from Stripe via the webhook (api/stripe-webhook.js)
create table if not exists billing_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  plan text,
  status text default 'inactive', -- inactive | active | past_due | canceled
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

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

-- Row Level Security ---------------------------------------------------

alter table profiles enable row level security;
alter table clients enable row level security;
alter table care_plans enable row level security;
alter table visit_notes enable row level security;
alter table shifts enable row level security;
alter table carer_training enable row level security;
alter table billing_accounts enable row level security;
alter table shifts enable row level security;
alter table compliance_items enable row level security;

-- Profiles: users can read/update their own profile; everyone signed in can
-- read profiles so names show up in the UI.
create policy "profiles readable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles updatable by owner" on profiles
  for update using (auth.uid() = id);
create policy "profiles insertable by owner" on profiles
  for insert with check (auth.uid() = id);

-- Clients / care plans / visit notes: prototype-level policy — any signed-in
-- team member can read and write. Tighten to per-agency scoping before
-- handling real client data.
create policy "clients rw for authenticated" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "care_plans rw for authenticated" on care_plans
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "visit_notes rw for authenticated" on visit_notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Shifts: any signed-in team member can read the whole roster and manage
-- shifts — same prototype-level scoping as clients/visit notes above.
create policy "shifts rw for authenticated" on shifts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Carer training: any signed-in team member can read/write training
-- records, so managers can log certifications on a carer's behalf.
create policy "carer_training rw for authenticated" on carer_training
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Billing: readable by authenticated users (prototype has one shared
-- account); writes only happen from the service-role key in the webhook.
create policy "billing readable by authenticated" on billing_accounts
  for select using (auth.role() = 'authenticated');

-- Shifts / compliance: same prototype-level policy as clients above.
create policy "shifts rw for authenticated" on shifts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "compliance_items rw for authenticated" on compliance_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
