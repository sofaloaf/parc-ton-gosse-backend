export function createAirtableStore({ apiKey, baseId }) {
	if (!apiKey || !baseId) {
		console.warn('[Airtable] Missing credentials, falling back to memory store-like behavior');
	}
	// Minimal stub: replace with Airtable SDK integration as needed
	const notReady = () => { throw new Error('Airtable store not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID'); };
	return {
		users: { list: notReady, get: notReady, create: notReady, update: notReady, remove: notReady, findByEmail: notReady },
		activities: { list: notReady, get: notReady, create: notReady, update: notReady, remove: notReady },
		registrations: { list: notReady, get: notReady, create: notReady, update: notReady, remove: notReady },
		reviews: { list: notReady, get: notReady, create: notReady, update: notReady, remove: notReady },
		i18n: { getAll: notReady, getLocale: notReady, setKey: notReady }
	};
}


