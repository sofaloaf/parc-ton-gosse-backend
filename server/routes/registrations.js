import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';

export const registrationsRouter = express.Router();

registrationsRouter.get('/', requireAuth('provider'), async (req, res) => {
	const store = req.app.get('dataStore');
	const list = await store.registrations.list();
	res.json(list);
});

// Validation middleware for registrations
const validateRegistration = [
	body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
	body('childName').optional().trim().isLength({ max: 200 }).withMessage('Child name too long'),
	body('parentName').optional().trim().isLength({ max: 200 }).withMessage('Parent name too long'),
	body('age').optional().isInt({ min: 0, max: 18 }).withMessage('Age must be between 0 and 18'),
	body('activityId').notEmpty().withMessage('Activity ID required')
];

// Public registration endpoint (no auth required) - MUST BE BEFORE /:id
registrationsRouter.post('/public', validateRegistration, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: errors.array()[0].msg });
	}

	const store = req.app.get('dataStore');
	const now = new Date().toISOString();
	
	// Sanitize input - only allow specific fields
	const reg = { 
		id: uuidv4(), 
		status: 'pending', 
		waitlist: false,
		activityId: req.body.activityId,
		childName: req.body.childName?.trim().substring(0, 200) || '',
		parentName: req.body.parentName?.trim().substring(0, 200) || '',
		email: req.body.email?.trim().toLowerCase() || '',
		age: req.body.age ? parseInt(req.body.age) : null,
		specialRequests: req.body.specialRequests?.trim().substring(0, 1000) || '',
		organizationName: req.body.organizationName?.trim().substring(0, 200) || '',
		reservedAt: now,  // Timestamp when reservation button was clicked
		createdAt: now, 
		updatedAt: now 
	};
	const created = await store.registrations.create(reg);
	res.status(201).json(created);
});

registrationsRouter.get('/:id', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	const item = await store.registrations.get(req.params.id);
	if (!item) return res.status(404).json({ error: 'Not found' });
	if (req.user.role !== 'admin' && req.user.id !== item.parentId) return res.status(403).json({ error: 'Forbidden' });
	res.json(item);
});

registrationsRouter.post('/', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	const now = new Date().toISOString();
	const reg = { id: uuidv4(), status: 'pending', waitlist: false, ...req.body, createdAt: now, updatedAt: now };
	const created = await store.registrations.create(reg);
	res.status(201).json(created);
});

registrationsRouter.put('/:id', requireAuth('provider'), async (req, res) => {
	const store = req.app.get('dataStore');
	const updated = await store.registrations.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
	if (!updated) return res.status(404).json({ error: 'Not found' });
	res.json(updated);
});

registrationsRouter.delete('/:id', requireAuth('parent'), async (req, res) => {
	const store = req.app.get('dataStore');
	const existing = await store.registrations.get(req.params.id);
	if (!existing) return res.status(404).json({ error: 'Not found' });
	if (req.user.role !== 'admin' && req.user.id !== existing.parentId) return res.status(403).json({ error: 'Forbidden' });
	await store.registrations.remove(req.params.id);
	res.json({ ok: true });
});


