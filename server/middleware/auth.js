import jwt from 'jsonwebtoken';

// Validate JWT_SECRET - warn but don't crash
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'dev-secret-change-me') {
	if (process.env.NODE_ENV === 'production') {
		console.error('❌ JWT_SECRET must be set in production environment');
		console.error('⚠️  Server will start but authentication will fail. Please set JWT_SECRET environment variable.');
		// Don't throw - let server start so we can see other errors
	} else {
		console.warn('⚠️  WARNING: Using default JWT_SECRET. This is INSECURE for production!');
	}
}

const JWT_SECRET_FINAL = JWT_SECRET || 'dev-secret-change-me';

export function signToken(payload, opts = {}) {
	return jwt.sign(payload, JWT_SECRET_FINAL, { expiresIn: '7d', ...opts });
}

export function requireAuth(requiredRole) {
	return (req, res, next) => {
		// Try cookie first (more secure), then Authorization header (for compatibility)
		const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
		if (!token) return res.status(401).json({ error: 'Unauthorized' });
		try {
			const decoded = jwt.verify(token, JWT_SECRET_FINAL);
			req.user = decoded;
			if (requiredRole && !hasRole(decoded, requiredRole)) {
				return res.status(403).json({ error: 'Forbidden' });
			}
			next();
		} catch (e) {
			return res.status(401).json({ error: 'Invalid token' });
		}
	};
}

function hasRole(user, role) {
	const rolePriority = { parent: 1, provider: 2, admin: 3 };
	return (rolePriority[user?.role] || 0) >= (rolePriority[role] || 0);
}

// Check if user's trial has expired
export async function checkTrialAccess(req, res, next) {
	// Skip for admin and provider roles
	if (req.user?.role === 'admin' || req.user?.role === 'provider') {
		return next();
	}
	
	const store = req.app.get('dataStore');
	const user = await store.users.get(req.user.id);
	
	if (!user) {
		return res.status(404).json({ error: 'User not found' });
	}
	
	// If user has preordered, grant access
	if (user.hasPreordered) {
		return next();
	}
	
	// Check if trial has expired (24 hours = 86400000 ms)
	if (user.trialStartTime) {
		const trialStart = new Date(user.trialStartTime);
		const now = new Date();
		const trialDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
		const timeElapsed = now - trialStart;
		
		if (timeElapsed > trialDuration) {
			return res.status(403).json({ 
				error: 'Trial expired', 
				trialExpired: true,
				requiresPreorder: true 
			});
		}
	}
	
	next();
}


