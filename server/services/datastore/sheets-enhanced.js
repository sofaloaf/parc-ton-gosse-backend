import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// Sheet names
const SHEETS = {
	users: 'Users',
	activities: 'Activities',
	registrations: 'Registrations',
	reviews: 'Reviews',
	i18n: 'i18n',
	feedback: 'Feedback',
	organizationSuggestions: 'Organization Suggestions',
	logins: 'Logins',
	sessions: 'Sessions',
	preorders: 'Preorders'
};

// Column mapping configuration - maps Google Sheet column names to our app's field names
// This allows flexible naming in sheets
const COLUMN_MAPPINGS = {
	activities: {
		// Bilingual fields can be named various ways
		'title': ['title', 'Title', 'Titre', 'Nom'],
		'title_en': ['title_en', 'title en', 'Title EN', 'Title (English)', 'Titre Anglais', 'Nom EN'],
		'title_fr': ['title_fr', 'title fr', 'Title FR', 'Title (French)', 'Titre Français', 'Nom FR'],
		'description': ['description', 'Description', 'Desc'],
		'description_en': ['description_en', 'description en', 'Description EN', 'Description (English)'],
		'description_fr': ['description_fr', 'description fr', 'Description FR', 'Description (French)'],
		'categories': ['categories', 'Category', 'Categories', 'Catégories'],
		'activityType': ['activityType', 'activity_type', 'Type d\'activité', 'Type d\'activit_'],
		'adults': ['adults', 'Adults', 'Adultes'],
		'websiteLink': ['websiteLink', 'website_link', 'Lien du site', 'Website Link'],
		'registrationLink': ['registrationLink', 'registration_link', 'Lien pour s\'enregistrer', 'Registration Link'],
		'disponibiliteJours': ['disponibiliteJours', 'disponibilite_jours', 'Disponibilité (jours)', 'Availability (days)'],
		'disponibiliteDates': ['disponibiliteDates', 'disponibilite_dates', 'Disponibilité (dates)', 'Availability (dates)'],
		'ageMin': ['ageMin', 'age_min', 'Age Min', 'Age Minimum', 'Âge Min'],
		'ageMax': ['ageMax', 'age_max', 'Age Max', 'Age Maximum', 'Âge Max'],
		'price': ['price', 'Price', 'Prix'],
		'price_amount': ['price_amount', 'price amount', 'Amount'],
		'currency': ['currency', 'Currency', 'Devise'],
		'schedule': ['schedule', 'Schedule', 'Dates', 'Horaires'],
		'addresses': ['addresses', 'addresses', 'Addresses', 'Adresses', 'locations'],
		'neighborhood': ['neighborhood', 'Neighborhood', 'Quartier', 'Area'],
		'locationDetails': ['locationDetails', 'location_details', 'Location Details', 'Détails Lieu', 'schedule_info'],
		'images': ['images', 'Images', 'Photos'],
		'providerId': ['providerId', 'provider_id', 'Provider', 'Prestataire'],
		'contactEmail': ['contactEmail', 'contact_email', 'Contact__Email_', 'Contact Email', 'Email Contact'],
		'contactPhone': ['contactPhone', 'contact_phone', 'Contact__T_l_phone_', 'Contact Téléphone', 'Contact Phone', 'Téléphone Contact'],
		'additionalNotes': ['additionalNotes', 'additional_notes', 'Notes_sp_cifiques_additionelles', 'Additional Notes', 'Notes Additionnelles', 'Notes spécifiques'],
		'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
		'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
	},
	users: {
		'email': ['email', 'Email', 'E-mail'],
		'password': ['password', 'Password', 'Mot de passe'],
		'role': ['role', 'Role', 'Rôle'],
		'profile': ['profile', 'Profile', 'Profil']
	},
	registrations: {
		'activityId': ['activityId', 'activity_id', 'Activity ID', 'Activité'],
		'parentId': ['parentId', 'parent_id', 'Parent ID', 'Parent'],
		'childName': ['childName', 'child_name', 'Child Name', 'Nom de l\'enfant'],
		'parentName': ['parentName', 'parent_name', 'Parent Name', 'Nom du parent'],
		'email': ['email', 'Email', 'E-mail', 'Adresse e-mail'],
		'age': ['age', 'Age', 'Âge'],
		'specialRequests': ['specialRequests', 'special_requests', 'Special Requests', 'Demandes spéciales'],
		'organizationName': ['organizationName', 'organization_name', 'Organization', 'Organisation', 'Organization Name'],
		'reservedAt': ['reservedAt', 'reserved_at', 'Reserved At', 'Réservé le', 'Reservation Time'],
		'status': ['status', 'Status', 'Statut'],
		'waitlist': ['waitlist', 'Waitlist', 'Liste d\'attente'],
		'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
		'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
	},
	reviews: {
		'activityId': ['activityId', 'activity_id', 'Activity ID'],
		'parentId': ['parentId', 'parent_id', 'Parent ID'],
		'rating': ['rating', 'Rating', 'Note', 'Stars'],
		'comment': ['comment', 'Comment', 'Commentaire']
	},
	i18n: {
		'locale': ['locale', 'Locale', 'Langue'],
		'key': ['key', 'Key', 'Clé'],
		'value': ['value', 'Value', 'Valeur']
	},
	feedback: {
		'userId': ['userId', 'user_id', 'User ID'],
		'feedback': ['feedback', 'Feedback', 'Commentaires', 'Feedback Text'],
		'rating': ['rating', 'Rating', 'Évaluation'],
		'category': ['category', 'Category', 'Catégorie'],
		'suggestion': ['suggestion', 'Suggestion', 'Idée'],
		'status': ['status', 'Status', 'Statut'],
		'timestamp': ['timestamp', 'Timestamp', 'Date et heure'],
		'userAgent': ['userAgent', 'user_agent', 'User Agent'],
		'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
		'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
	},
	organizationSuggestions: {
		'userId': ['userId', 'user_id', 'User ID'],
		'organizationName': ['organizationName', 'organization_name', 'Organization Name', 'Nom de l\'organisation'],
		'organizationEmail': ['organizationEmail', 'organization_email', 'Email', 'Organisation Email'],
		'organizationPhone': ['organizationPhone', 'organization_phone', 'Phone', 'Téléphone'],
		'organizationAddress': ['organizationAddress', 'organization_address', 'Address', 'Adresse'],
		'activityName': ['activityName', 'activity_name', 'Activity Name', 'Nom de l\'activité'],
		'activityDescription': ['activityDescription', 'activity_description', 'Description'],
		'activityType': ['activityType', 'activity_type', 'Activity Type', 'Type d\'activité'],
		'categories': ['categories', 'Categories', 'Catégories'],
		'ageMin': ['ageMin', 'age_min', 'Min Age', 'Âge Min'],
		'ageMax': ['ageMax', 'age_max', 'Max Age', 'Âge Max'],
		'price': ['price', 'Price', 'Prix'],
		'websiteLink': ['websiteLink', 'website_link', 'Website Link', 'Lien du site'],
		'additionalInfo': ['additionalInfo', 'additional_info', 'Additional Info', 'Infos additionnelles'],
		'status': ['status', 'Status', 'Statut'],
		'reviewedBy': ['reviewedBy', 'reviewed_by', 'Reviewed By'],
		'reviewedAt': ['reviewedAt', 'reviewed_at', 'Reviewed At'],
		'timestamp': ['timestamp', 'Timestamp', 'Date et heure'],
		'userAgent': ['userAgent', 'user_agent', 'User Agent'],
		'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
		'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
	},
	logins: {
		'email': ['email', 'Email', 'E-mail'],
		'timestamp': ['timestamp', 'Timestamp', 'Date et heure', 'Login Time'],
		'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
		'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
	},
		sessions: {
			'userId': ['userId', 'user_id', 'User ID'],
			'email': ['email', 'Email', 'E-mail'],
			'startTime': ['startTime', 'start_time', 'Start Time', 'Début'],
			'endTime': ['endTime', 'end_time', 'End Time', 'Fin'],
			'duration': ['duration', 'Duration', 'Durée (secondes)', 'Duration (seconds)'],
			'pageViews': ['pageViews', 'page_views', 'Page Views', 'Pages vues'],
			'pages': ['pages', 'Pages', 'Pages visitées'],
			'userAgent': ['userAgent', 'user_agent', 'User Agent'],
			'ip': ['ip', 'IP Address', 'Adresse IP'],
			'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
			'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
		},
		preorders: {
			'userId': ['userId', 'user_id', 'User ID'],
			'userEmail': ['userEmail', 'user_email', 'Email', 'E-mail'],
			'paymentIntentId': ['paymentIntentId', 'payment_intent_id', 'Payment Intent ID', 'Stripe Payment ID'],
			'amount': ['amount', 'Amount', 'Montant'],
			'promoCode': ['promoCode', 'promo_code', 'Promo Code', 'Code Promo'],
			'status': ['status', 'Status', 'Statut'],
			'createdAt': ['createdAt', 'created_at', 'Created At', 'Date de création'],
			'updatedAt': ['updatedAt', 'updated_at', 'Updated At', 'Date de mise à jour']
		}
	};

