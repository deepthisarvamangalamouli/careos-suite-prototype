// POST /api/create-checkout-session
// Body: { plan: 'starter' | 'growth' | 'agency', email, userId }
// Requires env vars: STRIPE_SECRET_KEY, STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH,
// STRIPE_PRICE_AGENCY, PUBLIC_SITE_URL
import Stripe from 'stripe'

const PRICE_ENV = {
  starter: 'STRIPE_PRICE_STARTER',
  growth: 'STRIPE_PRICE_GROWTH',
  agency: 'STRIPE_PRICE_AGENCY',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { plan, email, userId } = req.body || {}
  const priceId = process.env[PRICE_ENV[plan]]
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set on the server.' })
  }
  if (!priceId) {
    return res.status(400).json({ error: `Unknown or unconfigured plan: ${plan}` })
  }

  const stripe = new Stripe(secretKey)
  const siteUrl = process.env.PUBLIC_SITE_URL || `https://${req.headers.host}`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${siteUrl}/app/billing?checkout=success`,
      cancel_url: `${siteUrl}/app/billing?checkout=cancelled`,
      metadata: { plan, userId: userId || '' },
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
