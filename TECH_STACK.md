# Tech Stack — how the pieces fit together

This is the "why" behind the stack, for anyone on the team picking this up
after Shaheer's rostering/compliance prototype.

## The shape of the system

```
Browser (React SPA)
   │
   ├── reads/writes directly ──▶ Supabase (Postgres + Auth)
   │                              using the public anon key + RLS
   │
   └── calls ──▶ Vercel serverless functions (/api/*)
                    │
                    ├── create-checkout-session.js ──▶ Stripe Checkout
                    ├── create-portal-session.js    ──▶ Stripe Billing Portal
                    ├── chat.js                     ──▶ Groq
                    │
                    ▲
                    │ webhook
              Stripe ──▶ stripe-webhook.js ──▶ Supabase (service-role key)
```

Two different Supabase keys are in play, on purpose:

- The **anon key** (`VITE_SUPABASE_ANON_KEY`) ships to the browser. It can
  only do what Row Level Security in `schema.sql` allows a signed-in user
  to do.
- The **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) only lives on the
  server, inside `stripe-webhook.js`. It bypasses RLS, which is why it's
  never exposed to the frontend — Stripe's webhook isn't a "signed-in
  user", so it needs a key that can write billing status directly.

## Why each piece

- **Supabase over a hand-rolled backend** — Postgres, auth, and row-level
  security out of the box, same reasoning as Shaheer's rostering prototype:
  a real database and login system without standing up a server.
- **Stripe Checkout + Billing Portal over a custom billing UI** — Stripe
  hosts the actual payment form and the "manage/cancel my plan" screen, so
  the prototype never touches card data. The webhook is the only piece we
  own: it listens for what Stripe tells us and mirrors it into
  `billing_accounts`.
- **Groq via a serverless function, not called from the browser** — the API
  key has to stay server-side, so `/api/chat.js` is a thin proxy: it takes
  the conversation plus recent visit notes, forwards them to Groq, and
  returns the reply.
- **Vercel for both hosting and the backend-for-frontend layer** — the
  `/api` folder becomes serverless functions automatically, so there's no
  separate backend deployment to manage alongside the frontend.

## Data model

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` with a name and `carer`/`manager` role |
| `clients` | The people receiving care |
| `care_plans` | One row per client: goals, needs, risks |
| `visit_notes` | The running log carers write after each visit — this is what the AI assistant reads |
| `shifts` | The roster: which carer is visiting which client, when, and whether it happened |
| `carer_training` | Certifications per carer, with an expiry date the Compliance dashboard checks |
| `billing_accounts` | Mirrors Stripe subscription status, written only by the webhook |

## Extending this

- **Multi-tenant / per-agency scoping** — right now RLS policies just check
  "is this user signed in," which is right for a single-team prototype.
  Add an `agency_id` column and tighten policies to `auth.uid()` before
  onboarding more than one care agency.
- **Richer AI context** — `api/chat.js` currently sends the 15 most recent
  visit notes as flat context. For a real deployment, swap this for a
  retrieval step (e.g. pgvector in Supabase) scoped to the client being
  asked about.
- **Seat-based billing enforcement** — the Stripe plans imply carer-seat
  limits (5 / 20 / unlimited) but nothing currently blocks a manager from
  adding more carers than their plan allows. That check would live in the
  `profiles` insert flow.