// Helper to normalize column names (trim, lowercase, remove special chars)
function normalizeColumnName(colName) {
	if (!colName) return '';
	return String(colName).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

// Helper to find the correct field name for a given column name
function findFieldName(sheetType, columnName, mappings = COLUMN_MAPPINGS) {
	const sheetMapping = mappings[sheetType] || {};
	
	// Try exact match first
	for (const [fieldName, variations] of Object.entries(sheetMapping)) {
		if (variations.includes(columnName)) {
			return fieldName;
		}
	}
	
	// Try normalized match
	const normalized = normalizeColumnName(columnName);
	for (const [fieldName, variations] of Object.entries(sheetMapping)) {
		const normalizedVariations = variations.map(v => normalizeColumnName(v));
		if (normalizedVariations.includes(normalized)) {
			return fieldName;
		}
	}
	
	// Return normalized version if no mapping found
	return normalized;
}

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

// Enhanced helper to read sheet data with dynamic column mapping
async function readSheet(sheets, sheetId, sheetName, sheetType = 'activities') {
	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `${sheetName}!A:Z`
		});
		const rows = response.data.values || [];
		if (rows.length === 0) return [];
		
		const headerRow = rows[0];
		// Map column names to field names using our mapping
		const columnMap = {};
		const masterColumnOrder = []; // Master column order from headers (no duplicates)
		headerRow.forEach((colName, index) => {
			const fieldName = findFieldName(sheetType, colName);
			columnMap[index] = fieldName;
			// Only add to masterColumnOrder if not already present (handle duplicate headers)
			if (!masterColumnOrder.includes(fieldName)) {
				masterColumnOrder.push(fieldName);
			}
		});
		
		// Process rows
		const processedRows = rows.slice(1).map(row => {
			const obj = { id: null };
			const columnOrder = [...masterColumnOrder]; // Use master column order as base
			
			headerRow.forEach((colName, i) => {
				const fieldName = columnMap[i];
				let val = row[i] || '';
				
				// Handle ID specially
				if (fieldName === 'id') {
					obj.id = val;
				}
				// Handle JSON fields
				else if (val && (val.startsWith('{') || val.startsWith('['))) {
					try { 
						obj[fieldName] = JSON.parse(val); 
					} catch { 
						obj[fieldName] = val; 
					}
				}
				// Handle boolean fields
				else if (fieldName === 'waitlist' || fieldName === 'status') {
					obj[fieldName] = val === 'true' || val === '1' || val === 'yes' || val === 'oui';
				}
				// Handle numeric fields
				else if (fieldName.includes('age') || fieldName.includes('price') || fieldName === 'rating') {
					obj[fieldName] = val ? Number(val) : val;
				}
				// Handle regular strings (including empty strings)
				else if (i < row.length) {
					obj[fieldName] = val;
				}
			});
			
			// Combine bilingual fields if they exist as separate columns
			if (obj.title_en || obj.title_fr) {
				// Find first position of title_en or title_fr in columnOrder
				const titlePos = columnOrder.findIndex(c => c === 'title_en' || c === 'title_fr');
				obj.title = {
					en: obj.title_en || '',
					fr: obj.title_fr || ''
				};
				delete obj.title_en;
				delete obj.title_fr;
				// Replace title_en/title_fr positions with single 'title'
				if (titlePos >= 0) {
					// Remove both title_en and title_fr
					const filtered = columnOrder.filter(c => c !== 'title_en' && c !== 'title_fr');
					// Insert 'title' at the first original position
					filtered.splice(titlePos, 0, 'title');
					columnOrder.length = 0;
					columnOrder.push(...filtered);
				}
			}
			if (obj.description_en || obj.description_fr) {
				// Find first position of description_en or description_fr in columnOrder
				const descPos = columnOrder.findIndex(c => c === 'description_en' || c === 'description_fr');
				obj.description = {
					en: obj.description_en || '',
					fr: obj.description_fr || ''
				};
				delete obj.description_en;
				delete obj.description_fr;
				// Replace description_en/description_fr positions with single 'description'
				if (descPos >= 0) {
					// Remove both description_en and description_fr
					const filtered = columnOrder.filter(c => c !== 'description_en' && c !== 'description_fr');
					// Insert 'description' at the first original position
					filtered.splice(descPos, 0, 'description');
					columnOrder.length = 0;
					columnOrder.push(...filtered);
				}
			}
			
			// Fix arrays for categories and images
			if (typeof obj.categories === 'string') {
				obj.categories = obj.categories.split(',').map(s => s.trim()).filter(s => s);
			}
			if (typeof obj.images === 'string' && obj.images !== '0') {
				obj.images = obj.images.split(',').map(s => s.trim()).filter(s => s);
			} else if (obj.images === '0' || !obj.images) {
				obj.images = [];
			}
			
			// Fix price object
			if (typeof obj.price === 'number') {
				obj.price = { amount: obj.price, currency: 'eur' };
			}
			
			// Auto-fill neighborhood from addresses if missing
			if (!obj.neighborhood && (obj.addresses || obj.addresse)) {
				const addressStr = obj.addresses || obj.addresse;
				// Extract postal code or arrondissement (various formats)
				const postalMatch = addressStr.match(/75(\d{3})/);
				const arrondMatch1 = addressStr.match(/(\d{1,2})(?:er|e)\s/);  // "20e "
				const arrondMatch2 = addressStr.match(/Paris\s(\d{1,2})(?:er|e)/);  // "Paris 20e"
				const arrondMatch3 = addressStr.match(/Paris\s(\d{1,2})[\s,]/);  // "Paris 20" (without e)
				const arrondMatch4 = addressStr.match(/(\d{1,2})(?:ème|eme)/);  // "10ème" "20eme"
				const arrondMatch5 = addressStr.match(/\((\d{1,2})\)/);  // "(18)" or "(20)"
				
				// Known locations mapping
				const knownLocations = {
					'Belleville': '19e', 'Menilmontant': '20e',
					'Bidassoa': '20e', 'Orteaux': '20e',
					'Nation': '12e', 'Roquepine': '8e',
					'Jussieu': '5e', 'Luxembourg': '6e',
					'Rasselins': '20e', 'Rigoles': '20e',
					'Gambetta': '20e', 'Couronnes': '20e',
					'Davout': '20e', 'Pelleport': '20e',
					'Maraichers': '20e', 'Delgrès': '20e',
					'Dénoyez': '20e', 'Déjerine': '20e',
					'Nakache': '20e', 'Charonne': '11e',
					'CHARONNE': '11e', 'Planchat': '11e',
					'Vercors': '12e', 'Ramus': '20e',
					'Lumiére': '20e', 'Lumière': '20e',
					'Louis Ganne': '20e', 'Frapié': '20e',
					'Boyer': '20e'
				};
				
				if (postalMatch) {
					const arrond = postalMatch[1];
					// Remove leading zero
					const arrondNum = String(parseInt(arrond, 10));
					obj.neighborhood = arrondNum === '1' ? '1er' : arrondNum + 'e';
				} else if (arrondMatch1) {
					const num = arrondMatch1[1];
					obj.neighborhood = num === '1' ? '1er' : num + 'e';
				} else if (arrondMatch2) {
					const num = arrondMatch2[1];
					obj.neighborhood = num === '1' ? '1er' : num + 'e';
				} else if (arrondMatch3) {
					const num = arrondMatch3[1];
					obj.neighborhood = num === '1' ? '1er' : num + 'e';
				} else if (arrondMatch4) {
					const num = arrondMatch4[1];
					obj.neighborhood = num === '1' ? '1er' : num + 'e';
				} else if (arrondMatch5) {
					const num = arrondMatch5[1];
					obj.neighborhood = num === '1' ? '1er' : num + 'e';
				} else {
					// Try known locations
					for (const [location, neighborhood] of Object.entries(knownLocations)) {
						if (addressStr.includes(location)) {
							obj.neighborhood = neighborhood;
							break;
						}
					}
				}
			}
			
			// Store column order as metadata (will be used by frontend)
			obj._columnOrder = columnOrder;
			
			return obj;
		});
		
		return processedRows.filter(row => row.id); // Only return rows with IDs
	} catch (e) {
		if (e.message?.includes('Unable to parse range')) {
			return [];
		}
		throw e;
	}
}

