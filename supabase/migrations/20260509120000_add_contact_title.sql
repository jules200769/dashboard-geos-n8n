-- Add contact job title for dashboard / Salesforce Contact.Title (idempotent for existing DBs).
alter table public.lead_queue
  add column if not exists contact_title text not null default '';
