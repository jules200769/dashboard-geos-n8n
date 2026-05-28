-- Persist the Salesforce Account/Contact Ids returned by the n8n save/update webhook.
-- These let the dashboard correct a saved card by UPDATING the existing Salesforce
-- record instead of creating a duplicate.
alter table public.lead_queue add column if not exists salesforce_account_id text not null default '';
alter table public.lead_queue add column if not exists salesforce_contact_id text not null default '';