// Helper to write sheet data - uses current column mapping
async function writeSheet(sheets, sheetId, sheetName, data, sheetType = 'activities') {
	if (!data || data.length === 0) return;
	
	try {
		// Get current headers from the sheet
		const currentHeaders = await getSheetHeaders(sheets, sheetId, sheetName);
		
		// Determine headers: use current if they exist, otherwise infer from data
		// But also check if we need to add new columns from the mapping
		const mapping = COLUMN_MAPPINGS[sheetType] || {};
		const expectedHeaders = Object.keys(mapping);
		const dataKeys = Object.keys(data[0] || {});
		
		// Merge current headers with expected headers to catch any new fields
		let headers = currentHeaders.length > 0 ? currentHeaders : expectedHeaders;
		
		// Add any missing headers from data or mapping
		dataKeys.forEach(key => {
			if (!headers.includes(key)) {
				headers.push(key);
			}
		});
		expectedHeaders.forEach(key => {
			if (!headers.includes(key)) {
				headers.push(key);
			}
		});
		
		const rows = [headers];
		data.forEach(obj => {
			const row = headers.map(h => {
				const val = obj[h];
				if (val === null || val === undefined) return '';
				return typeof val === 'object' ? JSON.stringify(val) : String(val);
			});
			rows.push(row);
		});
		
		await sheets.spreadsheets.values.update({
			spreadsheetId: sheetId,
			range: `${sheetName}!A1`,
			valueInputOption: 'RAW',
			resource: { values: rows }
		});
	} catch (error) {
		console.error(`[Google Sheets] Error writing to ${sheetName}:`, error.message);
		throw error;
	}
}

