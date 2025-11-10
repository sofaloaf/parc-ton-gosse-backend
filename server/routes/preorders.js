import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const PREORDER_AMOUNT = 499; // €4.99 in cents

export const preordersRouter = express.Router();

// Get preorder status
preordersRouter.get('/status', requireAuth(), async (req, res) => {
	const store = req.app.get('dataStore');
	const user = await store.users.get(req.user.id);
	if (!user) return res.status(404).json({ error: 'User not found' });
	
	res.json({
		hasPreordered: user.hasPreordered || false,
		preorderDate: user.preorderDate || null,
		preorderId: user.preorderId || null
	});
});

// Create preorder payment intent
preordersRouter.post('/create-payment-intent', requireAuth(), async (req, res) => {
	const store = req.app.get('dataStore');
	const { promoCode } = req.body;
	
	// Check if user already preordered
	const user = await store.users.get(req.user.id);
	if (user?.hasPreordered) {
		return res.status(400).json({ error: 'User has already preordered' });
	}
	
	// Calculate amount (apply promo code if valid)
	let amount = PREORDER_AMOUNT;
	if (promoCode) {
		// Simple promo code validation (can be enhanced)
		const validPromoCodes = {
			'LAUNCH20': 0.8, // 20% off
			'FOUNDER': 0.5,  // 50% off
			'BETA': 0.9      // 10% off
		};
		if (validPromoCodes[promoCode.toUpperCase()]) {
			amount = Math.round(PREORDER_AMOUNT * validPromoCodes[promoCode.toUpperCase()]);
		}
	}
	
	try {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount,
			currency: 'eur',
			metadata: {
				userId: req.user.id,
				userEmail: req.user.email,
				type: 'preorder',
				promoCode: promoCode || ''
			}
		});
		
		res.json({ 
			clientSecret: paymentIntent.client_secret,
			amount: amount / 100, // Convert cents to euros
			originalAmount: PREORDER_AMOUNT / 100,
			discountApplied: amount < PREORDER_AMOUNT
		});
	} catch (error) {
		console.error('Stripe error:', error);
		res.status(500).json({ error: 'Failed to create payment intent' });
	}
});

// Confirm preorder (called after successful payment)
preordersRouter.post('/confirm', requireAuth(), async (req, res) => {
	const store = req.app.get('dataStore');
	const { paymentIntentId } = req.body;
	
	if (!paymentIntentId) {
		return res.status(400).json({ error: 'Payment intent ID required' });
	}
	
	try {
		// Verify payment with Stripe
		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		
		if (paymentIntent.status !== 'succeeded') {
			return res.status(400).json({ error: 'Payment not completed' });
		}
		
		// Update user to mark as preordered
		const now = new Date().toISOString();
		await store.users.update(req.user.id, {
			hasPreordered: true,
			preorderDate: now,
			preorderId: paymentIntentId,
			preorderAmount: paymentIntent.amount / 100
		});
		
		// Create preorder record for tracking
		try {
			await store.preorders.create({
				id: uuidv4(),
				userId: req.user.id,
				userEmail: req.user.email,
				paymentIntentId: paymentIntentId,
				amount: paymentIntent.amount / 100,
				promoCode: paymentIntent.metadata?.promoCode || '',
				status: 'completed',
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			console.error('Failed to create preorder record:', e);
		}
		
		res.json({ 
			success: true,
			preorderId: paymentIntentId,
			preorderDate: now
		});
	} catch (error) {
		console.error('Preorder confirmation error:', error);
		res.status(500).json({ error: 'Failed to confirm preorder' });
	}
});

// Validate promo code
preordersRouter.post('/validate-promo', (req, res) => {
	const { promoCode } = req.body;
	const validPromoCodes = {
		'LAUNCH20': { discount: 20, amount: PREORDER_AMOUNT * 0.8 / 100 },
		'FOUNDER': { discount: 50, amount: PREORDER_AMOUNT * 0.5 / 100 },
		'BETA': { discount: 10, amount: PREORDER_AMOUNT * 0.9 / 100 }
	};
	
	const code = promoCode?.toUpperCase();
	if (code && validPromoCodes[code]) {
		res.json({
			valid: true,
			discount: validPromoCodes[code].discount,
			amount: validPromoCodes[code].amount,
			originalAmount: PREORDER_AMOUNT / 100
		});
	} else {
		res.json({ valid: false });
	}
});

