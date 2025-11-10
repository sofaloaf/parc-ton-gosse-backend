import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = express.Router();

usersRouter.get('/', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	res.json(await store.users.list());
});

usersRouter.get('/:id', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	if (req.user.role !== 'admin' && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
	const user = await store.users.get(req.params.id);
	if (!user) return res.status(404).json({ error: 'Not found' });
	res.json({ id: user.id, email: user.email, role: user.role, profile: user.profile });
});

usersRouter.post('/', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	const user = { id: uuidv4(), ...req.body };
	res.status(201).json(await store.users.create(user));
});

usersRouter.put('/:id', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	if (req.user.role !== 'admin' && req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
	const updated = await store.users.update(req.params.id, req.body);
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json({ id: updated.id, email: updated.email, role: updated.role, profile: updated.profile });
});

usersRouter.delete('/:id', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	const ok = await store.users.remove(req.params.id);
	if (!ok) return res.status(404).json({ error: 'Not found' });
	res.json({ ok: true });
});