// Helper to get current headers from a sheet
async function getSheetHeaders(sheets, sheetId, sheetName) {
	try {
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: `${sheetName}!1:1`
		});
		return response.data.values?.[0] || [];
	} catch (e) {
		return [];
	}
}

// Helper to ensure sheet exists with proper headers
async function ensureSheet(sheets, sheetId, sheetName, sheetType) {
	try {
		const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
		const exists = meta.data.sheets?.some(s => s.properties.title === sheetName);
		
		if (!exists) {
			// Create sheet
			await sheets.spreadsheets.batchUpdate({
				spreadsheetId: sheetId,
				requestBody: {
					requests: [{
						addSheet: { properties: { title: sheetName } }
					}]
				}
			});
			
			// Add headers based on mapping
			const mapping = COLUMN_MAPPINGS[sheetType] || {};
			const headers = Object.keys(mapping);
			await sheets.spreadsheets.values.update({
				spreadsheetId: sheetId,
				range: `${sheetName}!A1`,
				valueInputOption: 'RAW',
				resource: { values: [headers] }
			});
		}
	} catch (e) {
		console.warn(`Sheet ${sheetName} may not exist:`, e.message);
	}
}

export async function createSheetsStore({ serviceAccount, privateKey, sheetId }) {
	if (!serviceAccount || !privateKey || !sheetId) {
		const missing = [];
		if (!serviceAccount) missing.push('GS_SERVICE_ACCOUNT');
		if (!privateKey) missing.push('GS_PRIVATE_KEY');
		if (!sheetId) missing.push('GS_SHEET_ID');
		throw new Error(`Google Sheets credentials required but missing: ${missing.join(', ')}. Set DATA_BACKEND=memory to use memory backend instead.`);
	}

	const auth = getAuthClient(serviceAccount, privateKey);
	const sheets = google.sheets({ version: 'v4', auth });

	// Initialize sheets with headers if they don't exist
	await Promise.all([
		ensureSheet(sheets, sheetId, SHEETS.users, 'users'),
		ensureSheet(sheets, sheetId, SHEETS.activities, 'activities'),
		ensureSheet(sheets, sheetId, SHEETS.registrations, 'registrations'),
		ensureSheet(sheets, sheetId, SHEETS.reviews, 'reviews'),
		ensureSheet(sheets, sheetId, SHEETS.i18n, 'i18n'),
		ensureSheet(sheets, sheetId, SHEETS.feedback, 'feedback'),
		ensureSheet(sheets, sheetId, SHEETS.organizationSuggestions, 'organizationSuggestions'),
		ensureSheet(sheets, sheetId, SHEETS.logins, 'logins'),
		ensureSheet(sheets, sheetId, SHEETS.sessions, 'sessions'),
		ensureSheet(sheets, sheetId, SHEETS.preorders, 'preorders')
	]);

	// Helper to create CRUD for a sheet
	function createCrud(sheetName, sheetType) {
		return {
			list: async () => {
				const all = await readSheet(sheets, sheetId, sheetName, sheetType);
				return all;
			},
			get: async (id) => {
				const all = await readSheet(sheets, sheetId, sheetName, sheetType);
				return all.find(r => r.id === id) || null;
			},
			create: async (obj) => {
				if (!obj.id) obj.id = uuidv4();
				const all = await readSheet(sheets, sheetId, sheetName, sheetType);
				all.push(obj);
				await writeSheet(sheets, sheetId, sheetName, all, sheetType);
				return obj;
			},
			update: async (id, patch) => {
				const all = await readSheet(sheets, sheetId, sheetName, sheetType);
				const idx = all.findIndex(r => r.id === id);
				if (idx === -1) return null;
				all[idx] = { ...all[idx], ...patch };
				await writeSheet(sheets, sheetId, sheetName, all, sheetType);
				return all[idx];
			},
			remove: async (id) => {
				const all = await readSheet(sheets, sheetId, sheetName, sheetType);
				const idx = all.findIndex(r => r.id === id);
				if (idx === -1) return false;
				all.splice(idx, 1);
				await writeSheet(sheets, sheetId, sheetName, all, sheetType);
				return true;
			}
		};
	}

	return {
		users: {
			...createCrud(SHEETS.users, 'users'),
			findByEmail: async (email) => {
				const all = await readSheet(sheets, sheetId, SHEETS.users, 'users');
				return all.find(u => u.email === email) || null;
			}
		},
		activities: createCrud(SHEETS.activities, 'activities'),
		registrations: createCrud(SHEETS.registrations, 'registrations'),
		reviews: createCrud(SHEETS.reviews, 'reviews'),
		feedback: createCrud(SHEETS.feedback, 'feedback'),
		organizationSuggestions: createCrud(SHEETS.organizationSuggestions, 'organizationSuggestions'),
		logins: createCrud(SHEETS.logins, 'logins'),
		sessions: createCrud(SHEETS.sessions, 'sessions'),
		preorders: createCrud(SHEETS.preorders, 'preorders'),
		i18n: {
			getAll: async () => {
				const all = await readSheet(sheets, sheetId, SHEETS.i18n, 'i18n');
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
				const all = await readSheet(sheets, sheetId, SHEETS.i18n, 'i18n');
				const dict = {};
				all.filter(r => r.locale === locale).forEach(r => {
					if (r.key && r.value) dict[r.key] = r.value;
				});
				return dict;
			},
			setKey: async (locale, key, value) => {
				const all = await readSheet(sheets, sheetId, SHEETS.i18n, 'i18n');
				const idx = all.findIndex(r => r.locale === locale && r.key === key);
				if (idx >= 0) {
					all[idx].value = value;
				} else {
					all.push({ locale, key, value });
				}
				await writeSheet(sheets, sheetId, SHEETS.i18n, all, 'i18n');
				return { key, value };
			}
		}
	};
}


