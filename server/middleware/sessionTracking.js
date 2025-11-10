import { v4 as uuidv4 } from 'uuid';

// Store active sessions in memory (could be moved to Redis in production)
const activeSessions = new Map();

export function trackSession(req, res, next) {
	// Only track for non-admin, non-API routes (unless it's a page view)
	const isApiRoute = req.path.startsWith('/api/');
	
	if (isApiRoute && !req.path.includes('/track')) {
		return next();
	}

	const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
	const userId = req.user?.id || 'anonymous';
	const email = req.user?.email || 'anonymous';
	const userAgent = req.headers['user-agent'] || '';
	const ip = req.ip || req.connection.remoteAddress || '';

	// Track page views
	if (req.method === 'GET' && !isApiRoute) {
		const now = new Date().toISOString();
		
		// Get or create session
		let session = activeSessions.get(sessionId);
		if (!session) {
			session = {
				id: uuidv4(),
				userId: userId,
				email: email,
				startTime: now,
				endTime: null,
				duration: null,
				pageViews: 0,
				pages: [],
				userAgent: userAgent,
				ip: ip,
				createdAt: now,
				updatedAt: now
			};
			activeSessions.set(sessionId, session);
		}

		// Update session
		session.pageViews = (session.pageViews || 0) + 1;
		session.pages.push({
			path: req.path,
			timestamp: now
		});
		session.updatedAt = now;

		// Persist session to database in background (non-blocking)
		const store = req.app.get('dataStore');
		if (store && store.sessions) {
			store.sessions.create({
				...session,
				userId: session.userId,
				email: session.email,
				startTime: session.startTime,
				endTime: session.endTime,
				duration: session.duration,
				pageViews: session.pageViews,
				pages: JSON.stringify(session.pages),
				userAgent: session.userAgent,
				ip: session.ip,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt
			}).catch(err => {
				console.error('Failed to save session:', err);
			});
		}
	}

	next();
}

// End session (call this when user logs out or closes browser)
export async function endSession(sessionId, store) {
	const session = activeSessions.get(sessionId);
	if (session && !session.endTime) {
		const endTime = new Date().toISOString();
		const startTime = new Date(session.startTime);
		const duration = Math.round((new Date(endTime) - startTime) / 1000); // seconds

		session.endTime = endTime;
		session.duration = duration;
		session.updatedAt = endTime;

		if (store && store.sessions) {
			try {
				await store.sessions.update(session.id, {
					endTime: endTime,
					duration: duration,
					updatedAt: endTime
				});
			} catch (err) {
				console.error('Failed to update session:', err);
			}
		}

		activeSessions.delete(sessionId);
	}
}
