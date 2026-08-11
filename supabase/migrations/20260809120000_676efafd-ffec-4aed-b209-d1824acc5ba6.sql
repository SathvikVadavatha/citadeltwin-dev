-- Site & Federal Requirements tab: new, additive tables (req_ prefix).
-- This migration does not touch compliance_rules, compliance_checks, or compliance_violations.

create table req_federal_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null,              -- 'accessibility' | 'safety'
  applies_to text not null,            -- 'commercial' | 'residential' | 'both'
  requirement text not null,           -- 'Accessible route clear width'
  value text not null,                 -- '36'
  unit text,                           -- 'in'
  comparator text,                     -- 'min' | 'max' | 'required'
  note text,                           -- 'minimum continuous clear width'
  citation text not null,              -- 'ADA 403.5.1'
  source_title text not null,          -- '28 CFR Part 36, 2010 ADA Standards'
  source_url text not null,            -- deep link to ecfr.gov or ada.gov
  verified_at date not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table req_jurisdiction_links (
  id uuid primary key default gen_random_uuid(),
  state_code text not null,            -- 'OH', or 'US' for national resources
  link_type text not null,             -- 'state_code' | 'state_agency' | 'model_code'
  label text not null,                 -- 'Ohio Board of Building Standards'
  url text not null,
  note text,
  display_order int not null default 0,
  unique (state_code, url)
);

create table req_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,

  -- exactly what the user typed
  input_address text not null,
  input_zip text,
  property_type text not null check (property_type in ('residential','commercial')),

  -- derived by the geocoder, never typed by the user
  state_code text,
  state_name text,
  county_name text,
  place_name text,
  fips_code text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  geocode_source text,                 -- 'census'
  geocode_match_quality text,          -- 'exact' | 'approximate' | 'failed'
  resolved_at timestamptz,

  created_at timestamptz not null default now()
);

create table req_site_conditions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references req_projects(id) on delete cascade,
  criterion text not null,             -- 'seismic_design_category'
  label text not null,                 -- 'Seismic design category'
  value text not null,                 -- 'B'
  unit text,
  note text,                           -- 'SDS 0.19 g, Risk Category II, Site Class D'
  source text not null,                -- 'USGS' | 'FEMA'
  source_edition text,                 -- 'ASCE 7-22' | 'NFHL'
  source_url text,
  retrieved_at timestamptz not null default now(),
  unique (project_id, criterion)
);

alter table req_federal_rules enable row level security;
alter table req_jurisdiction_links enable row level security;
alter table req_projects enable row level security;
alter table req_site_conditions enable row level security;

create policy "federal rules readable"
  on req_federal_rules for select to anon, authenticated using (true);

create policy "jurisdiction links readable"
  on req_jurisdiction_links for select to anon, authenticated using (true);

create policy "own projects"
  on req_projects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own site conditions"
  on req_site_conditions for all to authenticated
  using (exists (
    select 1 from req_projects p
    where p.id = project_id and p.user_id = auth.uid()
  ));
