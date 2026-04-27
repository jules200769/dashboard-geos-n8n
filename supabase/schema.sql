create extension if not exists pgcrypto;

create table if not exists public.lead_queue (
  id uuid primary key default gen_random_uuid(),
  source_message_id text unique,
  contact_name text not null default '',
  org_name text not null default '',
  sender_email text not null default '',
  sender_domain text not null default '',
  phone_country_code text not null default '',
  phone_number text not null default '',
  subject text not null default '',
  sentiment text not null default 'Unknown',
  sentiment_confidence text not null default 'N/A',
  primary_topic text not null default '',
  secondary_topics text not null default '',
  intent text not null default '',
  urgency_score integer not null default 0 check (urgency_score >= 0 and urgency_score <= 10),
  budget_mentioned boolean not null default false,
  event_referenced text not null default '',
  suggested_action text not null default '',
  industry text not null default 'diverse',
  exists_in_salesforce boolean not null default false,
  matched_in text[] not null default '{}',
  match_reason text not null default '',
  salesforce_mode text not null default 'create_account_then_contact' check (salesforce_mode in ('create_contact_under_existing_account', 'create_account_then_contact')),
  matched_account_id text not null default '',
  matched_account_name text not null default '',
  matched_account_website text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  account_description text not null default '',
  lead_rating text not null default 'Warm',
  status text not null default 'open' check (status in ('open', 'saved')),
  save_payload jsonb not null default '{}'::jsonb,
  email_body text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  saved_at timestamptz
);

create index if not exists lead_queue_status_idx on public.lead_queue(status);
create index if not exists lead_queue_created_at_idx on public.lead_queue(created_at desc);
create index if not exists lead_queue_sender_email_idx on public.lead_queue(sender_email);
create index if not exists lead_queue_primary_topic_idx on public.lead_queue(primary_topic);
create index if not exists lead_queue_intent_idx on public.lead_queue(intent);

alter table public.lead_queue add column if not exists salesforce_mode text not null default 'create_account_then_contact';
alter table public.lead_queue add column if not exists matched_account_id text not null default '';
alter table public.lead_queue add column if not exists matched_account_name text not null default '';
alter table public.lead_queue add column if not exists matched_account_website text not null default '';
alter table public.lead_queue add column if not exists account_name text not null default '';
alter table public.lead_queue add column if not exists account_number text not null default '';
alter table public.lead_queue add column if not exists account_description text not null default '';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lead_queue_set_updated_at on public.lead_queue;
create trigger trg_lead_queue_set_updated_at
before update on public.lead_queue
for each row execute function public.set_updated_at();
