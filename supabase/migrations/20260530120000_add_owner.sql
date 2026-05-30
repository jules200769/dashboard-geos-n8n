-- Multi-user: tag each lead with the dashboard user (inbox owner) that produced it.
-- The n8n main flow stamps `owner` on the lead-not-found payload, and every
-- dashboard query is scoped to the logged-in user's owner so people only ever
-- see and mutate their own leads.
alter table public.lead_queue add column if not exists owner text not null default '';

create index if not exists lead_queue_owner_idx on public.lead_queue(owner);

-- The same Gmail message id can legitimately appear in two different inboxes,
-- so uniqueness must be per owner instead of global.
alter table public.lead_queue drop constraint if exists lead_queue_source_message_id_key;
drop index if exists public.lead_queue_source_message_id_key;
create unique index if not exists lead_queue_owner_source_message_id_key
  on public.lead_queue(owner, source_message_id);
