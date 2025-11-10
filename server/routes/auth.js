import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { signToken } from '../middleware/auth.js';

export const authRouter = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sofiane.boukhalfa@gmail.com';

// Helper to get Google Client ID (read at request time, not module load time)
function getGoogleClientId() {
	return process.env.GOOGLE_CLIENT_ID;
}

// Password hashing with bcrypt - secure password storage

// Validation middleware
const validateSignup = [
	body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
	body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	body('role').optional().isIn(['parent', 'provider', 'admin']).withMessage('Invalid role')
];

const validateLogin = [
	body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
	body('password').notEmpty().withMessage('Password required')
];

authRouter.post('/signup', validateSignup, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: errors.array()[0].msg });
	}

	const store = req.app.get('dataStore');
	const { email, password, role = 'parent', profile = {}, name } = req.body;
	
	const userExists = await store.users.findByEmail(email);
	if (userExists) {
		return res.status(409).json({ error: 'User already exists' });
	}

	// Hash password with bcrypt
	const hashedPassword = await bcrypt.hash(password, 10);
	
	const now = new Date().toISOString();
	const user = { 
		id: uuidv4(), 
		email, 
		password: hashedPassword, 
		role, 
		profile: { ...profile, name: name || profile.name }, 
		trialStartTime: now, // Start 24-hour trial
		hasPreordered: false,
		createdAt: now 
	};
	await store.users.create(user);
	const token = signToken({ id: user.id, email: user.email, role: user.role });
	
	// Set httpOnly cookie for token (more secure than localStorage)
	res.cookie('token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	});
	
	res.json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile, trialStartTime: user.trialStartTime, hasPreordered: user.hasPreordered } });
});

authRouter.post('/login', validateLogin, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: errors.array()[0].msg });
	}

	const store = req.app.get('dataStore');
	const { email, password } = req.body;
	const user = await store.users.findByEmail(email);
	
	// Use constant-time comparison - always check password even if user doesn't exist
	// This prevents user enumeration attacks
	let isValid = false;
	if (user && user.password) {
		// Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
		if (user.password.startsWith('$2')) {
			// Password is hashed, use bcrypt
			isValid = await bcrypt.compare(password, user.password);
		} else {
			// Password is plain text (legacy), compare directly and migrate
			isValid = user.password === password;
			if (isValid) {
				// Migrate to hashed password
				const hashedPassword = await bcrypt.hash(password, 10);
				await store.users.update(user.id, { password: hashedPassword });
			}
		}
	}
	
	if (!user || !isValid) {
		// Generic error message to prevent user enumeration
		return res.status(401).json({ error: 'Invalid credentials' });
	}
	
	// If user doesn't have trialStartTime, set it now (for existing users)
	const now = new Date().toISOString();
	if (!user.trialStartTime && !user.hasPreordered && user.role === 'parent') {
		await store.users.update(user.id, { trialStartTime: now });
		user.trialStartTime = now;
	}
	
	const token = signToken({ id: user.id, email: user.email, role: user.role });
	
	// Set httpOnly cookie for token (more secure than localStorage)
	res.cookie('token', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
	});
	
	// Track login
	try {
		await store.logins.create({
			id: uuidv4(),
			email: user.email,
			timestamp: now,
			createdAt: now,
			updatedAt: now
		});
	} catch (e) {
		if (process.env.NODE_ENV === 'development') {
			console.error('Failed to track login:', e);
		}
	}
	
	res.json({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile, trialStartTime: user.trialStartTime, hasPreordered: user.hasPreordered || false } });
});

// Password reset request (placeholder - requires email service)
authRouter.post('/forgot-password', async (req, res) => {
	const store = req.app.get('dataStore');
	const { email } = req.body;
	
	if (!email) {
		return res.status(400).json({ error: 'Email required' });
	}
	
	const user = await store.users.findByEmail(email);
	// Always return success to prevent user enumeration
	res.json({ message: 'If an account exists, a password reset link has been sent.' });
	
	if (user) {
		// TODO: Generate reset token and send email
		// For now, just log (in production, this would send an email)
		if (process.env.NODE_ENV === 'development') {
			console.log('Password reset requested for:', email);
		}
	}
});

// Password reset confirmation (placeholder)
authRouter.post('/reset-password', async (req, res) => {
	const { token, newPassword } = req.body;
	
	if (!token || !newPassword || newPassword.length < 8) {
		return res.status(400).json({ error: 'Valid token and password (8+ chars) required' });
	}
	
	// TODO: Verify reset token and update password
	res.status(501).json({ error: 'Password reset not yet implemented' });
});

// Track login (public endpoint for frontend to call)
authRouter.post('/track-login', async (req, res) => {
	const store = req.app.get('dataStore');
	const { email, timestamp } = req.body;
	const now = timestamp || new Date().toISOString();
	try {
		await store.logins.create({
			id: uuidv4(),
			email: email || 'unknown',
			timestamp: now,
			createdAt: now,
			updatedAt: now
		});
		res.json({ success: true });
	} catch (e) {
		if (process.env.NODE_ENV === 'development') {
			console.error('Failed to track login:', e);
		}
		res.status(500).json({ error: 'Failed to track login' });
	}
});

// Logout - clear cookie
authRouter.post('/logout', (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict'
	});
	res.json({ success: true });
});

// Google OAuth login for admin
authRouter.post('/admin/google', async (req, res) => {
	const { idToken } = req.body;
	
	if (!idToken) {
		return res.status(400).json({ error: 'ID token required' });
	}

	const GOOGLE_CLIENT_ID = getGoogleClientId();
	if (!GOOGLE_CLIENT_ID) {
		return res.status(500).json({ error: 'Google OAuth not configured' });
	}

	try {
		const client = new OAuth2Client(GOOGLE_CLIENT_ID);
		const ticket = await client.verifyIdToken({
			idToken: idToken,
			audience: GOOGLE_CLIENT_ID,
		});
		
		const payload = ticket.getPayload();
		const email = payload.email;
		
		if (email !== ADMIN_EMAIL) {
			return res.status(403).json({ error: 'Access denied. Only authorized admin can login.' });
		}

		// Create or update admin user
		const store = req.app.get('dataStore');
		let user = await store.users.findByEmail(ADMIN_EMAIL);
		
		if (!user) {
			user = {
				id: uuidv4(),
				email: ADMIN_EMAIL,
				password: '', // No password needed for OAuth
				role: 'admin',
				profile: {
					name: payload.name,
					picture: payload.picture
				},
				createdAt: new Date().toISOString()
			};
			await store.users.create(user);
		} else {
			// Update user profile with latest Google info
			await store.users.update(user.id, {
				role: 'admin',
				profile: {
					name: payload.name,
					picture: payload.picture
				}
			});
		}

		// Track admin login
		try {
			const now = new Date().toISOString();
			await store.logins.create({
				id: uuidv4(),
				email: ADMIN_EMAIL,
				timestamp: now,
				createdAt: now,
				updatedAt: now
			});
		} catch (e) {
			if (process.env.NODE_ENV === 'development') {
				console.error('Failed to track admin login:', e);
			}
		}

		const token = signToken({ 
			id: user.id, 
			email: user.email, 
			role: 'admin' 
		});

		// Set httpOnly cookie for token (more secure than localStorage)
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
		});

		res.json({ 
			token, 
			user: { 
				id: user.id, 
				email: user.email, 
				role: 'admin', 
				profile: user.profile 
			} 
		});
	} catch (error) {
		if (process.env.NODE_ENV === 'development') {
			console.error('Google OAuth error:', error);
		}
		res.status(401).json({ error: 'Invalid Google token' });
	}
});

