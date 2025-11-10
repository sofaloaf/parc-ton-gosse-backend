import { v4 as uuidv4 } from 'uuid';

// CSRF protection middleware (double-submit cookie pattern)
export function csrfProtection() {
	return (req, res, next) => {
		// Always set CSRF token cookie if not present (for GET requests and initial page load)
		if (!req.cookies['csrf-token']) {
			const token = uuidv4();
			res.cookie('csrf-token', token, {
				httpOnly: false, // Must be readable by JavaScript
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: 24 * 60 * 60 * 1000 // 24 hours
			});
		}

		// Skip CSRF verification for GET, HEAD, OPTIONS requests
		if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
			return next();
		}

		// For state-changing requests, verify CSRF token
		const cookieToken = req.cookies['csrf-token'];
		const headerToken = req.headers['x-csrf-token'];

		// Allow requests without CSRF token in development (for easier testing)
		if (process.env.NODE_ENV === 'development' && !headerToken) {
			return next();
		}

		if (!cookieToken || !headerToken || cookieToken !== headerToken) {
			return res.status(403).json({ error: 'CSRF token mismatch' });
		}

		next();
	};
}

// Generate CSRF token endpoint
export function generateCsrfToken(req, res) {
	const token = uuidv4();
	res.cookie('csrf-token', token, {
		httpOnly: false, // Must be readable by JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 24 * 60 * 60 * 1000 // 24 hours
	});
	res.json({ csrfToken: token });
}

