// POST /api/stripe-webhook
// Configure this URL in the Stripe Dashboard → Developers → Webhooks.
// Requires env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let event
  try {
    const rawBody = await readRawBody(req)
    const signature = req.headers['stripe-signature']
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await supabase.from('billing_accounts').upsert(
          {
            owner_id: session.client_reference_id || null,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: session.metadata?.plan || null,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_customer_id' }
        )
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabase.from('billing_accounts').upsert(
          {
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_customer_id' }
        )
        break
      }
      default:
        break // ignore other event types in this prototype
    }
    res.status(200).json({ received: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
