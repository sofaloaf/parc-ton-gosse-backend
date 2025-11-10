import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

export const activitiesRouter = express.Router();

// List with filters: category, ageRange, date, price, neighborhood, q
activitiesRouter.get('/', async (req, res) => {
	const store = req.app.get('dataStore');
	const { category, minAge, maxAge, startDate, endDate, minPrice, maxPrice, neighborhood, q } = req.query;
	const all = await store.activities.list();
	const results = all.filter((a) => {
		let ok = true;
		if (category) ok = ok && a.categories?.includes(category);
		// Age filtering: activity age range overlaps with user's desired age range
		if (minAge || maxAge) {
			const actMinAge = a.ageMin ?? 0;
			const actMaxAge = a.ageMax ?? 999;
			const userMinAge = minAge ? Number(minAge) : 0;
			const userMaxAge = maxAge ? Number(maxAge) : 999;
			// Ranges overlap if: actMinAge <= userMaxAge && actMaxAge >= userMinAge
			ok = ok && actMinAge <= userMaxAge && actMaxAge >= userMinAge;
		}
		if (neighborhood) ok = ok && a.neighborhood === neighborhood;
		if (minPrice) ok = ok && (a.price?.amount ?? 0) >= Number(minPrice);
		if (maxPrice) ok = ok && (a.price?.amount ?? 0) <= Number(maxPrice);
		if (startDate) ok = ok && a.schedule?.some((s) => new Date(s.date) >= new Date(startDate));
		if (endDate) ok = ok && a.schedule?.some((s) => new Date(s.date) <= new Date(endDate));
		if (q) {
			const str = `${a.title?.en || ''} ${a.title?.fr || ''} ${a.description?.en || ''} ${a.description?.fr || ''}`.toLowerCase();
			ok = ok && str.includes(String(q).toLowerCase());
		}
		return ok;
	});
	res.json(results);
});

activitiesRouter.get('/:id', async (req, res) => {
	const store = req.app.get('dataStore');
	const act = await store.activities.get(req.params.id);
	if (!act) return res.status(404).json({ error: 'Not found' });
	res.json(act);
});

// Provider or admin create
activitiesRouter.post('/', requireAuth('provider'), async (req, res) => {
	const store = req.app.get('dataStore');
	const now = new Date().toISOString();
	const activity = { id: uuidv4(), ...req.body, createdAt: now, updatedAt: now };
	const created = await store.activities.create(activity);
	res.status(201).json(created);
});

activitiesRouter.put('/:id', requireAuth('provider'), async (req, res) => {
	const store = req.app.get('dataStore');
	const updated = await store.activities.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json(updated);
});

activitiesRouter.delete('/:id', requireAuth('provider'), async (req, res) => {
	const store = req.app.get('dataStore');
	const ok = await store.activities.remove(req.params.id);
	if (!ok) return res.status(404).json({ error: 'Not found' });
	res.json({ ok: true });
});


