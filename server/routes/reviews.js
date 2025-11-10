import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

export const reviewsRouter = express.Router();

reviewsRouter.get('/', async (req, res) => {
	const store = req.app.get('dataStore');
	res.json(await store.reviews.list());
});

reviewsRouter.get('/:id', async (req, res) => {
	const store = req.app.get('dataStore');
	const item = await store.reviews.get(req.params.id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	res.json(item);
});

reviewsRouter.post('/', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	const now = new Date().toISOString();
	const review = { id: uuidv4(), status: 'pending', ...req.body, createdAt: now, updatedAt: now };
	const created = await store.reviews.create(review);
	res.status(201).json(created);
});

// Moderation
reviewsRouter.put('/:id/moderate', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	const updated = await store.reviews.update(req.params.id, { status: req.body.status, updatedAt: new Date().toISOString() });
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json(updated);
});

reviewsRouter.delete('/:id', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	const ok = await store.reviews.remove(req.params.id);
	if (!ok) return res.status(404).json({ error: 'Not found' });
	res.json({ ok: true });
});


