## Geos Web Dashboard (Vercel)

Web dashboard voor de `Live-Geos` n8n flow:
- toont queue van leads die **niet** in Salesforce gevonden zijn
- biedt quick review (cards + detail drawer)
- `Save` stuurt payload door naar een n8n demo webhook
- analytics: Open vs Saved, sentiment mix, topics, intents

## 1) Installatie en lokaal starten

```bash
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2) Supabase setup

1. Maak een Supabase project.
2. Voer SQL uit uit `supabase/schema.sql`.
3. Vul in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 3) n8n koppeling

### Ingest endpoint (n8n -> dashboard)
`POST /api/webhooks/lead-not-found`

Gebruik deze minimale body (veldnamen matchen je flow):

```json
{
  "message_id": "gmail-message-id-123",
  "contact_name": "Jane Doe",
  "org_name": "Acme Events",
  "sender_email": "Jane Doe <jane@acme.com>",
  "sender_domain": "acme.com",
  "subject": "Sponsorship inquiry",
  "sentiment": "Positive",
  "confidence": "0.91",
  "primary_topic": "sponsorship",
  "secondary_topics": "pricing",
  "intent": "booking_inquiry",
  "urgency_score": 8,
  "budget_mentioned": true,
  "event_referenced": "GEOS Summit 2026",
  "suggested_action": "Plan a call within 24h.",
  "existsInSalesforce": false,
  "matchedIn": [],
  "reason": "No matches returned in Contact, Lead, Account."
}
```

Optioneel beveiligd met header als je `N8N_WEBHOOK_SECRET` gebruikt:

`x-webhook-secret: <N8N_WEBHOOK_SECRET>`

### Save endpoint (dashboard -> n8n)
`POST /api/leads/:id/save`

De route zet status op `saved` in Supabase en forwardt payload naar:

`N8N_SAVE_WEBHOOK_URL`

## 4) Vercel deploy

1. Push project naar GitHub.
2. Import project in Vercel.
3. Zet environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `N8N_SAVE_WEBHOOK_URL`
   - `N8N_WEBHOOK_SECRET` (optioneel)
4. Deploy.

## 5) Testflow (end-to-end)

1. Start lokaal of open Vercel URL.
2. Trigger ingest via n8n HTTP Request node naar `/api/webhooks/lead-not-found`.
3. Controleer of lead verschijnt in de `Open review queue`.
4. Klik `Save`.
5. Verifieer:
   - status verandert naar `Saved`
   - `saved_at` gevuld in Supabase
   - n8n demo webhook ontvangt payload

## API overzicht

- `POST /api/webhooks/lead-not-found`
- `GET /api/leads`
- `GET /api/metrics`
- `POST /api/leads/:id/save`
