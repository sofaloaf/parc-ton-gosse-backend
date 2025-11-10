import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// Sheet names and expected structure
const SHEETS = {
	users: 'Users',
	activities: 'Activities',
	registrations: 'Registrations',
	reviews: 'Reviews',
	i18n: 'i18n'
};

// Helper to get auth client
function getAuthClient(serviceAccount, privateKey) {
	const auth = new google.auth.JWT(
		serviceAccount,
		null,
		privateKey?.replace(/\\n/g, '\n'),
		['https://www.googleapis.com/auth/spreadsheets']
	);
	return auth;
}

// Helper to read sheet data
async function readSheet(sheets, sheetId, sheetName) {
	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `${sheetName}!A:Z`
		});
		const rows = response.data.values || [];
		if (rows.length === 0) return [];
		const headers = rows[0];
		return rows.slice(1).map(row => {
			const obj = {};
			headers.forEach((h, i) => {
				let val = row[i] || '';
				if (h === 'id') obj[h] = val;
				else if (val.startsWith('{') || val.startsWith('[')) {
					try { obj[h] = JSON.parse(val); } catch { obj[h] = val; }
				} else {
					obj[h] = val;
				}
			});
			return obj;
		}).filter(row => row.id);
	} catch (e) {
		if (e.message?.includes('Unable to parse range')) {
			return [];
		}
		throw e;
	}
}

// Helper to write sheet data
async function writeSheet(sheets, sheetId, sheetName, data) {
	const headers = Object.keys(data[0] || {});
	const rows = [headers, ...data.map(obj => headers.map(h => {
		const val = obj[h];
		return typeof val === 'object' ? JSON.stringify(val) : String(val || '');
	}))];
	await sheets.spreadsheets.values.update({
		spreadsheetId: sheetId,
		range: `${sheetName}!A1`,
		valueInputOption: 'RAW',
		resource: { values: rows }
	});
}

// Helper to ensure sheet exists
async function ensureSheet(sheets, sheetId, sheetName) {
	try {
		const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
		const exists = meta.data.sheets?.some(s => s.properties.title === sheetName);
		if (!exists) {
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId: sheetId,
				requestBody: {
					requests: [{
						addSheet: { properties: { title: sheetName } }
					}]
				}
			});
		}
	} catch (e) {
		console.warn(`Sheet ${sheetName} may not exist:`, e.message);
	}
}

export async function createSheetsStore({ serviceAccount, privateKey, sheetId }) {
	if (!serviceAccount || !privateKey || !sheetId) {
		throw new Error('Google Sheets credentials required: GS_SERVICE_ACCOUNT, GS_PRIVATE_KEY, GS_SHEET_ID');
	}

	const auth = getAuthClient(serviceAccount, privateKey);
	const sheets = google.sheets({ version: 'v4', auth });

	// Initialize sheets with headers if they don't exist
	await Promise.all([
		ensureSheet(sheets, sheetId, SHEETS.users),
		ensureSheet(sheets, sheetId, SHEETS.activities),
		ensureSheet(sheets, sheetId, SHEETS.registrations),
		ensureSheet(sheets, sheetId, SHEETS.reviews),
		ensureSheet(sheets, sheetId, SHEETS.i18n)
	]);

	// Helper to create CRUD for a sheet
	function createCrud(sheetName, defaultHeaders = []) {
		return {
			list: async () => {
				const all = await readSheet(sheets, sheetId, sheetName);
				if (all.length === 0 && defaultHeaders.length > 0) {
					await writeSheet(sheets, sheetId, sheetName, [defaultHeaders.reduce((o, h) => ({ ...o, [h]: '' }), {})]);
				}
				return all;
			},
			get: async (id) => {
				const all = await readSheet(sheets, sheetId, sheetName);
				return all.find(r => r.id === id) || null;
			},
			create: async (obj) => {
				if (!obj.id) obj.id = uuidv4();
				const all = await readSheet(sheets, sheetId, sheetName);
				all.push(obj);
				await writeSheet(sheets, sheetId, sheetName, all);
				return obj;
			},
			update: async (id, patch) => {
				const all = await readSheet(sheets, sheetId, sheetName);
				const idx = all.findIndex(r => r.id === id);
				if (idx === -1) return null;
				all[idx] = { ...all[idx], ...patch };
				await writeSheet(sheets, sheetId, sheetName, all);
				return all[idx];
			},
			remove: async (id) => {
				const all = await readSheet(sheets, sheetId, sheetName);
				const idx = all.findIndex(r => r.id === id);
				if (idx === -1) return false;
				all.splice(idx, 1);
				await writeSheet(sheets, sheetId, sheetName, all);
				return true;
			}
		};
	}

	return {
		users: {
			...createCrud(SHEETS.users, ['id', 'email', 'password', 'role', 'profile', 'createdAt']),
			findByEmail: async (email) => {
				const all = await readSheet(sheets, sheetId, SHEETS.users);
				return all.find(u => u.email === email) || null;
			}
		},
		activities: createCrud(SHEETS.activities, ['id', 'title', 'description', 'categories', 'ageMin', 'ageMax', 'price', 'schedule', 'neighborhood', 'images', 'providerId', 'createdAt', 'updatedAt']),
		registrations: createCrud(SHEETS.registrations, ['id', 'activityId', 'parentId', 'status', 'waitlist', 'form', 'createdAt', 'updatedAt']),
		reviews: createCrud(SHEETS.reviews, ['id', 'activityId', 'parentId', 'rating', 'comment', 'status', 'createdAt', 'updatedAt']),
		i18n: {
			getAll: async () => {
				const all = await readSheet(sheets, sheetId, SHEETS.i18n);
				const dict = { en: {}, fr: {} };
				all.forEach(row => {
					if (row.locale && row.key && row.value) {
						dict[row.locale] = dict[row.locale] || {};
						dict[row.locale][row.key] = row.value;
					}
				});
				return dict;
			},
			getLocale: async (locale) => {
				const all = await readSheet(sheets, sheetId, SHEETS.i18n);
				const dict = {};
				all.filter(r => r.locale === locale).forEach(r => {
					if (r.key && r.value) dict[r.key] = r.value;
				});
				return dict;
			},
			setKey: async (locale, key, value) => {
				const all = await readSheet(sheets, sheetId, SHEETS.i18n);
				const idx = all.findIndex(r => r.locale === locale && r.key === key);
				if (idx >= 0) {
					all[idx].value = value;
				} else {
					all.push({ locale, key, value });
				}
				await writeSheet(sheets, sheetId, SHEETS.i18n, all);
				return { key, value };
			}
		}
	};
}
