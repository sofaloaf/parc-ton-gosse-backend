import Joi from 'joi';

// Environment variable validation schema
export const envSchema = Joi.object({
	NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
	PORT: Joi.number().default(4000),
	JWT_SECRET: Joi.string().when('NODE_ENV', {
		is: 'production',
		then: Joi.string().min(16).required(), // Reduced from 32 to 16 for flexibility
		otherwise: Joi.optional()
	}),
	CORS_ORIGIN: Joi.string().optional().allow(''), // Allow empty initially, will be set after frontend deploy
	DATA_BACKEND: Joi.string().valid('memory', 'airtable', 'sheets').default('memory'),
	STRIPE_SECRET_KEY: Joi.string().optional().allow(''), // Allow empty - Stripe is optional
	STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''), // Allow empty - Stripe is optional
	GOOGLE_CLIENT_ID: Joi.string().optional(),
	GS_SERVICE_ACCOUNT: Joi.string().optional(),
	GS_PRIVATE_KEY: Joi.string().optional(),
	GS_SHEET_ID: Joi.string().optional().allow(''),
	AIRTABLE_API_KEY: Joi.string().optional().allow(''),
	AIRTABLE_BASE_ID: Joi.string().optional().allow('')
}).unknown();

// Validate environment variables
export function validateEnv() {
	const { error, value } = envSchema.validate(process.env);
	if (error) {
		throw new Error(`Environment validation error: ${error.details.map(d => d.message).join(', ')}`);
	}
	return value;
}

// Helper to sanitize error messages for production
export function sanitizeError(error, isProduction = false) {
	if (!isProduction) {
		return error.message || 'An error occurred';
	}
	
	// Generic error messages for production
	if (error.message?.includes('password') || error.message?.includes('credential')) {
		return 'Invalid credentials';
	}
	if (error.message?.includes('email')) {
		return 'Invalid email address';
	}
	if (error.message?.includes('token') || error.message?.includes('unauthorized')) {
		return 'Authentication required';
	}
	if (error.message?.includes('forbidden')) {
		return 'Access denied';
	}
	
	return 'An error occurred. Please try again.';
}

