// POST /api/create-portal-session
// Body: { customerId }
// Requires env vars: STRIPE_SECRET_KEY, PUBLIC_SITE_URL
import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { customerId } = req.body || {}
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not set on the server.' })
  if (!customerId) return res.status(400).json({ error: 'No Stripe customer on file yet — subscribe to a plan first.' })

  const stripe = new Stripe(secretKey)
  const siteUrl = process.env.PUBLIC_SITE_URL || `https://${req.headers.host}`

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/app/billing`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
