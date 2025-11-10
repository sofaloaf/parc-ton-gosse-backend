import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const paymentsRouter = express.Router();

paymentsRouter.post('/create-payment-intent', requireAuth('parent'), async (req, res, next) => {
	try {
		const { amount, currency = 'eur', metadata = {} } = req.body;
		if (!amount) return res.status(400).json({ error: 'Amount required' });
		const intent = await stripe.paymentIntents.create({ amount, currency, metadata });
		res.json({ clientSecret: intent.client_secret });
	} catch (e) {
		next(e);
	}
});

paymentsRouter.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
	const sig = req.headers['stripe-signature'];
	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!endpointSecret) return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
	try {
		const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
		// Handle event types (payment_intent.succeeded, etc.)
		console.log('Stripe event:', event.type);
		res.json({ received: true });
	} catch (err) {
		console.error(err.message);
		res.status(400).send(`Webhook Error: ${err.message}`);
	}
});


