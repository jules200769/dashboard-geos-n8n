alter table public.lead_queue
  add column if not exists matched_account_candidates jsonb not null default '[]'::jsonb;
