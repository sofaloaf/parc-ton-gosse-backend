import { v4 as uuidv4 } from 'uuid';

function createCrud(list) {
	return {
		list: async (q = {}) => list.filter(() => true),
		get: async (id) => list.find((x) => x.id === id) || null,
		create: async (obj) => {
			const id = obj.id || uuidv4();
			const created = { ...obj, id };
			list.push(created);
			return created;
		},
		update: async (id, patch) => {
			const idx = list.findIndex((x) => x.id === id);
			if (idx === -1) return null;
			list[idx] = { ...list[idx], ...patch };
			return list[idx];
		},
		remove: async (id) => {
			const idx = list.findIndex((x) => x.id === id);
			if (idx === -1) return false;
			list.splice(idx, 1);
			return true;
		}
	};
}

export function createMemoryStore() {
	const users = [
		{
			id: 'user-1',
			email: 'admin@example.com',
			password: 'admin123',
			role: 'admin',
			profile: {},
			createdAt: new Date().toISOString()
		},
		{
			id: 'user-2',
			email: 'provider@example.com',
			password: 'provider123',
			role: 'provider',
			profile: {},
			createdAt: new Date().toISOString()
		}
	];
	const activities = [
		{
			id: 'activity-1',
			title: { en: 'Music Workshop', fr: 'Atelier Musique' },
			description: { en: 'Introduction to music for children', fr: 'Introduction à la musique pour enfants' },
			categories: ['music', 'arts'],
			ageMin: 6,
			ageMax: 9,
			price: { amount: 1500, currency: 'eur' },
			schedule: [{ date: '2025-11-10', time: '14:00', location: 'Paris 11e' }],
			neighborhood: '11e',
			images: ['https://via.placeholder.com/300'],
			providerId: 'provider-1',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'activity-2',
			title: { en: 'Soccer Training', fr: 'Entraînement Football' },
			description: { en: 'Weekly soccer training sessions', fr: 'Entraînements de football hebdomadaires' },
			categories: ['sports'],
			ageMin: 8,
			ageMax: 12,
			price: { amount: 2000, currency: 'eur' },
			schedule: [{ date: '2025-11-15', time: '10:00', location: 'Paris 16e' }],
			neighborhood: '16e',
			images: ['https://via.placeholder.com/300'],
			providerId: 'provider-2',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		},
		{
			id: 'activity-3',
			title: { en: 'Art & Craft', fr: 'Arts et Créations' },
			description: { en: 'Creative art and craft sessions', fr: 'Ateliers d\'arts créatifs' },
			categories: ['arts', 'nature'],
			ageMin: 4,
			ageMax: 7,
			price: { amount: 1200, currency: 'eur' },
			schedule: [{ date: '2025-11-20', time: '15:00', location: 'Paris 5e' }],
			neighborhood: '5e',
			images: ['https://via.placeholder.com/300'],
			providerId: 'provider-3',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		}
	];
	const registrations = [];
	const reviews = [];
	const i18n = { // simple key-value by locale
		'en': {},
		'fr': {}
	};

	const store = {
		users: {
			...createCrud(users),
			findByEmail: async (email) => users.find((u) => u.email === email) || null
		},
		activities: createCrud(activities),
		registrations: createCrud(registrations),
		reviews: createCrud(reviews),
		i18n: {
			getAll: async () => i18n,
			getLocale: async (locale) => i18n[locale] || {},
			setKey: async (locale, key, value) => {
				i18n[locale] = i18n[locale] || {};
				i18n[locale][key] = value;
				return { key, value };
			}
		}
	};
	return store;
}


