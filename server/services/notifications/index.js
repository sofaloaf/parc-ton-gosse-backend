export async function sendEmail({ to, subject, html }) {
	if (!process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
		console.log('[Email stub]', { to, subject });
		return { ok: true, stub: true };
	}
	// Implement SendGrid/SMTP here
	throw new Error('Email provider not configured');
}

export async function sendSMS({ to, message }) {
	if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN) {
		console.log('[SMS stub]', { to, message });
		return { ok: true, stub: true };
	}
	// Implement Twilio here
	throw new Error('SMS provider not configured');
}


