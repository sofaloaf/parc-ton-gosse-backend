import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const feedbackRouter = express.Router();

// Public feedback submission endpoint
feedbackRouter.post('/submit', async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const now = new Date().toISOString();
		const feedback = {
			id: uuidv4(),
			userId: req.user?.id || 'anonymous',
			userAgent: req.headers['user-agent'] || '',
			timestamp: now,
			...req.body,
			status: 'pending',
			createdAt: now,
			updatedAt: now
		};
		
		const created = await store.feedback.create(feedback);
		res.status(201).json(created);
	} catch (error) {
		console.error('Feedback submission error:', error);
		res.status(500).json({ error: 'Failed to submit feedback' });
	}
});

// Public organization submission endpoint
feedbackRouter.post('/add-organization', async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const now = new Date().toISOString();
		const org = {
			id: uuidv4(),
			userId: req.user?.id || 'anonymous',
			userAgent: req.headers['user-agent'] || '',
			timestamp: now,
			...req.body,
			status: 'pending',
			reviewedBy: '',
			reviewedAt: null,
			createdAt: now,
			updatedAt: now
		};
		
		const created = await store.organizationSuggestions.create(org);
		res.status(201).json(created);
	} catch (error) {
		console.error('Organization submission error:', error);
		res.status(500).json({ error: 'Failed to submit organization' });
	}
});

// Protected admin routes to view submissions
feedbackRouter.get('/list', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const feedbacks = await store.feedback.list();
		res.json(feedbacks);
	} catch (error) {
		console.error('Error fetching feedback:', error);
		res.status(500).json({ error: 'Failed to fetch feedback' });
	}
});

feedbackRouter.get('/organizations/list', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const orgs = await store.organizationSuggestions.list();
		res.json(orgs);
	} catch (error) {
		console.error('Error fetching organizations:', error);
		res.status(500).json({ error: 'Failed to fetch organization suggestions' });
	}
});

feedbackRouter.patch('/organizations/:id/approve', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const now = new Date().toISOString();
		const org = await store.organizationSuggestions.read(req.params.id);
		if (!org) {
			return res.status(404).json({ error: 'Organization not found' });
		}
		
		const updated = {
			...org,
			status: 'approved',
			reviewedBy: req.user.id,
			reviewedAt: now,
			updatedAt: now
		};
		
		await store.organizationSuggestions.update(req.params.id, updated);
		
		// TODO: Automatically add to activities
		
		res.json(updated);
	} catch (error) {
		console.error('Error approving organization:', error);
		res.status(500).json({ error: 'Failed to approve organization' });
	}
});

feedbackRouter.patch('/organizations/:id/reject', requireAuth('admin'), async (req, res) => {
	const store = req.app.get('dataStore');
	try {
		const now = new Date().toISOString();
		const org = await store.organizationSuggestions.read(req.params.id);
		if (!org) {
			return res.status(404).json({ error: 'Organization not found' });
		}
		
		const updated = {
			...org,
			status: 'rejected',
			reviewedBy: req.user.id,
			reviewedAt: now,
			updatedAt: now
		};
		
		await store.organizationSuggestions.update(req.params.id, updated);
		res.json(updated);
	} catch (error) {
		console.error('Error rejecting organization:', error);
		res.status(500).json({ error: 'Failed to reject organization' });
	}
});

export { feedbackRouter };

